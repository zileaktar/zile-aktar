import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { confirmVakifbankPayment } from '@/lib/payments';
import { verifyPaymentReturn, signOrderNumber } from '@/lib/order-token';
import { webhookRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { env } from '@/lib/env.mjs';

export const runtime = 'nodejs';

/**
 * VakıfBank "Güvenli Ortak Ödeme" SuccessUrl VE FailUrl olarak AYNI uç
 * kullanılır (`?result=success|fail` yalnızca UX ipucu — GÜVENLİK KARARI
 * DEĞİL). Banka bu adrese ödeme/sipariş kimliği EKLEMEZ; bu yüzden hangi
 * siparişin döndüğünü kendi imzaladığımız `order`+`t` parametreleriyle
 * taşırız (bkz. createCommonPaymentToken çağrısı, checkout/route.ts).
 *
 * Gerçek sonuç HER ZAMAN sunucu-sunucu sorgulanır (confirmVakifbankPayment) —
 * `result=success` parametresi asla tek başına ödemeyi onaylatmaz.
 */
async function handleReturn(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = await safeRateLimit(webhookRateLimit, ip);
  if (!success) {
    return NextResponse.redirect(new URL('/odeme-basarisiz?reason=rate_limited', env.NEXT_PUBLIC_APP_URL));
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get('order') ?? undefined;
  const token = url.searchParams.get('t') ?? undefined;

  if (!verifyPaymentReturn(orderId, token)) {
    Sentry.captureMessage('VakıfBank dönüşü: geçersiz/eksik doğrulama tokeni', { level: 'warning' });
    return NextResponse.redirect(new URL('/odeme-basarisiz?reason=invalid_token', env.NEXT_PUBLIC_APP_URL));
  }

  try {
    const outcome = await confirmVakifbankPayment(orderId!);

    if (outcome.status === 'paid') {
      const t = signOrderNumber(outcome.orderNumber);
      return NextResponse.redirect(new URL(`/siparis-alindi?order=${outcome.orderNumber}&t=${t}`, env.NEXT_PUBLIC_APP_URL));
    }

    const reason = outcome.status === 'failed' && outcome.reason === 'amount_mismatch' ? '?reason=amount_mismatch' : '';
    return NextResponse.redirect(new URL(`/odeme-basarisiz${reason}`, env.NEXT_PUBLIC_APP_URL));
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.redirect(new URL('/odeme-basarisiz?reason=server_error', env.NEXT_PUBLIC_APP_URL));
  }
}

// Banka dönüşü genelde tarayıcı GET yönlendirmesidir; bazı entegrasyonlarda
// form POST de görülebildiği için ikisi de aynı mantığa yönlendirilir.
export async function GET(request: Request) {
  return handleReturn(request);
}

export async function POST(request: Request) {
  return handleReturn(request);
}
