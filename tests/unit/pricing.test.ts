import { describe, expect, it } from 'vitest';
import { calculateShippingCents, FREE_SHIPPING_THRESHOLD_CENTS, STANDARD_SHIPPING_CENTS } from '@/lib/pricing';

describe('calculateShippingCents', () => {
  it('boş sepet için 0 döner', () => {
    expect(calculateShippingCents(0)).toBe(0);
  });

  it('eşiğin altındaki tutarlar için standart kargo ücreti uygular', () => {
    expect(calculateShippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(STANDARD_SHIPPING_CENTS);
  });

  it('eşiğe tam ulaşan tutarda kargoyu bedava yapar', () => {
    expect(calculateShippingCents(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
  });

  it('eşiğin üzerindeki tutarlarda kargoyu bedava yapar', () => {
    expect(calculateShippingCents(FREE_SHIPPING_THRESHOLD_CENTS + 5000)).toBe(0);
  });

  it('negatif tutarı 0 kargo olarak ele alır (savunma amaçlı)', () => {
    expect(calculateShippingCents(-100)).toBe(0);
  });
});
