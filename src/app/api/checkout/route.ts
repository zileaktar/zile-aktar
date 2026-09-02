import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { checkoutRequestSchema } from '@/lib/validations/checkout';
import { checkoutRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { checkTrustedOrigin } from '@/lib/csrf';
import { initializeCheckoutForm } from '@/lib/iyzico';
import { sendOrderPlacedEmail } from '@/lib/email';
import { isValidTcKimlikNo } from '@/lib/tc-kimlik-no';
import { env } from '@/lib/env.mjs';

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
  const { success, reset } = await safeRateLimit(checkoutRateLimit, ip);
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
  const { items, address, billingAddress, paymentMethod, couponCode } = parsed.data;

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
      p_payment_provider: paymentMethod === 'havale' ? 'havale' : 'iyzico',
      p_user_id: user?.id ?? null,
      p_coupon_code: couponCode && couponCode.trim() ? couponCode.trim() : null
    })
    .single();

  if (rpcError || !orderResult) {
    const { userMessage, status } = mapDatabaseError(rpcError?.message ?? '');
    if (status === 500) Sentry.captureException(rpcError);
    return NextResponse.json({ error: userMessage }, { status });
  }

  const { order_id: orderId, order_number: orderNumber, total_cents: totalCents, subtotal_cents: subtotalCents } = orderResult as {
    order_id: string;
    order_number: string;
    subtotal_cents: number;
    shipping_cents: number;
    total_cents: number;
  };

  // Giriş yapmış kullanıcının bilgilerini bir sonraki alışveriş için kaydet:
  // telefon profiles'a, teslimat adresi addresses'e (tek varsayılan adres modeli).
  // Hata olsa bile sipariş akışı bozulmasın diye best-effort (await ama try/catch yok — hata Sentry'ye düşer).
  if (user) {
    await serviceClient.from('profiles').update({ phone: address.phone }).eq('id', user.id);
    await serviceClient.from('addresses').delete().eq('user_id', user.id);
    await serviceClient.from('addresses').insert({
      user_id: user.id,
      label: 'Teslimat Adresi',
      full_name: address.fullName,
      phone: address.phone,
      city: address.city,
      district: address.district,
      address_line: address.addressLine,
      is_default: true
    });
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

  // Havale/EFT: iyzico'ya istek gitmez. Sipariş 'pending' oluşturuldu; müşteri
  // banka hesabına ödeme yapıp açıklamaya sipariş numarasını yazar, operasyon
  // ekibi dekontu görünce admin panelinden durumu 'paid' yapar. Bu ana kadar
  // stok rezerve edilmiş sayılır (create_order stoğu düştü).
  if (paymentMethod === 'havale') {
    await sendOrderPlacedEmail(orderId);
    return NextResponse.json({
      orderNumber,
      redirectUrl: `/siparis-alindi?order=${orderNumber}&odeme=havale`
    });
  }

  // iyzico sıfır (veya negatif) tutarlı bir ödeme başlatamaz — indirimler tutarı
  // 0'a indirdiyse kart akışı çalışmaz. Sipariş iptal edilir, müşteriye havale önerilir.
  if (totalCents <= 0) {
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return NextResponse.json(
      { error: 'İndirimler sonrası ödenecek tutar sıfır olduğu için kart ödemesi yapılamıyor. Lütfen Havale/EFT seçin.' },
      { status: 409 }
    );
  }

  // Kredi/banka kartı: iyzico'nun barındırdığı 3D Secure formunu başlat.
  // Kart verisi hiçbir zaman bizim sunucumuza uğramaz.
  // iyzico, basketItems fiyat toplamının `price` alanına eşit olmasını zorunlu kılar;
  // bu yüzden gerçek satır fiyatları, RPC'nin oluşturduğu order_items'tan (DB'den) okunur.
  const { data: createdItems, error: itemsError } = await serviceClient
    .from('order_items')
    .select('variant_id, product_name_snapshot, unit_price_cents, quantity')
    .eq('order_id', orderId);

  if (itemsError || !createdItems) {
    Sentry.captureException(itemsError);
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return NextResponse.json({ error: 'Sipariş kalemleri okunamadı.' }, { status: 500 });
  }

  // checkoutRequestSchema.superRefine() zaten paymentMethod === 'card' iken
  // identityNumber'ın geçerli bir T.C. Kimlik No olmasını zorunlu kılar; bu,
  // o garantinin BAŞKA bir çağrı yolundan (ör. ileride eklenecek bir admin
  // "müşteri adına sipariş oluştur" özelliği) atlanmadığını doğrulayan
  // savunma amaçlı ikinci bir kontroldür.
  if (!address.identityNumber || !isValidTcKimlikNo(address.identityNumber)) {
    return NextResponse.json({ error: 'Kart ile ödeme için geçerli bir T.C. Kimlik No gereklidir.' }, { status: 400 });
  }

  try {
    const checkoutForm = await initializeCheckoutForm({
      conversationId: orderId,
      price: (subtotalCents / 100).toFixed(2),
      paidPrice: (totalCents / 100).toFixed(2),
      callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/iyzico/callback`,
      buyer: {
        id: user?.id ?? `guest-${orderId}`,
        name: address.fullName.split(' ')[0] ?? address.fullName,
        surname: address.fullName.split(' ').slice(1).join(' ') || address.fullName,
        email: address.email,
        identityNumber: address.identityNumber,
        phone: address.phone,
        city: address.city,
        country: 'Turkey',
        address: address.addressLine,
        ip
      },
      basketItems: createdItems.map((i) => ({
        id: i.variant_id,
        name: i.product_name_snapshot,
        category1: 'Aktar',
        itemType: 'PHYSICAL' as const,
        price: ((i.unit_price_cents * i.quantity) / 100).toFixed(2)
      }))
    });

    if (checkoutForm.status !== 'success' || !checkoutForm.token) {
      console.error('[checkout] iyzico initialize başarısız:', JSON.stringify(checkoutForm));
      await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
      return NextResponse.json({ error: checkoutForm.errorMessage ?? 'Ödeme başlatılamadı.' }, { status: 502 });
    }

    await serviceClient.from('orders').update({ payment_conversation_id: orderId }).eq('id', orderId);

    // Redirect yöntemi: istemci `paymentPageUrl`'e yönlendirir. Kart + 3DS iyzico'nun
    // kendi alan adında gerçekleşir; ödeme sonrası iyzico kullanıcıyı callbackUrl'e
    // (/api/webhooks/iyzico/callback) getirir, o da /siparis-alindi'ye yönlendirir.
    return NextResponse.json({ orderNumber, paymentPageUrl: checkoutForm.paymentPageUrl });
  } catch (err) {
    console.error('[checkout] iyzico initialize hata:', err instanceof Error ? err.message : err);
    Sentry.captureException(err);
    await serviceClient.rpc('mark_order_failed', { p_order_id: orderId });
    return NextResponse.json({ error: 'Ödeme sağlayıcısına bağlanılamadı. Lütfen tekrar deneyin.' }, { status: 502 });
  }
}
