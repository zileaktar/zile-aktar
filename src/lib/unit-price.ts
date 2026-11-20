/**
 * BİRİM FİYAT (Fiyat Etiketi Yönetmeliği): ağırlık/hacimle satılan ürünlerde
 * satış fiyatının yanında 1 kg veya 1 litre fiyatı da gösterilir.
 *
 * Net miktar varyant etiketinden okunur ("100 g", "250gr", "1 kg", "1,5 kg",
 * "50 ml", "1 lt"). Adet ile satılan ürünlerde (ör. "1 adet") birim fiyat yoktur.
 * Saf fonksiyonlar — sunucu ve istemci ortak.
 */
import { formatPriceFromCents } from '@/lib/format';

export interface NetQuantity {
  /** Gram veya mililitre cinsinden miktar. */
  amount: number;
  base: 'g' | 'ml';
}

const UNIT_RE = /(\d+(?:[.,]\d+)?)\s*(kg|kilogram|gr|gram|g|ml|mililitre|lt|litre|l)\b/i;

export function parseNetQuantity(label: string): NetQuantity | null {
  const m = UNIT_RE.exec(label);
  if (!m) return null;
  const value = Number(m[1]!.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = m[2]!.toLowerCase();
  if (unit === 'kg' || unit === 'kilogram') return { amount: value * 1000, base: 'g' };
  if (unit === 'g' || unit === 'gr' || unit === 'gram') return { amount: value, base: 'g' };
  if (unit === 'ml' || unit === 'mililitre') return { amount: value, base: 'ml' };
  return { amount: value * 1000, base: 'ml' }; // lt / litre / l
}

/** 1 kg veya 1 lt fiyatı (kuruş, tam sayıya yuvarlanır). */
export function unitPriceCents(priceCents: number, label: string): { cents: number; per: 'kg' | 'lt' } | null {
  const q = parseNetQuantity(label);
  if (!q) return null;
  return { cents: Math.round((priceCents * 1000) / q.amount), per: q.base === 'g' ? 'kg' : 'lt' };
}

/** "1 kg: 450,00 ₺" — birim fiyat yoksa null. */
export function formatUnitPrice(priceCents: number, label: string): string | null {
  const u = unitPriceCents(priceCents, label);
  return u ? `1 ${u.per}: ${formatPriceFromCents(u.cents)}` : null;
}
