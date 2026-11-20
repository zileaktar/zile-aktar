import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { env } from '@/lib/env.mjs';
import { LEGAL } from '@/lib/legal';

/**
 * SATIŞ ŞALTERİ (env `CHECKOUT_ENABLED`).
 *
 * "false" iken müşteriler sipariş veremez (ödeme sayfası bilgi notu gösterir,
 * /api/checkout 503 döner). Yalnız `admin` rolündeki hesap — canlı test çekimi
 * yapabilmek için — siparişe devam edebilir.
 */
export function isCheckoutGloballyEnabled(): boolean {
  return env.CHECKOUT_ENABLED !== 'false';
}

export async function canPlaceOrder(
  supabase: SupabaseClient<Database>,
  userId: string | null
): Promise<{ allowed: boolean; adminBypass: boolean }> {
  if (isCheckoutGloballyEnabled()) return { allowed: true, adminBypass: false };
  if (!userId) return { allowed: false, adminBypass: false };
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const isAdmin = data?.role === 'admin';
  return { allowed: isAdmin, adminBypass: isAdmin };
}

// Dışa dönük metin: geçicilik/"yakında" ibaresi YOK (mağaza sahibinin tercihi).
export const CHECKOUT_CLOSED_MESSAGE = `Şu anda internet sitemiz üzerinden sipariş kabul edilmemektedir. Ürünlerimiz hakkında bilgi için bize ${LEGAL.telefon} numarasından ulaşabilirsiniz.`;
