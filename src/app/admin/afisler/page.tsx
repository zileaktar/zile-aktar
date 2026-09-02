import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { BannerManager } from '@/components/admin/BannerManager';
import type { CampaignBannerRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from('campaign_banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-primary">Kampanya Afişleri</h1>
      <BannerManager banners={(data ?? []) as CampaignBannerRow[]} />
    </div>
  );
}
