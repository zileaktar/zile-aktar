import { describe, expect, it, vi } from 'vitest';

// `server-only` düz node/vitest ortamında import edilince hata fırlatır — test için boş modül.
vi.mock('server-only', () => ({}));

// env.mjs (t3-env) tüm sunucu değişkenlerini doğrular; bu testte yalnızca kripto
// anahtarlarını sağlayan sahte bir env yeterli. Değerler test amaçlı sabittir,
// gerçek anahtar değildir.
vi.mock('@/lib/env.mjs', () => ({
  env: {
    PII_ENCRYPTION_KEY: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    PII_HMAC_PEPPER: 'test-ortami-icin-sabit-pepper-en-az-16-karakter'
  }
}));

import {
  hashTCKN,
  hashForMatch,
  matchesHash,
  encryptPII,
  decryptPII,
  tryDecryptPII,
  isEncryptedPII
} from '@/lib/crypto/pii';

describe('crypto/pii — eşleştirme hash (HMAC-SHA256)', () => {
  it('hashTCKN 64 hex karakter üretir ve deterministiktir', () => {
    const a = hashTCKN('11122233344');
    const b = hashTCKN('111 222 333 44'); // rakam dışı karakterler temizlenir
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
  });

  it('matchesHash doğru değerde true, yanlış değerde false döner', () => {
    const h = hashTCKN('11122233344');
    expect(matchesHash('11122233344', h)).toBe(true);
    expect(matchesHash('11122233345', h)).toBe(false);
    expect(matchesHash('11122233344', 'deadbeef')).toBe(false);
  });

  it('hash, ham değeri içermez (geri döndürülemez)', () => {
    expect(hashForMatch('TR112233')).not.toContain('TR112233');
  });
});

describe('crypto/pii — şifreleme (AES-256-GCM)', () => {
  it('encryptPII "pii.v1.*" biçiminde çıktı verir ve ham metni içermez', () => {
    const enc = encryptPII('TR112233');
    expect(enc.startsWith('pii.v1.')).toBe(true);
    expect(enc.split('.')).toHaveLength(5);
    expect(isEncryptedPII(enc)).toBe(true);
    expect(enc).not.toContain('TR112233');
  });

  it('decryptPII orijinal metni kayıpsız döndürür', () => {
    const enc = encryptPII('TR112233');
    expect(decryptPII(enc)).toBe('TR112233');
  });

  it('her şifreleme farklı çıktı verir (rastgele IV) ama aynı değere çözülür', () => {
    const a = encryptPII('ayni-deger');
    const b = encryptPII('ayni-deger');
    expect(a).not.toBe(b);
    expect(decryptPII(a)).toBe('ayni-deger');
    expect(decryptPII(b)).toBe('ayni-deger');
  });

  it('kurcalanmış şifreli metin çözülemez (auth tag doğrulaması)', () => {
    const enc = encryptPII('hassas');
    const parts = enc.split('.');
    const ct = parts[4] ?? '';
    parts[4] = ct.slice(0, -1) + (ct.at(-1) === 'a' ? 'b' : 'a');
    expect(() => decryptPII(parts.join('.'))).toThrow();
  });

  it('tryDecryptPII: şifreli olmayan değerde null döner', () => {
    expect(tryDecryptPII('duz metin')).toBeNull();
    expect(tryDecryptPII(null)).toBeNull();
  });
});
