import 'server-only';
import crypto from 'node:crypto';
import { env } from '@/lib/env.mjs';

/**
 * Uygulama katmanı PII kriptografisi.
 *
 * İKİ AYRI İHTİYAÇ, İKİ AYRI YÖNTEM:
 *
 *  1. Yalnızca EŞLEŞTİRME gereken veri (ör. TCKN — "bu kişi daha önce sipariş verdi mi",
 *     tekrar tespiti, unique index). Geri okumaya ihtiyaç yok.
 *     → HMAC-SHA256(pepper, değer). Deterministiktir: aynı girdi hep aynı hash'i verir,
 *       böylece `WHERE tckn_hash = $1` ile aranabilir. Pepper sunucuda kalır; veritabanı
 *       sızsa bile ham TCKN'ler kaba kuvvetle (11 hane = 10^11 olasılık) elde edilemez.
 *
 *  2. Geri OKUMAMIZ gereken veri (ör. IBAN — iade yaparken lazım).
 *     → AES-256-GCM. Kimlik doğrulamalı şifreleme; her kayıtta rastgele IV, kurcalanmayı
 *       yakalayan auth tag. Çıktı base16 metin: "pii.v1.<iv>.<tag>.<ciphertext>".
 *
 * ANAHTAR YÖNETİMİ:
 *  - PII_ENCRYPTION_KEY (64 hex = 32 bayt) ve PII_HMAC_PEPPER env'de tutulur, repoya girmez.
 *  - Bu değerler ROTASYONA UYGUN DEĞİLDİR. Değiştirirsen eski hash'ler eşleşmez, eski
 *    şifreli veriler çözülemez. Zorunlu kalırsan çift-yaz + geri-doldur taşıması yaz.
 *  - Bu modül anahtarları çağrı anında okur; env'de yoksa net bir hata fırlatır
 *    (import anında değil — kullanılmayan kod yolları build'i kırmaz).
 */

const ENC_PREFIX = 'pii.v1';
const IV_BYTES = 12; // GCM standart nonce uzunluğu
const KEY_BYTES = 32; // AES-256

function getEncryptionKey(): Buffer {
  const hex = env.PII_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      'PII_ENCRYPTION_KEY tanımlı değil. Üret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== KEY_BYTES) {
    throw new Error(`PII_ENCRYPTION_KEY 32 bayt (64 hex karakter) olmalı, ${key.length} bayt bulundu.`);
  }
  return key;
}

function getPepper(): string {
  const pepper = env.PII_HMAC_PEPPER;
  if (!pepper) {
    throw new Error(
      'PII_HMAC_PEPPER tanımlı değil. Üret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }
  return pepper;
}

/* ------------------------------------------------------------------ *
 * 1) EŞLEŞTİRME İÇİN HASH (geri döndürülemez)                         *
 * ------------------------------------------------------------------ */

/**
 * Bir değerin deterministik, pepper'lı HMAC-SHA256 hash'ini (64 hex karakter) üretir.
 * Veritabanında `char(64)` bir sütunda saklanabilir ve üzerine unique index konabilir.
 */
export function hashForMatch(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error('hashForMatch: boş değer.');
  return crypto.createHmac('sha256', getPepper()).update(normalized, 'utf8').digest('hex');
}

/** TCKN'yi (rakamları) hash'ler. Girdi 11 haneli olmalıdır. */
export function hashTCKN(tckn: string): string {
  const digits = tckn.replace(/\D/g, '');
  if (digits.length !== 11) throw new Error('hashTCKN: TCKN 11 haneli olmalı.');
  return hashForMatch(digits);
}

/**
 * Ham bir değeri, saklanan hash ile sabit-zamanlı karşılaştırır.
 * (Doğrudan `WHERE tckn_hash = $1` sorgusu da güvenlidir; bu yardımcı, hash'i
 * uygulama tarafında kıyaslaman gerektiğinde zamanlama sızıntısını önler.)
 */
export function matchesHash(rawValue: string, storedHash: string): boolean {
  const candidate = crypto.createHmac('sha256', getPepper()).update(rawValue.trim(), 'utf8').digest();
  let stored: Buffer;
  try {
    stored = Buffer.from(storedHash, 'hex');
  } catch {
    return false;
  }
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

/* ------------------------------------------------------------------ *
 * 2) GERİ OKUNABİLİR ŞİFRELEME (AES-256-GCM)                          *
 * ------------------------------------------------------------------ */

/**
 * Düz metni AES-256-GCM ile şifreler. Çıktı, veritabanında `text` sütununda
 * saklanabilen tek parça bir dizedir: "pii.v1.<iv_hex>.<tag_hex>.<ciphertext_hex>".
 */
export function encryptPII(plaintext: string): string {
  if (typeof plaintext !== 'string') throw new Error('encryptPII: metin bekleniyor.');
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}.${iv.toString('hex')}.${tag.toString('hex')}.${ciphertext.toString('hex')}`;
}

/** Bir dizenin encryptPII() çıktısı olup olmadığını (kabaca) söyler. */
export function isEncryptedPII(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(`${ENC_PREFIX}.`) && value.split('.').length === 5;
}

/**
 * encryptPII() ile şifrelenmiş bir dizeyi çözer. Biçim bozuksa veya auth tag
 * doğrulanamıyorsa (kurcalanmış/yanlış anahtar) hata fırlatır.
 */
export function decryptPII(payload: string): string {
  if (!isEncryptedPII(payload)) throw new Error('decryptPII: beklenen "pii.v1.*" biçimi değil.');
  const [, , ivHex, tagHex, ctHex] = payload.split('.');
  if (!ivHex || !tagHex || !ctHex) throw new Error('decryptPII: bozuk şifreli veri biçimi.');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * decryptPII'nin hata fırlatmayan sürümü — çözülemezse `null` döner.
 * Karışık (bir kısmı eski düz metin, bir kısmı şifreli) verilerde kullanışlıdır.
 */
export function tryDecryptPII(payload: unknown): string | null {
  if (!isEncryptedPII(payload)) return null;
  try {
    return decryptPII(payload);
  } catch {
    return null;
  }
}
