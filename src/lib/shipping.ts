/**
 * Ağırlığa göre kargo ücreti — kural (migration 0043 `calc_shipping_cents` ile AYNI):
 *  - Ara toplam >= ücretsiz kargo eşiği → 0.
 *  - Değilse toplam ağırlık = ürünler + koli/ambalaj payı; bu ağırlığı karşılayan
 *    en küçük aralığın ücreti. En büyük aralık da aşılırsa: o aralığın ücreti +
 *    aşan her (başlamış) kg için ek ücret.
 *
 * Gerçek ücret HER ZAMAN sunucuda (create_order) DB'deki ayarlarla hesaplanır;
 * buradaki fonksiyon yalnız önizleme (ürün sayfası yapısal verisi, metinler) içindir.
 * Ayarlar admin panelden değişir: /admin/ayarlar → Kargo Ücretleri.
 */

export interface ShippingRate {
  maxGrams: number;
  priceCents: number;
}

export interface ShippingConfig {
  /** null = ücretsiz kargo eşiği yok */
  freeThresholdCents: number | null;
  /** Ağırlığı girilmemiş varyant için varsayılan (g) */
  defaultItemGrams: number;
  /** Her siparişe eklenen koli/ambalaj ağırlığı (g) */
  packagingGrams: number;
  /** En büyük aralığı aşan her kg için ek ücret (kuruş) */
  extraPerKgCents: number;
  /** maxGrams'a göre artan sıralı */
  rates: ShippingRate[];
}

/** DB okunamazsa kullanılan değer — migration 0043 başlangıç verisiyle aynı. */
export const FALLBACK_SHIPPING_CONFIG: ShippingConfig = {
  freeThresholdCents: 70000,
  defaultItemGrams: 250,
  packagingGrams: 0,
  extraPerKgCents: 0,
  rates: [{ maxGrams: 30000, priceCents: 3990 }]
};

export function calcShippingCents(config: ShippingConfig, subtotalCents: number, itemsWeightGrams: number): number {
  if (subtotalCents <= 0) return 0;
  if (config.freeThresholdCents != null && subtotalCents >= config.freeThresholdCents) return 0;
  const weight = Math.max(0, itemsWeightGrams) + config.packagingGrams;
  const rates = [...config.rates].sort((a, b) => a.maxGrams - b.maxGrams);
  const match = rates.find((r) => r.maxGrams >= weight);
  if (match) return match.priceCents;
  const last = rates[rates.length - 1];
  if (!last) return 0;
  return last.priceCents + Math.ceil((weight - last.maxGrams) / 1000) * config.extraPerKgCents;
}

/**
 * Varyant etiketinden ağırlık tahmini ("250 g", "250gr", "1 kg", "500 ml", "1 lt").
 * ml ≈ g kabul edilir. Anlaşılamazsa null. Migration 0043'teki ilk doldurma ile aynı mantık.
 */
export function parseWeightFromLabel(label: string): number | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(g|gr|gram|kg|kilo|ml|lt|litre|l)\b/i.exec(label.trim());
  if (!m || !m[1] || !m[2]) return null;
  const value = Number.parseFloat(m[1].replace(',', '.'));
  const unit = m[2].toLowerCase();
  const grams = Math.round(value * (['kg', 'kilo', 'lt', 'litre', 'l'].includes(unit) ? 1000 : 1));
  return grams >= 1 && grams <= 100000 ? grams : null;
}

/** "1,5 kg" / "250 g" */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg`;
  }
  return `${grams} g`;
}

function tl(cents: number): string {
  return (cents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Ücretsiz kargo eşiği TL (metinler için), yoksa null. */
export function freeThresholdTl(config: ShippingConfig): number | null {
  return config.freeThresholdCents == null ? null : config.freeThresholdCents / 100;
}

/**
 * Yasal sayfalar / SSS için kargo ücreti açıklaması (tek kaynak).
 * Ör. "Kargo ücreti siparişin toplam ağırlığına göre hesaplanır: 1 kg'a kadar 39,90 TL; 3 kg'a kadar 59,90 TL.
 *      700 TL ve üzeri siparişlerde kargo ücretsizdir."
 */
export function describeShippingFees(config: ShippingConfig): string {
  const rates = [...config.rates].sort((a, b) => a.maxGrams - b.maxGrams);
  const free =
    config.freeThresholdCents != null ? ` ${tl(config.freeThresholdCents)} TL ve üzeri siparişlerde kargo ücretsizdir.` : '';
  if (rates.length === 1 && rates[0] && config.extraPerKgCents === 0) {
    return `Kargo ücreti ${tl(rates[0].priceCents)} TL'dir ve ödeme sırasında toplam tutara eklenir.${free}`;
  }
  const parts = rates.map((r) => `${formatWeight(r.maxGrams)}'a kadar ${tl(r.priceCents)} TL`);
  const extra =
    config.extraPerKgCents > 0 && rates.length > 0
      ? `; daha ağır gönderilerde her ek kg için ${tl(config.extraPerKgCents)} TL eklenir`
      : '';
  return `Kargo ücreti siparişin toplam ağırlığına göre hesaplanır: ${parts.join('; ')}${extra}. Ücret ödeme sırasında toplam tutara eklenir.${free}`;
}
