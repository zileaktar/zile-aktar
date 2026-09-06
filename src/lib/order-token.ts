import 'server-only';
import crypto from 'node:crypto';
import { env } from '@/lib/env.mjs';

/**
 * /siparis-alindi (sipariş onay) sayfası, sipariş numarasını URL query'sinden alır.
 * Sipariş numaraları kısmen tahmin edilebilir olduğundan (KA-YYMMDD-NNNNNN),
 * ham numarayla sayfaya gelen biri sipariş tutarını görebiliyor ve GA/Meta Pixel
 * "purchase" olayını sahte olarak tetikleyebiliyordu (analytics kirliliği).
 *
 * Çözüm: checkout ve iyzico-callback rotaları sipariş numarasını kısa bir HMAC
 * imzasıyla birlikte yönlendirir. Onay sayfası, imza geçerli değilse hiçbir
 * veritabanı sorgusu yapmaz ve analytics olayı ateşlemez.
 *
 * İmza anahtarı zaten zorunlu olan CRON_SECRET'tan, alan-ayrımı (domain
 * separation) etiketiyle türetilir — ayrı bir env değişkeni gerektirmez.
 */
export function signOrderNumber(orderNumber: string): string {
  return crypto
    .createHmac('sha256', env.CRON_SECRET)
    .update(`siparis-alindi:${orderNumber}`)
    .digest('hex')
    .slice(0, 24);
}

export function verifyOrderNumber(orderNumber: string | undefined, token: string | undefined): boolean {
  if (!orderNumber || !token) return false;
  const expected = Buffer.from(signOrderNumber(orderNumber));
  const received = Buffer.from(token);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
