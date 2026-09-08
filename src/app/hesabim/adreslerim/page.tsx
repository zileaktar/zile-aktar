import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listAddresses } from '@/lib/data/account';
import { AddressManager } from '@/components/account/AddressManager';

export const metadata: Metadata = { title: 'Adreslerim', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/giris?redirectTo=/hesabim/adreslerim');

  const addresses = await listAddresses();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <div className="flex items-center gap-2 text-sm text-carbon/50">
        <Link href="/hesabim" className="hover:text-primary">
          Hesabım
        </Link>
        <span>/</span>
        <span className="text-carbon/70">Adreslerim</span>
      </div>

      <h1 className="font-display font-bold text-2xl text-primary">Adreslerim</h1>
      <p className="text-sm text-carbon/60">
        Kayıtlı adresleriniz ödeme sayfasında listelenir; birini seçip hızlıca sipariş verebilirsiniz.
        Varsayılan adres form alanlarını otomatik doldurur.
      </p>

      <AddressManager addresses={addresses} />
    </div>
  );
}
