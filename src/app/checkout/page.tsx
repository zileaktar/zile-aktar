import type { Metadata } from 'next';
import { getCheckoutPrefill } from '@/lib/data/account';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata: Metadata = { title: 'Güvenli Ödeme', robots: { index: false } };

// Giriş yapmış kullanıcının bilgilerini önceden doldurmak için çerez okunur -> dinamik.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const prefill = await getCheckoutPrefill();
  return <CheckoutForm prefill={prefill} />;
}
