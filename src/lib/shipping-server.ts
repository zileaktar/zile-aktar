import 'server-only';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

export interface CartQuote {
  subtotalCents: number;
  weightGrams: number;
  shippingCents: number;
}

/**
 * Sepetin ara toplamı + ağırlığı + kargo ücreti — fiyat ve ağırlık istemciden
 * DEĞİL, veritabanından (quote_cart, migration 0043). Önizleme içindir; sipariş
 * anında create_order aynı hesabı kilitli satırlarla yeniden yapar.
 */
export async function quoteCart(items: { variantId: string; quantity: number }[]): Promise<CartQuote | null> {
  const service = createSupabaseServiceRoleClient();
  const { data, error } = await service
    .rpc('quote_cart', { p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })) })
    .single();
  if (error || !data) return null;
  const row = data as { subtotal_cents: number; weight_grams: number; shipping_cents: number };
  return { subtotalCents: row.subtotal_cents, weightGrams: row.weight_grams, shippingCents: row.shipping_cents };
}
