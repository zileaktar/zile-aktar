import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { CouponManager } from '@/components/admin/CouponManager';
import type { CouponRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-primary">İndirim Kodları</h1>
      <CouponManager coupons={(data ?? []) as CouponRow[]} />
    </div>
  );
}
