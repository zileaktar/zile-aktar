import { describe, expect, it } from 'vitest';
import { isValidTcKimlikNo } from '@/lib/tc-kimlik-no';

describe('isValidTcKimlikNo', () => {
  it('algoritmik olarak geçerli bir numarayı kabul eder', () => {
    expect(isValidTcKimlikNo('10000000146')).toBe(true);
  });

  it("aynı rakamdan oluşan sahte numaraları reddeder (ör. '11111111111')", () => {
    expect(isValidTcKimlikNo('11111111111')).toBe(false);
  });

  it('0 ile başlayan numarayı reddeder', () => {
    expect(isValidTcKimlikNo('01000000146')).toBe(false);
  });

  it('10 haneli bir numarayı reddeder', () => {
    expect(isValidTcKimlikNo('1000000014')).toBe(false);
  });

  it('rakam olmayan karakter içeren bir değeri reddeder', () => {
    expect(isValidTcKimlikNo('1000000014a')).toBe(false);
  });

  it('doğru uzunlukta ama checksum\'ı yanlış olan bir numarayı reddeder', () => {
    expect(isValidTcKimlikNo('10000000147')).toBe(false);
  });
});
