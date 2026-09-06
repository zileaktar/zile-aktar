import { describe, expect, it } from 'vitest';
import {
  maskTCKN,
  maskIBAN,
  maskPhone,
  maskName,
  maskEmail,
  maskCardNumber,
  redactPII,
  redactPIIString
} from '@/lib/mask';

// Not: Bu testte gerçek veya gerçekçi kişisel veri KULLANILMAZ. Tüm girdiler
// yapısal yer tutuculardır (yalnızca uzunluk/biçim davranışını doğrular).

describe('alan bazlı maskeleyiciler', () => {
  it('maskTCKN: yalnızca son 4 karakteri gösterir', () => {
    expect(maskTCKN('AAAABBBBCCC')).toBe('*******BCCC');
    expect(maskTCKN('AAAABBBBCCC')).toHaveLength(11);
  });

  it('maskIBAN: TR öneki + son 4, ortası yıldız; boşlukları yok sayar', () => {
    const masked = maskIBAN('TRAA BBBB CCCC DDDD EEEE FFFF GG');
    expect(masked.startsWith('TRAA')).toBe(true);
    expect(masked.endsWith('FFGG')).toBe(true);
    expect(masked).toMatch(/^TRAA\*+FFGG$/);
  });

  it('maskPhone: baştan 3, sondan 4 karakter görünür', () => {
    // "+90 000 000 00 11" -> boşluksuz 13 karakter -> ilk 3 + 6 yıldız + son 4
    expect(maskPhone('+90 000 000 00 11')).toBe('+90******0011');
  });

  it('maskName: her kelimenin yalnızca ilk harfi kalır', () => {
    expect(maskName('Xxxxx Yyyyyy')).toBe('X**** Y*****');
    expect(maskName('   Zz   ')).toBe('Z*');
  });

  it('maskEmail: yerel kısım maskelenir, alan adı korunur', () => {
    expect(maskEmail('abcdef@example.com')).toBe('a****f@example.com');
    expect(maskEmail('duz-metin')).toBe('d********');
  });

  it('maskCardNumber: yalnızca son 4 hane', () => {
    expect(maskCardNumber('0000 0000 0000 1234')).toBe('************1234');
  });

  it('değer görünür karakter sayısından kısaysa tamamen maskelenir', () => {
    expect(maskTCKN('AB')).toBe('**');
  });
});

describe('redactPII (nesne)', () => {
  it('bilinen PII anahtarlarını maskeler, diğer alanlara dokunmaz', () => {
    const input = {
      musteri_id: '98765',
      ad_soyad: 'Xxxxx Yyyyyy',
      tc_kimlik: 'AAAABBBBCCC',
      telefon: '+90 000 000 00 11',
      iban: 'TRAABBBBCCCCDDDDEEEEFFFFGG',
      adres: 'yer tutucu adres metni',
      tutar_kurus: 12345
    };
    const out = redactPII(input);
    expect(out.musteri_id).toBe('98765');
    expect(out.tutar_kurus).toBe(12345);
    expect(out.ad_soyad).toBe('X**** Y*****');
    expect(out.tc_kimlik).toBe('*******BCCC');
    expect(out.adres).toBe('[gizli-adres]');
    expect(out.iban).toMatch(/^TRAA\*+FFGG$/);
    // orijinal nesne değişmemeli
    expect(input.tc_kimlik).toBe('AAAABBBBCCC');
  });

  it('iç içe nesne ve dizilerde de çalışır', () => {
    const out = redactPII({ siparis: { alici: { email: 'abcdef@example.com' } }, notlar: ['abc'] });
    expect(out.siparis.alici.email).toBe('a****f@example.com');
    expect(out.notlar).toEqual(['abc']);
  });

  it('Error nesnesini ad + maskelenmiş mesaja indirger', () => {
    const out = redactPII(new Error('iletişim abcdef@example.com ile kuruldu')) as {
      name: string;
      message: string;
    };
    expect(out.name).toBe('Error');
    expect(out.message).toContain('@example.com');
    expect(out.message).not.toContain('abcdef@example.com');
  });
});

describe('redactPIIString (serbest metin)', () => {
  it('metin içindeki e-posta ve IBAN kalıplarını maskeler', () => {
    const line = 'hata: TR000000000000000000000000 hesabına abcdef@example.com bildirimi';
    const out = redactPIIString(line);
    expect(out).not.toContain('abcdef@example.com');
    expect(out).not.toContain('TR000000000000000000000000');
    expect(out).toContain('hata:');
  });

  it('11 haneli sayı dizisini maskeler', () => {
    expect(redactPIIString('kimlik 12345678901 kaydı')).toBe('kimlik *******8901 kaydı');
  });
});
