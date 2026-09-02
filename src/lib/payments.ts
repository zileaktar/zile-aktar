import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { retrieveCheckoutFormResult } from '@/lib/iyzico';
import { sendOrderPlacedEmail } from '@/lib/email';

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
    console.error('[payments] retrieve hata:', err instanceof Error ? err.message : err);
    Sentry.captureException(err);
    return { status: 'error', reason: 'retrieve_failed' };
  }

  // Sipariş kimliği: initializeCheckoutForm'da conversationId = basketId = orderId
  // yaptık; iyzico yanıtında hangisi gelirse onu kullan.
  const orderId = result.conversationId ?? result.basketId ?? null;
  if (!orderId) {
    console.error('[payments] retrieve yanıtında conversationId/basketId yok:', JSON.stringify(result).slice(0, 1500));
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
