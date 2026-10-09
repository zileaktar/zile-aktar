import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { getVposTransaction } from '@/lib/vakifbank';
import { sendOrderPlacedEmail } from '@/lib/email';
import { notifyNewOrder, notifyPaymentFailed, notifyPaidButClosed } from '@/lib/notify';
import { redactPII, redactPIIString } from '@/lib/mask';

export type ConfirmPaymentResult =
  | { status: 'paid'; orderId: string; orderNumber: string }
  | { status: 'failed'; orderId: string | null; reason: 'not_successful' | 'amount_mismatch' }
  | { status: 'error'; reason: 'retrieve_failed' | 'missing_conversation_id' | 'not_final' };

/**
 * VakıfBank "Güvenli Ortak Ödeme" akışının onay fonksiyonu: SuccessUrl/FailUrl
 * dönüşüne asla güvenilmez, `orders.payment_conversation_id`'de sakladığımız
 * PaymentToken ile GERÇEK sonuç sunucu-sunucu (getVposTransaction) sorgulanır,
 * tahsil edilen tutar kuruş kuruş karşılaştırılır, ancak öyle "paid" işaretlenir.
 *
 * Hem dönüş rotası (webhooks/vakifbank/return) hem de cron
 * (expire-pending-orders, iptal etmeden önce) bu fonksiyonu çağırır.
 * mark_order_paid yalnızca pending siparişi günceller ve bunu boolean olarak
 * bildirir (migration 0035); mark_order_failed idempotenttir (0011).
 *
 * `orderId` çağıranda (webhooks/vakifbank/return) zaten HMAC ile doğrulanmış
 * olmalıdır (bkz. order-token.ts verifyPaymentReturn) — bu fonksiyon yalnızca
 * ödeme sonucunu doğrular, kimin bu orderId'yi sorguladığını değil.
 */
export async function confirmVakifbankPayment(orderId: string): Promise<ConfirmPaymentResult> {
  const serviceClient = createSupabaseServiceRoleClient();

  const { data: order } = await serviceClient
    .from('orders')
    .select('order_number, total_cents, status, payment_conversation_id')
    .eq('id', orderId)
    .single();

  if (!order) {
    return { status: 'error', reason: 'missing_conversation_id' };
  }

  // Zaten kesinleşmiş bir siparişi tekrar sorgulama — hem gereksiz API çağrısı
  // hem de yarış durumunda (SuccessUrl + admin arka arkaya) tutarsız davranış riski.
  if (order.status === 'paid') {
    return { status: 'paid', orderId, orderNumber: order.order_number };
  }

  const paymentToken = order.payment_conversation_id;
  if (!paymentToken) {
    Sentry.captureMessage(`VakıfBank: sipariş ${orderId} için kayıtlı PaymentToken yok`, { level: 'error' });
    return { status: 'error', reason: 'missing_conversation_id' };
  }

  let result;
  try {
    result = await getVposTransaction(paymentToken);
  } catch (err) {
    console.error('[payments] vakifbank sorgu hata:', err instanceof Error ? redactPIIString(err.message) : redactPII(err));
    Sentry.captureException(err);
    return { status: 'error', reason: 'retrieve_failed' };
  }

  // Banka henüz kesin bir karar vermediyse (Rc yok — ör. ödeme oturumu hiç
  // kullanılmamış/yarım kalmış) stoğa DOKUNMA: sipariş pending kalır, 1 saat
  // sonra cron (expire-pending-orders) temizler. Aksi halde müşteri hâlâ banka
  // sayfasındayken erken bir sorgu siparişi iptal edip stoğu iade edebilirdi.
  if (!result.Rc) {
    // 'retrieve_failed' değil: sorgu başarılı, ama ödeme henüz sonuçlanmamış.
    // Cron bu ayrıma bakarak ağ hatasında siparişi İPTAL ETMEZ, sonuçsuz
    // ödemede eder (bkz. expire-pending-orders).
    return { status: 'error', reason: 'not_final' };
  }

  // Başarı yalnızca HEM işlem sonuç kodu HEM yetkilendirme sonuç kodu "0000"
  // olduğunda kabul edilir — biri eksikse ödeme reddedilmiş/yarım sayılır.
  const isSuccessful = result.Rc === '0000' && result.AuthResultCode === '0000';
  // Bildirim yalnızca sipariş bu çağrıda İLK KEZ kapanıyorsa gider (pending idi):
  // dönüş sayfası yenilenirse ya da iki kez tetiklenirse telefona mükerrer mesaj düşmez.
  const wasPending = order.status === 'pending';

  if (!isSuccessful) {
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    if (wasPending) await notifyPaymentFailed(orderId, 'not_successful');
    return { status: 'failed', orderId, reason: 'not_successful' };
  }

  const paidCents = Math.round(Number(result.Amount ?? 0) * 100);
  if (!Number.isFinite(paidCents) || paidCents !== order.total_cents) {
    Sentry.captureMessage(
      `VakıfBank tutar uyuşmazlığı: sipariş ${orderId}, beklenen ${order.total_cents}, ödenen ${paidCents}`,
      { level: 'error' }
    );
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    if (wasPending) await notifyPaymentFailed(orderId, 'amount_mismatch');
    return { status: 'failed', orderId, reason: 'amount_mismatch' };
  }

  const { data: applied } = await serviceClient.rpc('mark_order_paid', {
    p_order_id: orderId,
    p_payment_ref: result.TransactionId ?? result.Rrn ?? paymentToken
  });

  if (!applied) {
    const { data: fresh } = await serviceClient.from('orders').select('status').eq('id', orderId).single();
    if (fresh?.status === 'paid') {
      // Eşzamanlı ikinci istek (ör. dönüş iki kez tetiklendi): diğer yol zaten
      // siparişi işledi ve e-postayı gönderdi — burada tekrar GÖNDERİLMEZ.
      return { status: 'paid', orderId, orderNumber: order.order_number };
    }
    // PARA ÇEKİLDİ AMA SİPARİŞ KAPALI (failed/cancelled). Müşteriye "başarılı"
    // DENMEZ; yönetici anında haberdar edilmeli ve banka panelinden iptal/iade
    // yapılmalı (bkz. Sentry uyarı kuralı).
    Sentry.captureMessage(
      `KRİTİK: VakıfBank tahsil etti (TxId ${result.TransactionId ?? 'yok'}) ama sipariş ${orderId} durumu '${fresh?.status ?? 'bilinmiyor'}'`,
      { level: 'fatal' }
    );
    await notifyPaidButClosed(orderId, result.TransactionId ?? null);
    return { status: 'failed', orderId, reason: 'not_successful' };
  }

  // E-posta ve bildirim yalnızca siparişi GERÇEKTEN pending→paid yapan çağrıdan gider.
  await sendOrderPlacedEmail(orderId);
  await notifyNewOrder(orderId, 'card');
  return { status: 'paid', orderId, orderNumber: order.order_number };
}
