import 'server-only';
import { env } from '@/lib/env.mjs';
import { redactPIIString } from '@/lib/mask';

/**
 * VakıfBank Sanal POS — "Güvenli Ortak Ödeme" (Common Payment) istemcisi.
 *
 * Kart numarası/CVV hiçbir zaman bizim sunucumuza uğramaz: müşteri kartını
 * doğrudan VakıfBank'ın barındırdığı ödeme sayfasında (PaymentToken ile
 * yönlendirilen `guvenliodeme(.test).vakifbank.com.tr`) girer — tam olarak
 * iyzico Checkout Form'un çalışma şekliyle aynı, PCI-DSS kapsamını daraltır.
 *
 * Kaynak: VakıfBank "Güvenli Ortak Ödeme Entegrasyon Rehberi" v1.2 (18.09.2026).
 *
 * NOT — alan adı belirsizliği: Dokümanın JSON örneğinde `SecureType` alanı
 * kullanılırken, aynı dokümanın "temel alanlar" tablosunda `IsSecure` adı
 * geçiyor (bankanın kendi dokümanındaki bir tutarsızlık). Burada JSON
 * ÖRNEĞİNDEKİ birebir alan adları kullanıldı (somut, çalıştığı gösterilen
 * tek kaynak). CANLIYA GEÇMEDEN ÖNCE sandbox'ta gerçek bir istek atıp
 * `ErrorCode`/`ResponseMessage` alanlarının beklendiği gibi döndüğü MUTLAKA
 * doğrulanmalı; alan adı yanlışsa banka açık bir hata koduyla reddeder.
 */

interface VakifbankFetchOptions {
  path: string;
  body: Record<string, unknown>;
}

// VakıfBank'ın ağ geçidi (F5 WAF) "User-Agent"/"Accept" başlığı taşımayan
// istekleri şüpheli bulup HTML bir "Request Rejected" sayfasıyla reddedebiliyor
// (JSON API bekleyen istemci için kafa karıştırıcı bir hata verir). Bu yüzden
// istekler her zaman tarayıcı benzeri standart başlıklarla gönderilir.
const VAKIFBANK_REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZileAktarSanalPos/1.0',
  Accept: 'application/json, text/plain, */*'
};

async function vakifbankJsonPost<T>({ path, body }: VakifbankFetchOptions): Promise<T> {
  const response = await fetch(`${env.VAKIFBANK_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...VAKIFBANK_REQUEST_HEADERS },
    body: JSON.stringify(body)
  });

  const bodyText = await response.text();

  if (!response.ok) {
    // DİKKAT: bodyText'te MerchantPassword asla yok (biz göndeririz, banka
    // yanıtında geri yansıtmaz) ama yine de emniyet için maskelenmiş loglanır.
    throw new Error(`VakıfBank ${path} isteği başarısız: HTTP ${response.status} — ${redactPIIString(bodyText).slice(0, 500)}`);
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error(`VakıfBank ${path} yanıtı JSON değil: ${redactPIIString(bodyText).slice(0, 500)}`);
  }
}

// virtualPos servisleri (Vposreq: iptal/iade) canlıda Ortak Ödeme servislerinden
// FARKLI bir sunucuda: apigw.vakifbank.com.tr. Testte ikisi aynı sunucu.
async function vakifbankXmlPost(path: string, xmlBody: string): Promise<string> {
  const response = await fetch(`${env.VAKIFBANK_VPOS_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml', ...VAKIFBANK_REQUEST_HEADERS },
    body: xmlBody
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`VakıfBank ${path} isteği başarısız: HTTP ${response.status} — ${redactPIIString(bodyText).slice(0, 500)}`);
  }
  return bodyText;
}

/** XML gövdesine gömülecek serbest metinleri güvenli hale getirir (enjeksiyon/bozulma önleme). */
function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export interface CreateCommonPaymentTokenParams {
  orderId: string; // bizim orders.id (uuid) — VakıfBank'a OrderId olarak gider
  amount: string; // "123.45" formatında, nokta ayraçlı
  clientIp: string;
  successUrl: string;
  failUrl: string;
  cardHoldersName?: string;
  buyerPhone?: string; // 90XXXXXXXXXX formatında (başında + veya 0 OLMADAN)
  buyerEmail?: string;
}

export interface CreateCommonPaymentTokenResult {
  CommonPaymentUrl?: string;
  PaymentToken?: string;
  ResponseMessage?: string;
  ErrorCode?: string;
}

/**
 * Ödeme oturumu (token) oluşturur. Dönen `PaymentToken` ile müşteri
 * `${VAKIFBANK_PAYMENT_PAGE_URL}/CommonPayment/SecurePayment?PTKN=<token>`
 * adresine yönlendirilir — kartı ORADA girer.
 */
export async function createCommonPaymentToken(params: CreateCommonPaymentTokenParams): Promise<CreateCommonPaymentTokenResult> {
  const payload = {
    MerchantNumber: env.VAKIFBANK_MERCHANT_NUMBER,
    Password: env.VAKIFBANK_PASSWORD,
    TerminalNumber: env.VAKIFBANK_TERMINAL_NUMBER,
    OrderId: params.orderId,
    TransactionType: 'Sale',
    CardHoldersName: params.cardHoldersName ?? '',
    CHPhoneNumber: params.buyerPhone ?? '',
    CHEmailAddress: params.buyerEmail ?? '',
    RequestLanguage: 1, // 1: Türkçe
    CurrencyCode: 949, // TRY
    Amount: params.amount,
    // "IsSecure" alan tablosuna göre: 1 = 3D Secure zorunlu. Kayıtlı olmayan
    // kartlarda işlemi reddetmesi için AllowNotEnrolledCard=0 (Non Secure'a
    // düşmesin, 3D Secure'suz işlem kart hamili itirazlarına açıktır).
    SecureType: 1,
    AllowNotEnrolledCard: 0,
    TransactionChannel: 1, // 1: Finansal işlem
    ClientIp: params.clientIp,
    TransactionSource: 1,
    SuccessUrl: params.successUrl,
    FailUrl: params.failUrl
  };

  const result = await vakifbankJsonPost<CreateCommonPaymentTokenResult>({
    path: '/commonPayment/CreateTokenCPY',
    body: payload
  });

  if (result.ErrorCode !== '0000') {
    console.error('[vakifbank] CreateTokenCPY başarısız:', redactPIIString(JSON.stringify(result)).slice(0, 800));
  }

  return result;
}

export interface GetVposTransactionResult {
  Rc?: string;
  AuthCode?: string;
  Rrn?: string;
  Message?: string;
  TransactionId?: string;
  PaymentToken?: string;
  MaskedPan?: string;
  Amount?: string;
  AmountCode?: string;
  TransactionType?: string;
  Status?: number;
  StatusDetail?: string;
  AuthResultCode?: string;
  AuthResultDescription?: string;
}

/**
 * Bir `PaymentToken`'a ait GERÇEK işlem sonucunu sunucu-sunucu sorgular.
 * SuccessUrl/FailUrl dönüşüne ASLA güvenilmez — ödeme yalnızca bu sorgu
 * `Rc === '0000' && AuthResultCode === '0000'` döndüğünde onaylanır.
 */
export async function getVposTransaction(paymentToken: string): Promise<GetVposTransactionResult> {
  return vakifbankJsonPost<GetVposTransactionResult>({
    path: '/commonPayment/GetVposTransaction',
    body: {
      MerchantNumber: env.VAKIFBANK_MERCHANT_NUMBER,
      Password: env.VAKIFBANK_PASSWORD,
      PaymentToken: paymentToken
    }
  });
}

export type VposCancelOrRefundType = 'Cancel' | 'Refund';

export interface VposCancelOrRefundResult {
  resultCode: string | null; // "0000" başarı
  resultDetail: string | null;
  raw: string;
}

/**
 * İptal (aynı gün) veya iade (aynı gün + ertesi gün, kısmi tutar destekli).
 * `referenceTransactionId`, GetVposTransaction/Search yanıtındaki `TransactionId`
 * olmalıdır. `amount` yalnızca kısmi iadede gönderilir (tam iptalde gerekmez).
 */
export async function cancelOrRefundTransaction(params: {
  type: VposCancelOrRefundType;
  referenceTransactionId: string;
  amount?: string;
  clientIp: string;
}): Promise<VposCancelOrRefundResult> {
  const amountTag = params.amount ? `<CurrencyAmount>${xmlEscape(params.amount)}</CurrencyAmount>` : '';
  const xml =
    '<VposRequest>' +
    `<MerchantId>${xmlEscape(env.VAKIFBANK_MERCHANT_NUMBER)}</MerchantId>` +
    `<Password>${xmlEscape(env.VAKIFBANK_PASSWORD)}</Password>` +
    `<TerminalNo>${xmlEscape(env.VAKIFBANK_TERMINAL_NUMBER)}</TerminalNo>` +
    `<TransactionType>${params.type}</TransactionType>` +
    amountTag +
    `<ReferenceTransactionId>${xmlEscape(params.referenceTransactionId)}</ReferenceTransactionId>` +
    `<ClientIp>${xmlEscape(params.clientIp)}</ClientIp>` +
    '</VposRequest>';

  const raw = await vakifbankXmlPost('/virtualPos/Vposreq', xml);

  // Basit XML alan çıkarımı (ek bağımlılık gerektirmeden) — yalnızca iki alan lazım.
  const resultCode = raw.match(/<ResultCode>([^<]*)<\/ResultCode>/)?.[1] ?? null;
  const resultDetail = raw.match(/<ResultDetail>([^<]*)<\/ResultDetail>/)?.[1] ?? null;

  if (resultCode !== '0000') {
    console.error('[vakifbank] iptal/iade başarısız:', redactPIIString(raw).slice(0, 800));
  }

  return { resultCode, resultDetail, raw };
}
