import { describe, expect, it } from 'vitest';
import { formatUnitPrice, parseNetQuantity, unitPriceCents } from '@/lib/unit-price';

describe('birim fiyat (Fiyat Etiketi Yönetmeliği)', () => {
  it('sitedeki etiket biçimlerini okur', () => {
    expect(parseNetQuantity('100 g')).toEqual({ amount: 100, base: 'g' });
    expect(parseNetQuantity('250gr')).toEqual({ amount: 250, base: 'g' });
    expect(parseNetQuantity('1 kg')).toEqual({ amount: 1000, base: 'g' });
    expect(parseNetQuantity('1,5 kg')).toEqual({ amount: 1500, base: 'g' });
    expect(parseNetQuantity('20 ml')).toEqual({ amount: 20, base: 'ml' });
    expect(parseNetQuantity('1 lt')).toEqual({ amount: 1000, base: 'ml' });
    expect(parseNetQuantity('500 gram')).toEqual({ amount: 500, base: 'g' });
  });

  it('adet ile satılan üründe birim fiyat yoktur', () => {
    expect(parseNetQuantity('1 adet')).toBeNull();
    expect(formatUnitPrice(5000, '3 adet')).toBeNull();
    expect(parseNetQuantity('Standart')).toBeNull();
  });

  it('kg ve litre fiyatını doğru hesaplar', () => {
    expect(unitPriceCents(4500, '100 g')).toEqual({ cents: 45000, per: 'kg' }); // 45 TL / 100 g → 450 TL/kg
    expect(unitPriceCents(15000, '20 ml')).toEqual({ cents: 750000, per: 'lt' }); // 150 TL / 20 ml → 7.500 TL/lt
    expect(unitPriceCents(30000, '1 kg')).toEqual({ cents: 30000, per: 'kg' });
    expect(unitPriceCents(1000, '3 g')).toEqual({ cents: 333333, per: 'kg' }); // yuvarlama
  });

  it('Türkçe biçimde gösterir', () => {
    expect(formatUnitPrice(4500, '100 g')).toBe('1 kg: 450,00 ₺');
    expect(formatUnitPrice(15000, '20 ml')).toBe('1 lt: 7.500,00 ₺');
  });

  it('sıfır/negatif miktarı reddeder', () => {
    expect(parseNetQuantity('0 g')).toBeNull();
  });
});
