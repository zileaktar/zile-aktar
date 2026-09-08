import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccountOverview, listAddresses } from '@/lib/data/account';
import { LogoutButton } from '@/components/account/LogoutButton';
import { ProfileForm } from '@/components/account/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/giris?redirectTo=/hesabim');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const [overview, addresses] = await Promise.all([getAccountOverview(), listAddresses()]);
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <h1 className="font-display font-bold text-2xl text-primary mb-2">Hesabım</h1>

      <ProfileForm fullName={overview?.fullName ?? ''} phone={overview?.phone ?? ''} />

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-primary mb-2">Hesap</h2>
        <div className="text-sm text-carbon/50 mb-0.5">E-posta</div>
        <div className="font-semibold mb-3">{user.email}</div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-carbon/50 mb-0.5">
            Kayıtlı Teslimat Adresleri{addresses.length > 0 ? ` (${addresses.length})` : ''}
          </div>
          <Link href="/hesabim/adreslerim" className="text-xs font-semibold text-primary hover:underline shrink-0">
            Yönet
          </Link>
        </div>
        {defaultAddr ? (
          <div className="text-sm text-carbon/70 leading-relaxed">
            <span className="font-medium text-carbon">{defaultAddr.label}</span> — {defaultAddr.fullName} · {defaultAddr.phone}
            <br />
            {defaultAddr.district} / {defaultAddr.city}
            <br />
            <span className="text-carbon/50">{defaultAddr.addressLine}</span>
            <p className="text-[11px] text-carbon/40 mt-1">Varsayılan adres ödeme sayfasında otomatik seçilir.</p>
          </div>
        ) : (
          <p className="text-sm text-carbon/50">
            Henüz kayıtlı adres yok.{' '}
            <Link href="/hesabim/adreslerim" className="text-primary underline">
              Adres ekleyin
            </Link>
            .
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link href="/hesabim/siparislerim" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition font-semibold text-primary">
          📦 Siparişlerim
        </Link>
        <Link href="/hesabim/adreslerim" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition font-semibold text-primary">
          📍 Adreslerim
        </Link>
        <Link href="/hesabim/veri-talebi" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition font-semibold text-primary">
          🔐 KVKK Veri Talebi
        </Link>
      </div>

      {(profile?.role === 'admin' || profile?.role === 'moderator') && (
        <Link href="/admin" className="block bg-primary/5 border border-primary/20 rounded-2xl p-5 font-semibold text-primary">
          🛠️ Yönetim Paneli
        </Link>
      )}

      <div className="pt-2">
        <LogoutButton />
      </div>
    </div>
  );
}
