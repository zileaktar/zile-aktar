import type { Metadata } from 'next';
import { getCheckoutPrefill, listAddresses } from '@/lib/data/account';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata: Metadata = { title: 'Güvenli Ödeme', robots: { index: false } };

// Giriş yapmış kullanıcının bilgilerini önceden doldurmak için çerez okunur -> dinamik.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const [prefill, savedAddresses] = await Promise.all([getCheckoutPrefill(), listAddresses()]);
  return <CheckoutForm prefill={prefill} savedAddresses={savedAddresses} />;
}
