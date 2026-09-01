import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { verifyIyzicoWebhookSignature } from '@/lib/iyzico';
import { confirmCheckoutPayment } from '@/lib/payments';
import { webhookRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';

// İmza doğrulaması bu payload'ın gerçekten iyzico'dan geldiğini garanti eder,
// ama ŞEKLİNİ garanti etmez. Zod, alanları çalışma zamanında gerçekten doğrular.
// iyzico HPP (Checkout Form) webhook alanları — bkz. docs.iyzico.com/ek-servisler/webhook
const iyzicoWebhookPayloadSchema = z.object({
  iyziEventType: z.string(),
  iyziPaymentId: z.union([z.string(), z.number()]).transform(String),
  token: z.string(),
  paymentConversationId: z.string(),
  status: z.string(),
  iyziReferenceCode: z.string(), // her bildirim için benzersiz — idempotency anahtarı
  merchantId: z.union([z.string(), z.number()]).transform(String).optional(),
  iyziEventTime: z.union([z.string(), z.number()]).optional()
});

export const runtime = 'nodejs';

/**
 * iyzico'dan gelen ASENKRON sunucu-sunucu bildirimleri (ör. gecikmeli ödeme
 * onayı, iade durum değişikliği). Üç bağımsız savunma katmanı:
 *
 *  1. İMZA DOĞRULAMA: `X-IYZ-SIGNATURE-V3` başlığı, iyzico'nun resmi HPP formülüyle
 *     (secretKey + iyziEventType + iyziPaymentId + token + paymentConversationId + status,
 *     HMAC-SHA256, hex) yeniden hesaplanıp sabit zamanlı karşılaştırılır.
 *     Doğrulama başarısızsa istek 401 ile reddedilir ve HİÇBİR veri değişmez.
 *
 *  2. IDEMPOTENCY: (provider, event_id=iyziReferenceCode) çifti `webhook_events`
 *     tablosunda UNIQUE'tir. iyzico aynı olayı birden çok kez gönderebilir
 *     (2xx yanıtı alana dek 15 dk'da bir tekrar) — ikinci kez geldiğinde
 *     sipariş durumu TEKRAR işlenmez, sadece 200 dönülür.
 *
 *  3. TUTAR DOĞRULAMASI: ödeme "başarılı" bildirimi bile olsa, sipariş `paid`
 *     işaretlenmeden önce token ile sunucu-sunucu retrieve edilip tahsil edilen
 *     tutar siparişin toplamıyla karşılaştırılır (confirmCheckoutPayment).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = await safeRateLimit(webhookRateLimit, ip);
  if (!success) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  const rawBody = await request.text();

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  const parsed = iyzicoWebhookPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    Sentry.captureMessage('iyzico webhook: beklenmeyen payload şekli', { level: 'warning' });
    return NextResponse.json({ error: 'Beklenmeyen payload şekli.' }, { status: 400 });
  }
  const payload = parsed.data;

  const signature = request.headers.get('x-iyz-signature-v3');
  const signatureValid = verifyIyzicoWebhookSignature(
    {
      iyziEventType: payload.iyziEventType,
      iyziPaymentId: payload.iyziPaymentId,
      token: payload.token,
      paymentConversationId: payload.paymentConversationId,
      status: payload.status
    },
    signature
  );

  if (!signatureValid) {
    Sentry.captureMessage('iyzico webhook: geçersiz imza', { level: 'warning' });
    return NextResponse.json({ error: 'Geçersiz imza.' }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceRoleClient();

  // Idempotency: aynı bildirim daha önce işlendiyse sessizce 200 dön.
  const { error: insertError } = await serviceClient
    .from('webhook_events')
    .insert({ provider: 'iyzico', event_id: payload.iyziReferenceCode, payload });

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    Sentry.captureException(insertError);
    return NextResponse.json({ error: 'Olay kaydedilemedi.' }, { status: 500 });
  }

  // Terminal ödeme durumları: token ile GERÇEK sonucu doğrula (tutar kontrollü).
  // INIT_THREEDS gibi ara durumlarda hiçbir şey yapılmaz.
  if (payload.status === 'SUCCESS' || payload.status === 'FAILURE') {
    await confirmCheckoutPayment(payload.token);
  }

  return NextResponse.json({ received: true });
}
