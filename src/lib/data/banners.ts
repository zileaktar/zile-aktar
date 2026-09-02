import 'server-only';
import { createSupabaseAnonServerClient } from '@/lib/supabase/server';
import type { CampaignBannerRow } from '@/lib/supabase/types';

/**
 * Anasayfa carousel'i için AKTİF kampanya afişleri (sıralı).
 * Önbelleklenmez — anasayfa zaten `force-dynamic`, afiş değişikliği anında yansımalı.
 * `campaign_banners_public_read` RLS politikası aktif afişleri anon'a açar.
 */
export async function getActiveCampaignBanners(): Promise<CampaignBannerRow[]> {
  const supabase = createSupabaseAnonServerClient();
  const { data, error } = await supabase
    .from('campaign_banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return [];
  return data ?? [];
}
