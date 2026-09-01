import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { confirmCheckoutPayment } from '@/lib/payments';
import { env } from '@/lib/env.mjs';
import { webhookRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * iyzico, 3D Secure doğrulaması bittikten sonra kullanıcının TARAYICISINI bu uca
 * `token` alanı içeren bir form POST'u ile yönlendirir. Bu istek asla "ödeme
 * başarılı" anlamına gelmez — token'ı alıp sunucu-sunucu (confirmCheckoutPayment
 * -> retrieveCheckoutFormResult) ile GERÇEK sonucu ve tahsil edilen tutarı
 * doğrulamadan hiçbir sipariş "paid" işaretlenmez. Bu, sahte/başarısız bir
 * callback isteğiyle ödeme atlatma saldırısını engeller.
 *
 * Rate limit: bu uç nokta kimlik doğrulaması gerektirmez (iyzico'nun yönlendirdiği
 * herkes erişebilir), bu yüzden geçersiz `token` değerleriyle otomatik deneme/tarama
 * yapılmasına karşı IP bazlı sınırlama uygulanır.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = await safeRateLimit(webhookRateLimit, ip);
  if (!success) {
    return NextResponse.redirect(new URL('/odeme-basarisiz?reason=rate_limited', env.NEXT_PUBLIC_APP_URL));
  }

  const formData = await request.formData();
  const token = formData.get('token');

  if (typeof token !== 'string' || !token) {
    return NextResponse.redirect(new URL('/odeme-basarisiz?reason=missing_token', env.NEXT_PUBLIC_APP_URL));
  }

  try {
    const outcome = await confirmCheckoutPayment(token);
    if (outcome.status !== 'paid') {
      console.error('[iyzico callback] ödeme onaylanmadı:', JSON.stringify(outcome));
    }

    if (outcome.status === 'paid') {
      return NextResponse.redirect(
        new URL(`/siparis-alindi?order=${outcome.orderNumber}`, env.NEXT_PUBLIC_APP_URL)
      );
    }

    const reason = outcome.status === 'failed' && outcome.reason === 'amount_mismatch' ? '?reason=amount_mismatch' : '';
    return NextResponse.redirect(new URL(`/odeme-basarisiz${reason}`, env.NEXT_PUBLIC_APP_URL));
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.redirect(new URL('/odeme-basarisiz?reason=server_error', env.NEXT_PUBLIC_APP_URL));
  }
}
