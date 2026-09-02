/**
 * Kargo/fiyatlandırma kuralları — TEK doğruluk kaynağı.
 * Hem istemci (sepet önizlemesi) hem sunucu (/api/checkout, gerçek toplam
 * hesaplama) buradan import eder; iki yerde ayrı ayrı tanımlanıp
 * birbirinden sapmasını önler.
 */
// ÖNEMLİ: Bu iki değer, gerçek sipariş toplamını hesaplayan Postgres fonksiyonu
// public.create_order (supabase/migrations/0004 + 0011) içindeki
// v_free_shipping_threshold / v_standard_shipping ile ELLE senkron tutulmalıdır.
// Buradaki değerler yalnızca istemci tarafı sepet önizlemesi içindir; sunucu her
// zaman kendi (DB'deki) değerini kullanır.
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000; // 150,00 TL
export const STANDARD_SHIPPING_CENTS = 3990; // 39,90 TL

export function calculateShippingCents(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
}

export interface DealConfig {
  buyQty: number;
  getQty: number;
  getPercent: number;
}

/**
 * Bir sepet satırı için "X alana Y" kampanya indirimi (kuruş).
 * `create_order` (migration 0019) ile AYNI satır-bazlı mantık: her (buyQty+getQty)
 * adette getQty adet, satır fiyatının %getPercent'i kadar iner. Yalnızca UI
 * önizlemesi — gerçek indirim sunucuda DB'den yeniden hesaplanır.
 */
export function lineDealDiscountCents(unitPriceCents: number, quantity: number, deal?: DealConfig | null): number {
  if (!deal || deal.buyQty < 1 || deal.getQty < 1 || deal.getPercent < 1) return 0;
  const group = deal.buyQty + deal.getQty;
  const discountedUnits = Math.floor(quantity / group) * deal.getQty;
  return Math.floor((discountedUnits * unitPriceCents * deal.getPercent) / 100);
}

/** Ürün kartı/detayında gösterilecek kısa kampanya rozeti metni. */
export function dealBadgeText(deal: DealConfig): string {
  if (deal.buyQty === 1 && deal.getQty === 1 && deal.getPercent === 100) return '1 ALANA 1 BEDAVA';
  if (deal.getPercent === 100) return `${deal.buyQty + deal.getQty} AL ${deal.buyQty} ÖDE`;
  return `${deal.buyQty} ALANA ${deal.buyQty + 1}. %${deal.getPercent}`;
}

/** DB satırındaki üç alandan DealConfig üretir (hepsi dolu değilse null). */
export function dealFromRow(row: {
  deal_buy_qty: number | null;
  deal_get_qty: number | null;
  deal_get_percent: number | null;
}): DealConfig | null {
  if (row.deal_buy_qty == null || row.deal_get_qty == null || row.deal_get_percent == null) return null;
  return { buyQty: row.deal_buy_qty, getQty: row.deal_get_qty, getPercent: row.deal_get_percent };
}
