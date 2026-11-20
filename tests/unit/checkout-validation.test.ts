import { describe, expect, it } from 'vitest';
import { checkoutRequestSchema } from '@/lib/validations/checkout';

const validPayload = {
  items: [{ variantId: '11111111-1111-1111-1111-111111111111', quantity: 2 }],
  address: {
    fullName: 'Ayşe Yılmaz',
    phone: '05551234567',
    email: 'ayse@example.com',
    city: 'İstanbul',
    district: 'Kadıköy',
    addressLine: 'Örnek Mahallesi, Örnek Sokak No:1 D:2'
  },
  paymentMethod: 'card' as const,
  acceptedDistanceSalesAgreement: true as const,
  acceptedPreliminaryInfo: true as const
};

describe('checkoutRequestSchema', () => {
  it('geçerli bir siparişi kabul eder', () => {
    const result = checkoutRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('boş sepeti reddeder', () => {
    const result = checkoutRequestSchema.safeParse({ ...validPayload, items: [] });
    expect(result.success).toBe(false);
  });

  it('ön bilgilendirme teyidi olmadan siparişi reddeder', () => {
    const result = checkoutRequestSchema.safeParse({ ...validPayload, acceptedPreliminaryInfo: false });
    expect(result.success).toBe(false);
  });

  it('Mesafeli Satış Sözleşmesi onayı olmadan siparişi reddeder', () => {
    const result = checkoutRequestSchema.safeParse({ ...validPayload, acceptedDistanceSalesAgreement: false });
    expect(result.success).toBe(false);
  });

  it('iki onay kutusu da boşken (varsayılan durum) siparişi reddeder', () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      acceptedDistanceSalesAgreement: false,
      acceptedPreliminaryInfo: false
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Mesafeli Satış Sözleşmesi onayı zorunludur.');
      expect(messages).toContain('Ön Bilgilendirme Formu teyidi zorunludur.');
    }
  });

  it('onay alanları hiç gönderilmezse siparişi reddeder', () => {
    const { acceptedDistanceSalesAgreement: _a, acceptedPreliminaryInfo: _b, ...rest } = validPayload;
    expect(checkoutRequestSchema.safeParse(rest).success).toBe(false);
  });

  it('onay alanında "true" metni (boolean olmayan) kabul edilmez', () => {
    const result = checkoutRequestSchema.safeParse({ ...validPayload, acceptedPreliminaryInfo: 'true' });
    expect(result.success).toBe(false);
  });

  it('kart numarası/CVV alanları gönderilse bile şema onları atar (kart verisi sunucuya alınmaz)', () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      cardNumber: '5521010140829928',
      cvv: '691',
      expiry: '12/29'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.cardNumber).toBeUndefined();
      expect(data.cvv).toBeUndefined();
      expect(data.expiry).toBeUndefined();
    }
  });

  it('geçersiz telefon formatını reddeder', () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      address: { ...validPayload.address, phone: '1234' }
    });
    expect(result.success).toBe(false);
  });

  it('20 adetten fazla miktarı reddeder (kaba kuvvet/stok manipülasyonuna karşı)', () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      items: [{ variantId: validPayload.items[0]!.variantId, quantity: 21 }]
    });
    expect(result.success).toBe(false);
  });

  it("items içinde 'price' alanı gönderilse bile şema onu yok sayar (client fiyatı asla güvenilmez)", () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      items: [{ variantId: validPayload.items[0]!.variantId, quantity: 1, price: 1 }]
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.items[0] as unknown as { price?: number }).price).toBeUndefined();
    }
  });

  it('kart ödemesi T.C. Kimlik No olmadan kabul edilir (KVKK veri minimizasyonu)', () => {
    const result = checkoutRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('havale/EFT ödemesini kabul eder', () => {
    const result = checkoutRequestSchema.safeParse({ ...validPayload, paymentMethod: 'havale' as const });
    expect(result.success).toBe(true);
  });

  it('adres nesnesinde kimlik no gönderilse bile şema onu yok sayar (saklanmaz, iletilmez)', () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      address: { ...validPayload.address, identityNumber: '10000000146' }
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.address as unknown as { identityNumber?: string }).identityNumber).toBeUndefined();
    }
  });
});
