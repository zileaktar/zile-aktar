import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BulkVariantUpdate } from '@/components/admin/BulkVariantUpdate';

export const dynamic = 'force-dynamic';

export default async function BulkVariantUpdatePage() {
  // Fiyat değişikliği yalnız admin (moderatöre bilgi verilir; asıl kontrol aksiyonlarda + RLS'te).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/urunler" className="text-primary hover:underline">
          ← Ürünler
        </Link>
      </div>
      <h1 className="font-display font-bold text-2xl text-primary">Toplu Fiyat / Stok Güncelleme</h1>
      {isAdmin ? (
        <BulkVariantUpdate />
      ) : (
        <p className="text-sm text-carbon/60">Bu sayfayı yalnızca yönetici (admin) hesabı kullanabilir.</p>
      )}
    </div>
  );
}
