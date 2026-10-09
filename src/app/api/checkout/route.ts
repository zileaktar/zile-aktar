import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { checkoutRequestSchema } from '@/lib/validations/checkout';
import { checkoutRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { checkTrustedOrigin } from '@/lib/csrf';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { createCommonPaymentToken } from '@/lib/vakifbank';
import { sendOrderPlacedEmail } from '@/lib/email';
import { notifyNewOrder } from '@/lib/notify';
import { env } from '@/lib/env.mjs';
import { redactPII, redactPIIString } from '@/lib/mask';
import { signOrderNumber, signPaymentReturn, PAYMENT_RETURN_TTL_MS } from '@/lib/order-token';

export const runtime = 'nodejs';

const PG_ERROR_MESSAGES: Record<string, string> = {
  EMPTY_CART: 'Sepetiniz boş.',
  INVALID_QUANTITY: 'Geçersiz ürün adedi.',
  VARIANT_NOT_FOUND: 'Sepetinizdeki bir ürün artık mevcut değil.',
  INSUFFICIENT_STOCK: 'Sepetinizdeki bir ürün için yeterli stok kalmadı.',
  COUPON_INVALID: 'İndirim kodu geçersiz.',
  COUPON_EXPIRED: 'İndirim kodunun süresi dolmuş.',
  COUPON_EXHAUSTED: 'İndirim kodu kullanım limitine ulaşmış.',
  COUPON_MIN_CART: 'Sepet tutarı bu indirim kodu için yeterli değil.',
  COUPON_ALREADY_USED: 'Bu indirim kodunu daha önce kullandınız.'
};

function mapDatabaseError(message: string): { userMessage: string; status: number } {
  for (const [code, userMessage] of Object.entries(PG_ERROR_MESSAGES)) {
    if (message.includes(code)) return { userMessage, status: 409 };
  }
  return { userMessage: 'Sipariş oluşturulamadı, lütfen tekrar deneyin.', status: 500 };
}

export async function POST(request: Request) {
  const csrfResponse = checkTrustedOrigin(request);
  if (csrfResponse) return csrfResponse;

  const ip = getClientIp(request.headers);
  // failClosed: hız sınırlayıcı (Upstash) çalışmıyorsa ödeme başlatma reddedilir
  // — kart denemesi/sipariş spam'i yerine kısa süreli kesinti tercih edildi.
  const { success, reset } = await safeRateLimit(checkoutRateLimit, ip, { failClosed: true });
  if (!success) {
    return NextResponse.json(
      { error: 'Çok fazla sipariş denemesi yapıldı. Lütfen biraz sonra tekrar deneyin.' },
      { status: 429, headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() } }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz sipariş bilgisi.', details: parsed.error.flatten() }, { status: 400 });
  }
  const { items, address, billingAddress, paymentMethod, couponCode, captchaToken } = parsed.data;

  // "Robot değilim" kontrolü — stok rezerve eden create_order'dan ÖNCE.
  if (!(await verifyTurnstileToken(captchaToken, ip))) {
    return NextResponse.json(
      { error: 'Güvenlik doğrulaması başarısız oldu. Lütfen "robot değilim" kutusunu tekrar onaylayın.', captchaFailed: true },
      { status: 403 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const serviceClient = createSupabaseServiceRoleClient();

  const { data: orderResult, error: rpcError } = await serviceClient
    .rpc('create_order', {
      p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      p_shipping_address: {
        full_name: address.fullName,
        phone: address.phone,
        city: address.city,
        district: address.district,
        address_line: address.addressLine
      },
      p_contact_email: address.email,
      p_contact_phone: address.phone,
      p_payment_provider: paymentMethod === 'havale' ? 'havale' : 'vakifbank',
      p_user_id: user?.id ?? null,
      p_coupon_code: couponCode && couponCode.trim() ? couponCode.trim() : null
    })
    .single();

  if (rpcError || !orderResult) {
    const { userMessage, status } = mapDatabaseError(rpcError?.message ?? '');
    if (status === 500) Sentry.captureException(rpcError);
    return NextResponse.json({ error: userMessage }, { status });
  }

  const { order_id: orderId, order_number: orderNumber, total_cents: totalCents } = orderResult as {
    order_id: string;
    order_number: string;
    subtotal_cents: number;
    shipping_cents: number;
    total_cents: number;
  };

  // Giriş yapmış kullanıcının bilgilerini bir sonraki alışveriş için kaydet:
  // telefon profiles'a, teslimat adresi addresses'e. Kullanıcının kayıtlı
  // adreslerini SİLMEDEN (çoklu adres modeli): aynı adres zaten varsa dokunma,
  // yoksa yeni satır ekle. İlk adres otomatik varsayılan olur; sonrakiler
  // kullanıcının seçtiği varsayılanı bozmaz (Hesabım → Adreslerim'den yönetilir).
  // Hata olsa bile sipariş akışı bozulmasın diye best-effort (hata Sentry'ye düşer).
  if (user) {
    await serviceClient.from('profiles').update({ phone: address.phone }).eq('id', user.id);

    const { data: existing } = await serviceClient
      .from('addresses')
      .select('id')
      .eq('user_id', user.id);
    const match = (existing ?? []).length
      ? (
          await serviceClient
            .from('addresses')
            .select('id')
            .eq('user_id', user.id)
            .eq('city', address.city)
            .eq('district', address.district)
            .eq('address_line', address.addressLine)
            .maybeSingle()
        ).data
      : null;

    if (!match) {
      await serviceClient.from('addresses').insert({
        user_id: user.id,
        label: 'Teslimat Adresi',
        full_name: address.fullName,
        phone: address.phone,
        city: address.city,
        district: address.district,
        address_line: address.addressLine,
        is_default: (existing?.length ?? 0) === 0
      });
    }
  }

  // Fatura adresi teslimat adresinden farklıysa siparişe eklenir (create_order
  // RPC'si yalnızca teslimat adresini alır; fatura adresi ayrıca yazılır).
  if (billingAddress) {
    await serviceClient
      .from('orders')
      .update({
        billing_address: {
          full_name: billingAddress.fullName,
          phone: billingAddress.phone,
          city: billingAddress.city,
          district: billingAddress.district,
          address_line: billingAddress.addressLine
        }
      })
      .eq('id', orderId);
  }

  // Havale/EFT: VakıfBank'a istek gitmez. Sipariş 'pending' oluşturuldu; müşteri
  // banka hesabına ödeme yapıp açıklamaya sipariş numarasını yazar, operasyon
  // ekibi dekontu görünce admin panelinden durumu 'paid' yapar. Bu ana kadar
  // stok rezerve edilmiş sayılır (create_order stoğu düştü).
  if (paymentMethod === 'havale') {
    await sendOrderPlacedEmail(orderId);
    await notifyNewOrder(orderId, 'havale');
    return NextResponse.json({
      orderNumber,
      redirectUrl: `/siparis-alindi?order=${orderNumber}&odeme=havale&t=${signOrderNumber(orderNumber)}`
    });
  }

  // VakıfBank sıfır (veya negatif) tutarlı bir ödeme başlatamaz — indirimler
  // tutarı 0'a indirdiyse kart akışı çalışmaz. Sipariş iptal edilir, müşteriye
  // havale önerilir.
  if (totalCents <= 0) {
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return NextResponse.json(
      { error: 'İndirimler sonrası ödenecek tutar sıfır olduğu için kart ödemesi yapılamıyor. Lütfen Havale/EFT seçin.' },
      { status: 409 }
    );
  }

  try {
    // Dönüş adresine banka hiçbir sipariş/ödeme kimliği EKLEMEZ (bkz.
    // güvenlik önerileri, Ortak Ödeme Entegrasyon Rehberi §12.1) — hangi
    // siparişin döndüğünü KENDİ imzaladığımız orderId+token taşır. `result=`
    // parametresi yalnızca UX ipucudur, dönüş rotası GERÇEK sonucu her koşulda
    // sunucu-sunucu (GetVposTransaction) sorgular.
    // Dönüş bağlantısı 2 saat geçerlidir; süre (`e`) imzanın içindedir.
    const exp = Date.now() + PAYMENT_RETURN_TTL_MS;
    const returnToken = signPaymentReturn(orderId, exp);
    const returnBase = `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/vakifbank/return?order=${orderId}&e=${exp}&t=${returnToken}`;

    const checkoutForm = await createCommonPaymentToken({
      orderId,
      amount: (totalCents / 100).toFixed(2),
      clientIp: ip,
      successUrl: `${returnBase}&result=success`,
      failUrl: `${returnBase}&result=fail`,
      cardHoldersName: address.fullName,
      // VakıfBank telefon formatı: başında 0/+ olmadan 90XXXXXXXXXX (12 hane).
      buyerPhone: `90${address.phone.replace(/^0/, '')}`,
      buyerEmail: address.email
    });

    if (checkoutForm.ErrorCode !== '0000' || !checkoutForm.PaymentToken || !checkoutForm.CommonPaymentUrl) {
      console.error('[checkout] VakıfBank token oluşturma başarısız:', redactPIIString(JSON.stringify(checkoutForm)));
      await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
      return NextResponse.json({ error: checkoutForm.ResponseMessage ?? 'Ödeme başlatılamadı.' }, { status: 502 });
    }

    // PaymentToken'ı saklıyoruz: dönüş rotası ve cron, GetVposTransaction ile
    // GERÇEK sonucu sorgularken bu değeri kullanır.
    await serviceClient.from('orders').update({ payment_conversation_id: checkoutForm.PaymentToken }).eq('id', orderId);

    return NextResponse.json({ orderNumber, paymentPageUrl: `${checkoutForm.CommonPaymentUrl}?PTKN=${checkoutForm.PaymentToken}` });
  } catch (err) {
    console.error('[checkout] VakıfBank token oluşturma hata:', err instanceof Error ? redactPIIString(err.message) : redactPII(err));
    Sentry.captureException(err);
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return NextResponse.json({ error: 'Ödeme sağlayıcısına bağlanılamadı. Lütfen tekrar deneyin.' }, { status: 502 });
  }
}
