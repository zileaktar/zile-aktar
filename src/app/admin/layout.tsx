import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Yönetim paneli arama motorlarına asla indekslenmez (kimlik doğrulamalı olsa da
// açık bir sinyal). Alt sayfalar bu metadata'yı devralır.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Savunma derinliği (defense in depth): /admin rotaları ÜÇ ayrı katmanda korunur:
 *  1. src/middleware.ts — erken yönlendirme (UX, hızlı ret).
 *  2. Bu layout — sayfa render edilmeden önce ikinci bir sunucu taraflı kontrol.
 *  3. RLS politikaları (0002_rls_policies.sql) — is_staff()/is_admin() — asıl
 *     veri erişim sınırı; middleware/layout atlatılsa bile veritabanı korur.
 *
 * İki adımlı doğrulama (MFA/TOTP): rol kontrolünden sonra oturumun AAL2
 * seviyesinde olması şarttır; değilse /admin/mfa'ya (kurulum veya kod
 * girişi) yönlendirilir. /admin/mfa sayfasının kendisi bu şarttan muaftır
 * (orada AAL2'ye yükseltiliyor) ve menü göstermez.
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

  // x-pathname middleware tarafından her istekte ezilerek set edilir (sahtelenemez).
  const pathname = (await headers()).get('x-pathname') ?? '';
  const isMfaPage = pathname === '/admin/mfa' || pathname.startsWith('/admin/mfa/');

  if (isMfaPage) {
    return <div className="max-w-md mx-auto px-4 sm:px-6 py-12">{children}</div>;
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') {
    redirect('/admin/mfa');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* flex-wrap: telefonda menü tek satıra sığmayınca alt satıra geçer (eskiden ekrandan taşıyordu). */}
      <nav aria-label="Yönetim menüsü" className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-6 text-sm font-semibold">
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
        <Link href="/admin/iadeler" className="text-primary hover:underline">
          İade/İptal
        </Link>
        <span className="text-carbon/30">/</span>
        <Link href="/admin/afisler" className="text-primary hover:underline">
          Afişler
        </Link>
        <span className="text-carbon/30">/</span>
        <Link href="/admin/kuponlar" className="text-primary hover:underline">
          Kuponlar
        </Link>
        {profile.role === 'admin' && (
          <>
            <span className="text-carbon/30">/</span>
            <Link href="/admin/ayarlar" className="text-primary hover:underline">
              Ayarlar
            </Link>
          </>
        )}
      </nav>
      {children}
    </div>
  );
}
