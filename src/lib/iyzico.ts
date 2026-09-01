import 'server-only';
import crypto from 'node:crypto';
import { env } from '@/lib/env.mjs';

/**
 * iyzico entegrasyon istemcisi (IYZWSv2 / HMACSHA256 imzalama şeması).
 *
 * IYZWSv2 algoritması (docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth):
 *
 *   randomKey    = <timestamp><rastgele>              (aynı değer x-iyzi-rnd header'ında da gönderilir)
 *   payload      = randomKey + uriPath + <GÖNDERİLEN HAM JSON GÖVDE>
 *   signature    = HMAC_SHA256(secretKey, payload)  ->  hex
 *   authString   = "apiKey:" + apiKey + "&randomKey:" + randomKey + "&signature:" + signature
 *   Authorization: "IYZWSv2 " + base64(authString)
 *
 * KRİTİK: imzada kullanılan JSON gövde string'i, HTTP body olarak gönderilenle
 * BİRE BİR aynı olmalıdır (bu yüzden JSON.stringify tek sefer yapılıp ikisinde de kullanılır).
 */

function generateRandomKey(): string {
  return `${Date.now()}${crypto.randomBytes(6).toString('hex')}`;
}

function hmacSha256Hex(secretKey: string, data: string): string {
  return crypto.createHmac('sha256', secretKey).update(data, 'utf8').digest('hex');
}

function buildAuthorizationHeader(uriPath: string, randomKey: string, requestBody: string): string {
  const signature = hmacSha256Hex(env.IYZICO_SECRET_KEY, randomKey + uriPath + requestBody);
  const authorizationString = `apiKey:${env.IYZICO_API_KEY}&randomKey:${randomKey}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(authorizationString, 'utf8').toString('base64')}`;
}

/** İmzalı iyzico POST isteği — auth header, x-iyzi-rnd ve gövde imzayla tutarlı gönderilir. */
async function iyzicoPost<T>(uriPath: string, payload: Record<string, unknown>): Promise<T> {
  const randomKey = generateRandomKey();
  const body = JSON.stringify(payload);

  const response = await fetch(`${env.IYZICO_BASE_URL}${uriPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: buildAuthorizationHeader(uriPath, randomKey, body),
      'x-iyzi-rnd': randomKey
    },
    body
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`iyzico ${uriPath} isteği başarısız: HTTP ${response.status} — ${bodyText.slice(0, 500)}`);
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error(`iyzico ${uriPath} yanıtı JSON değil: ${bodyText.slice(0, 500)}`);
  }
}

interface IyzicoBuyer {
  id: string;
  name: string;
  surname: string;
  email: string;
  identityNumber: string; // TC Kimlik No — iyzico zorunlu alanı
  phone: string;
  city: string;
  country: string;
  address: string;
  ip: string;
}

interface InitializeCheckoutFormParams {
  conversationId: string;
  price: string; // "123.45" formatında, KDV dahil ürün toplamı
  paidPrice: string; // "123.45" formatında, kargo dahil genel toplam
  currency?: 'TRY';
  callbackUrl: string; // 3DS sonrası iyzico'nun POST edeceği /api/webhooks/iyzico/callback
  buyer: IyzicoBuyer;
  basketItems: Array<{ id: string; name: string; category1: string; itemType: 'PHYSICAL'; price: string }>;
}

export interface IyzicoCheckoutFormResult {
  status: 'success' | 'failure';
  checkoutFormContent?: string; // iframe içine gömülecek HTML
  paymentPageUrl?: string;
  token?: string;
  errorMessage?: string;
}

/**
 * iyzico "Checkout Form Initialize" isteği — kart bilgileri hiçbir zaman bizim
 * sunucumuza gelmez, kullanıcı doğrudan iyzico'nun barındırdığı 3D Secure
 * formunu doldurur (PCI-DSS kapsamını büyük ölçüde daraltır).
 */
export async function initializeCheckoutForm(params: InitializeCheckoutFormParams): Promise<IyzicoCheckoutFormResult> {
  const uriPath = '/payment/iyzipos/checkoutform/initialize/auth/ecom';
  const contactName = `${params.buyer.name} ${params.buyer.surname}`.trim();
  const payload = {
    locale: 'tr',
    conversationId: params.conversationId,
    price: params.price,
    paidPrice: params.paidPrice,
    currency: params.currency ?? 'TRY',
    basketId: params.conversationId,
    paymentGroup: 'PRODUCT',
    callbackUrl: params.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    // iyzico buyer şeması: adres alanı `registrationAddress`, telefon `gsmNumber`.
    buyer: {
      id: params.buyer.id,
      name: params.buyer.name,
      surname: params.buyer.surname,
      gsmNumber: params.buyer.phone,
      email: params.buyer.email,
      identityNumber: params.buyer.identityNumber,
      registrationAddress: params.buyer.address,
      city: params.buyer.city,
      country: params.buyer.country,
      ip: params.buyer.ip
    },
    shippingAddress: { contactName, city: params.buyer.city, country: params.buyer.country, address: params.buyer.address },
    billingAddress: { contactName, city: params.buyer.city, country: params.buyer.country, address: params.buyer.address },
    basketItems: params.basketItems
  };

  const parsed = await iyzicoPost<IyzicoCheckoutFormResult>(uriPath, payload);

  // iyzico başarısızlıkta HTTP 200 + { status: 'failure', errorMessage, errorCode } döndürebilir.
  if (parsed.status !== 'success') {
    console.error('[iyzico] initialize failure:', JSON.stringify(parsed).slice(0, 800));
  }

  return parsed;
}

export interface IyzicoPaymentRetrieveResult {
  status: 'success' | 'failure';
  // "SUCCESS" | "FAILURE" | "INIT_THREEDS" | "CALLBACK_THREEDS" | "BANK_FAIL" ...
  paymentStatus?: string;
  paymentId?: string | number;
  // conversationId gönderdiysek yanıtta döner; bazı yanıtlarda sipariş kimliği
  // yalnızca basketId'de bulunur (initializeCheckoutForm'da ikisini de orderId yaptık).
  conversationId?: string;
  basketId?: string;
  price?: string | number;
  paidPrice?: string | number;
  errorMessage?: string;
}

/** 3DS yönlendirmesinden dönen `token` ile ödemenin gerçek sonucunu sunucu-sunucu doğrular. */
export async function retrieveCheckoutFormResult(token: string): Promise<IyzicoPaymentRetrieveResult> {
  return iyzicoPost<IyzicoPaymentRetrieveResult>('/payment/iyzipos/checkoutform/auth/ecom/detail', {
    locale: 'tr',
    token
  });
}

/**
 * Webhook imza doğrulama — `X-IYZ-SIGNATURE-V3` başlığı.
 *
 * iyzico'nun resmi HPP (Checkout Form / ödeme sayfası) formülü (docs.iyzico.com/ek-servisler/webhook):
 *
 *   key = secretKey + iyziEventType + iyziPaymentId + token + paymentConversationId + status
 *   signature = HMAC_SHA256(secretKey, key)  ->  hex
 *
 * Karşılaştırma zamanlama saldırılarına karşı SABİT ZAMANLIDIR (crypto.timingSafeEqual).
 *
 * NOT — imza anahtarı: iyzico dokümanı HMAC anahtarı olarak "secretKey"i (API
 * SECRET_KEY) belirtir. Bazı hesaplarda entegrasyon ekibi ayrı bir webhook
 * imzalama anahtarı verebilir; bu yüzden anahtar `IYZICO_WEBHOOK_SECRET` env
 * değişkeninden okunur — çoğu durumda bunu `IYZICO_SECRET_KEY` ile aynı değere
 * ayarlamak yeterlidir. Webhook imza özelliği ayrıca iyzico tarafında
 * (integration@iyzico.com) etkinleştirilmelidir; SANDBOX'ta uçtan uca doğrulanmalıdır.
 */
export interface IyzicoWebhookSignatureFields {
  iyziEventType: string;
  iyziPaymentId: string;
  token: string;
  paymentConversationId: string;
  status: string;
}

export function verifyIyzicoWebhookSignature(fields: IyzicoWebhookSignatureFields, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const key =
    env.IYZICO_WEBHOOK_SECRET +
    fields.iyziEventType +
    fields.iyziPaymentId +
    fields.token +
    fields.paymentConversationId +
    fields.status;

  const expected = hmacSha256Hex(env.IYZICO_WEBHOOK_SECRET, key);

  let expectedBuffer: Buffer;
  let receivedBuffer: Buffer;
  try {
    expectedBuffer = Buffer.from(expected, 'hex');
    receivedBuffer = Buffer.from(signatureHeader.trim(), 'hex');
  } catch {
    return false;
  }

  if (expectedBuffer.length === 0 || expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
