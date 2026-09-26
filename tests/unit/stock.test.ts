import { describe, expect, it } from 'vitest';
import { LOW_STOCK_THRESHOLD, stockAlertFor } from '@/lib/stock';

describe('stockAlertFor', () => {
  const t = LOW_STOCK_THRESHOLD;

  it('eşik ilk kez aşılınca "low"', () => {
    expect(stockAlertFor(t + 2, t)).toBe('low');
    expect(stockAlertFor(t + 1, t - 1)).toBe('low');
  });

  it('zaten eşiğin altındaysa tekrar uyarmaz', () => {
    expect(stockAlertFor(t, t - 1)).toBeNull();
    expect(stockAlertFor(t + 10, t + 1)).toBeNull();
  });

  it('stok sıfırlanınca "out_of_stock" (eşik altından da)', () => {
    expect(stockAlertFor(2, 0)).toBe('out_of_stock');
    expect(stockAlertFor(t + 3, 0)).toBe('out_of_stock');
    expect(stockAlertFor(0, 0)).toBeNull();
  });
});
