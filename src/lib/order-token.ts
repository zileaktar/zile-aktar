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

/**
 * VakıfBank "Güvenli Ortak Ödeme" SuccessUrl/FailUrl dönüşü için imza.
 *
 * Banka, dönüş adresine ödeme/sipariş kimliği EKLEMİYOR (dokümanın kendi
 * güvenlik önerisi: "her işlem için rastgele, tahmin edilemez bir doğrulama
 * tokeni ekleyin"). Bu yüzden hangi siparişin döndüğünü KENDİ imzamızla
 * taşırız — orderId (uuid, orders.id) buradan imzalanır. Ayrı bir alan-ayrımı
 * etiketiyle (`vakifbank-return`) signOrderNumber'dan bağımsız tutulur ki iki
 * token türü birbirinin yerine geçirilip kullanılamasın.
 */
export function signPaymentReturn(orderId: string): string {
  return crypto.createHmac('sha256', env.CRON_SECRET).update(`vakifbank-return:${orderId}`).digest('hex').slice(0, 24);
}

export function verifyPaymentReturn(orderId: string | undefined, token: string | undefined): boolean {
  if (!orderId || !token) return false;
  const expected = Buffer.from(signPaymentReturn(orderId));
  const received = Buffer.from(token);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
