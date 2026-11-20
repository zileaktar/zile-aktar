import type { Metadata } from 'next';
import { getCheckoutPrefill, listAddresses } from '@/lib/data/account';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canPlaceOrder, CHECKOUT_CLOSED_MESSAGE } from '@/lib/checkout-gate';

export const metadata: Metadata = { title: 'Güvenli Ödeme', robots: { index: false } };

// Giriş yapmış kullanıcının bilgilerini önceden doldurmak için çerez okunur -> dinamik.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const gate = await canPlaceOrder(supabase, user?.id ?? null);

  // Satış şalteri kapalı (CHECKOUT_ENABLED=false) ve kullanıcı admin değil.
  if (!gate.allowed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">🌿</div>
        <h1 className="font-display font-bold text-xl text-primary mb-3">Güvenli Ödeme</h1>
        <p className="text-carbon/70">{CHECKOUT_CLOSED_MESSAGE}</p>
      </div>
    );
  }

  const [prefill, savedAddresses] = await Promise.all([getCheckoutPrefill(), listAddresses()]);
  return (
    <>
      {gate.adminBypass && (
        <div className="bg-amber-100 text-amber-900 text-sm text-center px-4 py-2">
          Yönetici görünümü: satış şalteri KAPALI (CHECKOUT_ENABLED=false). Müşteriler bu sayfayı göremez; yalnızca
          siz test siparişi verebilirsiniz.
        </div>
      )}
      <CheckoutForm prefill={prefill} savedAddresses={savedAddresses} />
    </>
  );
}
