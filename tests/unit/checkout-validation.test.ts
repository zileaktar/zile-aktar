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
    addressLine: 'Örnek Mahallesi, Örnek Sokak No:1 D:2',
    identityNumber: '10000000146' // Algoritmik olarak geçerli, gerçek bir kişiye ait olmayan test değeri
  },
  paymentMethod: 'card' as const,
  acceptedDistanceSalesAgreement: true as const,
  acceptedKvkk: true as const
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

  it('KVKK onayı olmadan siparişi reddeder — istemci fiyat/onay göndermeden geçemez', () => {
    const result = checkoutRequestSchema.safeParse({ ...validPayload, acceptedKvkk: false });
    expect(result.success).toBe(false);
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

  it('kart ödemesinde T.C. Kimlik No eksikse siparişi reddeder', () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      address: { ...validPayload.address, identityNumber: undefined }
    });
    expect(result.success).toBe(false);
  });

  it('kart ödemesinde sahte/geçersiz T.C. Kimlik No\'yu reddeder (ör. "11111111111")', () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      address: { ...validPayload.address, identityNumber: '11111111111' }
    });
    expect(result.success).toBe(false);
  });

  it('kapıda ödemede T.C. Kimlik No olmadan da siparişi kabul eder', () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      paymentMethod: 'cod' as const,
      address: { ...validPayload.address, identityNumber: undefined }
    });
    expect(result.success).toBe(true);
  });
});
