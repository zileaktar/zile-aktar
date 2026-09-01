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
