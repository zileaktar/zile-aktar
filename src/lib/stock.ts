/**
 * Kritik stok eşiği: bir varyantın stoğu bu sayıya (dahil) veya altına inince
 * yönetici uyarılır (Telegram + panel ana sayfası). Değiştirmek için yalnız burayı düzenleyin.
 */
export const LOW_STOCK_THRESHOLD = 5;

export type StockAlert = 'out_of_stock' | 'low' | null;

/**
 * Bir sipariş stoğu `before` → `after` düşürdüğünde uyarı gerekip gerekmediği.
 * Yalnızca eşik İLK KEZ aşıldığında uyarır (her siparişte tekrar tekrar değil):
 *  - after = 0 ve öncesinde stok vardı → "tükendi"
 *  - after ≤ eşik ve öncesinde eşiğin üstündeydi → "azaldı"
 */
export function stockAlertFor(before: number, after: number): StockAlert {
  if (after <= 0 && before > 0) return 'out_of_stock';
  if (after <= LOW_STOCK_THRESHOLD && before > LOW_STOCK_THRESHOLD) return 'low';
  return null;
}
