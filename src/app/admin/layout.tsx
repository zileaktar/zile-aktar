import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Savunma derinliği (defense in depth): /admin rotaları ÜÇ ayrı katmanda korunur:
 *  1. src/middleware.ts — erken yönlendirme (UX, hızlı ret).
 *  2. Bu layout — sayfa render edilmeden önce ikinci bir sunucu taraflı kontrol.
 *  3. RLS politikaları (0002_rls_policies.sql) — is_staff()/is_admin() — asıl
 *     veri erişim sınırı; middleware/layout atlatılsa bile veritabanı korur.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/giris?redirectTo=/admin');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    redirect('/');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm font-semibold">
        <Link href="/admin" className="text-primary hover:underline">
          Yönetim Paneli
        </Link>
        <span className="text-carbon/30">/</span>
        <Link href="/admin/urunler" className="text-primary hover:underline">
          Ürünler
        </Link>
        <span className="text-carbon/30">/</span>
        <Link href="/admin/siparisler" className="text-primary hover:underline">
          Siparişler
        </Link>
        <span className="text-carbon/30">/</span>
        <Link href="/admin/yorumlar" className="text-primary hover:underline">
          Yorumlar
        </Link>
        <span className="text-carbon/30">/</span>
        <Link href="/admin/afisler" className="text-primary hover:underline">
          Afişler
        </Link>
        {profile.role === 'admin' && (
          <>
            <span className="text-carbon/30">/</span>
            <Link href="/admin/ayarlar" className="text-primary hover:underline">
              Ayarlar
            </Link>
          </>
        )}
      </div>
      {children}
    </div>
  );
}
