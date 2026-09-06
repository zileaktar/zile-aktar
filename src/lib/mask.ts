/**
 * PII maskeleme — YALNIZCA log ve ekran gösterimi içindir.
 *
 * Kalıcı saklama için maskeleme YETERSİZDİR; orada şifreleme (bkz. src/lib/crypto/pii.ts)
 * veya salt/pepper'lı hash kullanılır. Bu modülün amacı, kişisel verinin console log'una,
 * Sentry'ye veya benzeri kayıtlara düz metin olarak düşmesini engellemektir.
 */

const MASK = '*';

/** Değerin ortasını yıldızlar; baştan `visibleStart`, sondan `visibleEnd` karakter görünür kalır. */
function maskMiddle(value: unknown, visibleStart = 0, visibleEnd = 4): string {
  const v = value == null ? '' : String(value);
  const keep = visibleStart + visibleEnd;
  if (v.length <= keep) return MASK.repeat(v.length);
  return v.slice(0, visibleStart) + MASK.repeat(v.length - keep) + v.slice(v.length - visibleEnd);
}

/** 12345678901 → *******8901 */
export const maskTCKN = (value: unknown): string => maskMiddle(value, 0, 4);

/** TR12 0000 ... 0001 → TR12************************0001 (ülke+kontrol öneki ve son 4 hane görünür) */
export const maskIBAN = (value: unknown): string =>
  maskMiddle(String(value ?? '').replace(/\s+/g, ''), 4, 4);

/** +90 555 123 45 67 → +90******4567 */
export const maskPhone = (value: unknown): string =>
  maskMiddle(String(value ?? '').replace(/[\s()-]/g, ''), 3, 4);

/** "Ahmet Yılmaz" → "A**** Y*****" */
export const maskName = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0) + MASK.repeat(Math.max(word.length - 1, 0)) : word))
    .join(' ');

/** "ahmet.yilmaz@ornek.com" → "a**********z@ornek.com" */
export const maskEmail = (value: unknown): string => {
  const raw = String(value ?? '');
  const at = raw.lastIndexOf('@');
  if (at <= 0) return maskMiddle(raw, 1, 0);
  return `${maskMiddle(raw.slice(0, at), 1, 1)}${raw.slice(at)}`;
};

/** Kart numarasının yalnızca son 4 hanesi. 4242424242424242 → ************4242 */
export const maskCardNumber = (value: unknown): string =>
  maskMiddle(String(value ?? '').replace(/\s+/g, ''), 0, 4);

/**
 * Anahtar adını normalize eder: küçük harfe çevirir, `_`, `-` ve boşlukları kaldırır.
 * Böylece `tc_kimlik`, `tcKimlik`, `TC-KIMLIK` hepsi `tckimlik`'e eşlenir ve
 * `billing_address` / `billingAddress` gibi varyantlar kaçmaz.
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

/**
 * NORMALİZE EDİLMİŞ anahtar adına göre maskelenen alanlar (anahtarlar `_`/`-` içermez).
 * Yeni bir PII alanı eklendiğinde buraya da eklenmelidir.
 */
const FIELD_MASKERS: Record<string, (v: unknown) => string> = {
  tckimlik: maskTCKN,
  tckn: maskTCKN,
  tckimlikno: maskTCKN,
  identitynumber: maskTCKN,
  nationalid: maskTCKN,
  iban: maskIBAN,
  telefon: maskPhone,
  phone: maskPhone,
  phonenumber: maskPhone,
  gsm: maskPhone,
  gsmnumber: maskPhone,
  telno: maskPhone,
  cepno: maskPhone,
  adsoyad: maskName,
  name: maskName,
  fullname: maskName,
  firstname: maskName,
  lastname: maskName,
  isim: maskName,
  contactname: maskName,
  buyername: maskName,
  recipientname: maskName,
  email: maskEmail,
  eposta: maskEmail,
  emailaddress: maskEmail,
  mail: maskEmail,
  cardnumber: maskCardNumber,
  pan: maskCardNumber,
  lastfourdigits: (v) => String(v ?? ''), // zaten yalnızca son 4 hane; olduğu gibi bırak
  binnumber: (v) => maskMiddle(String(v ?? ''), 0, 0) // ilk 6 hane — tamamen gizle
};

/**
 * Normalize edilmiş anahtar bir adres alanı mı? `billing_address`, `shippingAddress`,
 * `ev_adresi`, `teslimat_adresi`, `registrationAddress` vb. hepsini yakalar.
 */
function isAddressKey(normalizedKey: string): boolean {
  return normalizedKey.includes('adres') || normalizedKey.includes('address');
}

const MAX_DEPTH = 8;

/**
 * Bir nesneyi (veya diziyi) derinlemesine kopyalayıp bilinen PII alanlarını maskeler.
 * Orijinal nesne değiştirilmez. Log'a nesne basmadan önce bunu kullanın:
 *
 *   console.error('[checkout] hata:', redactPII(payload));
 */
export function redactPII<T>(input: T, depth = 0): T {
  if (depth > MAX_DEPTH || input == null) return input;

  if (Array.isArray(input)) {
    return input.map((item) => redactPII(item, depth + 1)) as unknown as T;
  }

  if (typeof input === 'object') {
    // Error nesnelerini bozmadan yalnızca mesaj/isim ile temsil et
    if (input instanceof Error) {
      return { name: input.name, message: redactPIIString(input.message) } as unknown as T;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const nk = normalizeKey(key);
      const masker = FIELD_MASKERS[nk];
      if (masker && (typeof value === 'string' || typeof value === 'number')) {
        out[key] = masker(value);
      } else if (isAddressKey(nk) && typeof value === 'string') {
        out[key] = '[gizli-adres]';
      } else {
        out[key] = redactPII(value, depth + 1);
      }
    }
    return out as unknown as T;
  }

  return input;
}

/**
 * Serbest metin içindeki PII kalıplarını maskeler (JSON.stringify çıktısı, API hata gövdeleri,
 * log satırları vb.). Regex tabanlı olduğu için zaman zaman fazladan maskeleme yapabilir —
 * log bağlamında bu kabul edilebilir bir güvenli taraf tercihidir.
 */
export function redactPIIString(text: unknown): string {
  let s = String(text ?? '');

  // IBAN (TR + 24-30 alfanümerik, aralarında boşluk olabilir)
  s = s.replace(/\bTR\d{2}(?:[ ]?[A-Z0-9]){20,26}\b/gi, (m) => maskIBAN(m));

  // E-posta
  s = s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, (m) => maskEmail(m));

  // Telefon (+90..., 0090..., 05... — 10-13 hane)
  s = s.replace(/(?<![\w.])(?:\+?90|0)?5\d{9}(?![\w.])/g, (m) => maskPhone(m));

  // TCKN (tam 11 hane) — ödeme sağlayıcı kimliklerini de maskeleyebilir, kabul edilebilir
  s = s.replace(/(?<!\d)\d{11}(?!\d)/g, (m) => maskTCKN(m));

  return s;
}
