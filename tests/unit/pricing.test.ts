import { describe, expect, it } from 'vitest';
import {
  calcShippingCents,
  describeShippingFees,
  FALLBACK_SHIPPING_CONFIG,
  parseWeightFromLabel,
  type ShippingConfig
} from '@/lib/shipping';

const tiered: ShippingConfig = {
  freeThresholdCents: 70000,
  defaultItemGrams: 250,
  packagingGrams: 200,
  extraPerKgCents: 1000,
  rates: [
    { maxGrams: 3000, priceCents: 5990 },
    { maxGrams: 1000, priceCents: 3990 }
  ]
};

describe('calcShippingCents (migration 0043 calc_shipping_cents ile aynı kural)', () => {
  it('boş/negatif sepet için 0 döner', () => {
    expect(calcShippingCents(tiered, 0, 500)).toBe(0);
    expect(calcShippingCents(tiered, -100, 500)).toBe(0);
  });

  it('ücretsiz kargo eşiğine ulaşınca 0', () => {
    expect(calcShippingCents(tiered, 70000, 50000)).toBe(0);
    expect(calcShippingCents(tiered, 69999, 500)).toBe(3990);
  });

  it('ambalaj payı ağırlığa eklenir ve uygun aralık seçilir (sıra karışık olsa da)', () => {
    expect(calcShippingCents(tiered, 1000, 800)).toBe(3990); // 800 + 200 = 1000 g
    expect(calcShippingCents(tiered, 1000, 801)).toBe(5990); // 1001 g
    expect(calcShippingCents(tiered, 1000, 2800)).toBe(5990); // 3000 g
  });

  it('en büyük aralık aşılınca başlamış her kg için ek ücret', () => {
    expect(calcShippingCents(tiered, 1000, 2801)).toBe(5990 + 1000); // 3001 g → 1 kg ek
    expect(calcShippingCents(tiered, 1000, 4800)).toBe(5990 + 2000); // 5000 g → 2 kg ek
  });

  it('eşik yoksa tutar ne olursa olsun ücret alınır', () => {
    expect(calcShippingCents({ ...tiered, freeThresholdCents: null }, 999999, 500)).toBe(3990);
  });

  it('başlangıç ayarı bugünkü davranışla aynı (700 TL üzeri ücretsiz, altı 39,90)', () => {
    expect(calcShippingCents(FALLBACK_SHIPPING_CONFIG, 69999, 5000)).toBe(3990);
    expect(calcShippingCents(FALLBACK_SHIPPING_CONFIG, 70000, 5000)).toBe(0);
  });
});

describe('parseWeightFromLabel', () => {
  it('g / gr / kg / ml / lt etiketlerini çevirir', () => {
    expect(parseWeightFromLabel('250 g')).toBe(250);
    expect(parseWeightFromLabel('250gr')).toBe(250);
    expect(parseWeightFromLabel('1 kg')).toBe(1000);
    expect(parseWeightFromLabel('1,5 kg')).toBe(1500);
    expect(parseWeightFromLabel('500 ml')).toBe(500);
    expect(parseWeightFromLabel('1 lt')).toBe(1000);
  });

  it('anlaşılmayan etiket için null', () => {
    expect(parseWeightFromLabel('1 adet')).toBeNull();
    expect(parseWeightFromLabel('Büyük boy')).toBeNull();
  });
});

describe('describeShippingFees', () => {
  it('tek aralıkta sabit ücret metni', () => {
    expect(describeShippingFees(FALLBACK_SHIPPING_CONFIG)).toContain("Kargo ücreti 39,90 TL'dir");
    expect(describeShippingFees(FALLBACK_SHIPPING_CONFIG)).toContain('700,00 TL ve üzeri');
  });

  it('çok aralıkta ağırlık metni', () => {
    const text = describeShippingFees(tiered);
    expect(text).toContain("1 kg'a kadar 39,90 TL");
    expect(text).toContain("3 kg'a kadar 59,90 TL");
    expect(text).toContain('her ek kg için 10,00 TL');
  });
});
