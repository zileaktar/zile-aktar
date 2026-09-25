import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { retrieveCheckoutFormResult } from '@/lib/iyzico';
import { getVposTransaction } from '@/lib/vakifbank';
import { sendOrderPlacedEmail } from '@/lib/email';
import { redactPII, redactPIIString } from '@/lib/mask';

export type ConfirmPaymentResult =
  | { status: 'paid'; orderId: string; orderNumber: string }
  | { status: 'failed'; orderId: string | null; reason: 'not_successful' | 'amount_mismatch' }
  | { status: 'error'; reason: 'retrieve_failed' | 'missing_conversation_id' };

/**
 * Bir iyzico Checkout Form `token`'ından yola çıkarak ödemenin GERÇEK sonucunu
 * sunucu-sunucu (retrieveCheckoutFormResult) doğrular, tahsil edilen tutarı
 * siparişin veritabanındaki toplamıyla KURUŞ KURUŞ karşılaştırır ve siparişi
 * `paid` / `failed` olarak işaretler.
 *
 * Hem 3DS sonrası tarayıcı callback'i (api/webhooks/iyzico/callback) hem de
 * iyzico'nun asenkron sunucu-sunucu bildirimi (api/webhooks/iyzico) AYNI bu
 * fonksiyonu çağırır — böylece "ödeme onayı" mantığı tek yerde, tutarlı ve
 * tutar-doğrulamalı olur.
 *
 * mark_order_paid yalnızca status='pending' iken etki eder; mark_order_failed
 * migration 0011'den beri idempotenttir. Bu yüzden iki yol aynı siparişi
 * onaylamaya çalışsa bile (yarış durumu) çift işlem / çift stok iadesi olmaz.
 */
export async function confirmCheckoutPayment(token: string): Promise<ConfirmPaymentResult> {
  let result;
  try {
    result = await retrieveCheckoutFormResult(token);
  } catch (err) {
    console.error('[payments] retrieve hata:', err instanceof Error ? redactPIIString(err.message) : redactPII(err));
    Sentry.captureException(err);
    return { status: 'error', reason: 'retrieve_failed' };
  }

  // Sipariş kimliği: initializeCheckoutForm'da conversationId = basketId = orderId
  // yaptık; iyzico yanıtında hangisi gelirse onu kullan.
  const orderId = result.conversationId ?? result.basketId ?? null;
  if (!orderId) {
    console.error(
      '[payments] retrieve yanıtında conversationId/basketId yok:',
      redactPIIString(JSON.stringify(result)).slice(0, 1500)
    );
    Sentry.captureMessage('iyzico: retrieve sonucunda sipariş kimliği yok', { level: 'error' });
    return { status: 'error', reason: 'missing_conversation_id' };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  // iyzico başarıyı `status: 'success'` ile bildirir; paymentStatus alanı bazı
  // yanıtlarda "SUCCESS", bazılarında hiç gelmez — bu yüzden yalnızca açıkça
  // başarısız bir paymentStatus geldiğinde reddet.
  const failedPaymentStatuses = ['FAILURE', 'BANK_FAIL', 'INIT_THREEDS', 'CALLBACK_THREEDS'];
  if (result.status !== 'success' || (result.paymentStatus && failedPaymentStatuses.includes(result.paymentStatus))) {
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return { status: 'failed', orderId, reason: 'not_successful' };
  }

  const { data: order } = await serviceClient
    .from('orders')
    .select('order_number, total_cents, status')
    .eq('id', orderId)
    .single();

  const paidCents = Math.round(Number(result.paidPrice ?? 0) * 100);
  if (!order || !Number.isFinite(paidCents) || paidCents !== order.total_cents) {
    Sentry.captureMessage(
      `iyzico tutar uyuşmazlığı: sipariş ${orderId}, beklenen ${order?.total_cents ?? 'yok'}, ödenen ${paidCents}`,
      { level: 'error' }
    );
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return { status: 'failed', orderId, reason: 'amount_mismatch' };
  }

  // Zaten paid ise (callback + webhook ikisi de çalıştı) — tekrar e-posta gönderme.
  const alreadyPaid = order.status === 'paid';
  await serviceClient.rpc('mark_order_paid', { p_order_id: orderId, p_payment_ref: String(result.paymentId ?? token) });
  if (!alreadyPaid) {
    await sendOrderPlacedEmail(orderId);
  }
  return { status: 'paid', orderId, orderNumber: order.order_number };
}

/**
 * VakıfBank "Güvenli Ortak Ödeme" akışının onay fonksiyonu — confirmCheckoutPayment
 * (iyzico) ile AYNI disiplin: SuccessUrl/FailUrl dönüşüne asla güvenilmez,
 * `orders.payment_conversation_id`'de sakladığımız PaymentToken ile GERÇEK
 * sonuç sunucu-sunucu (getVposTransaction) sorgulanır, tahsil edilen tutar
 * kuruş kuruş karşılaştırılır, ancak öyle "paid" işaretlenir.
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

  // Başarı yalnızca HEM işlem sonuç kodu HEM yetkilendirme sonuç kodu "0000"
  // olduğunda kabul edilir — biri eksikse ödeme reddedilmiş/yarım sayılır.
  const isSuccessful = result.Rc === '0000' && result.AuthResultCode === '0000';
  if (!isSuccessful) {
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return { status: 'failed', orderId, reason: 'not_successful' };
  }

  const paidCents = Math.round(Number(result.Amount ?? 0) * 100);
  if (!Number.isFinite(paidCents) || paidCents !== order.total_cents) {
    Sentry.captureMessage(
      `VakıfBank tutar uyuşmazlığı: sipariş ${orderId}, beklenen ${order.total_cents}, ödenen ${paidCents}`,
      { level: 'error' }
    );
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return { status: 'failed', orderId, reason: 'amount_mismatch' };
  }

  await serviceClient.rpc('mark_order_paid', {
    p_order_id: orderId,
    p_payment_ref: result.TransactionId ?? result.Rrn ?? paymentToken
  });
  await sendOrderPlacedEmail(orderId);
  return { status: 'paid', orderId, orderNumber: order.order_number };
}
