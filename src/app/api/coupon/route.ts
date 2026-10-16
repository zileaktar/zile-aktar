import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { generalApiRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { checkTrustedOrigin } from '@/lib/csrf';
import { quoteCart } from '@/lib/shipping-server';

export const runtime = 'nodejs';

const bodySchema = z.object({
  code: z.string().trim().min(1).max(40),
  items: z
    .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) }))
    .min(1)
    .max(50)
});

/**
 * Ödeme sayfası için indirim kodu ÖNİZLEMESİ. Sepet ara toplamı istemciden
 * DEĞİL, varyant kimliklerinden veritabanındaki gerçek fiyatlarla hesaplanır.
 * Gerçek indirim yine de create_order içinde tekrar doğrulanır — bu uç yalnızca
 * kullanıcıya "kod geçerli mi, ne kadar düşer" bilgisini gösterir.
 */
export async function POST(request: Request) {
  const csrf = checkTrustedOrigin(request);
  if (csrf) return csrf;

  const { success } = await safeRateLimit(generalApiRateLimit, getClientIp(request.headers));
  if (!success) return NextResponse.json({ valid: false, message: 'Çok fazla deneme. Biraz sonra tekrar deneyin.' }, { status: 429 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ valid: false, message: 'Geçersiz istek.' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const service = createSupabaseServiceRoleClient();

  // Ara toplam + ağırlık DB'den (aktif ürünler) — kargo ağırlığa göre (migration 0043).
  const quote = await quoteCart(parsed.data.items);
  if (!quote) {
    return NextResponse.json({ valid: false, message: 'Kod kontrol edilemedi.' }, { status: 500 });
  }
  const subtotal = quote.subtotalCents;

  if (subtotal <= 0) {
    return NextResponse.json({ valid: false, message: 'Sepet boş görünüyor.' });
  }

  const { data, error } = await service
    .rpc('preview_coupon', {
      p_code: parsed.data.code,
      p_subtotal_cents: subtotal,
      p_user_id: user?.id ?? null,
      p_email: null,
      p_weight_grams: quote.weightGrams
    })
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, message: 'Kod kontrol edilemedi.' }, { status: 500 });
  }

  const r = data as {
    valid: boolean;
    message: string;
    discount_cents: number;
    free_shipping: boolean;
    shipping_cents: number;
    final_total_cents: number;
  };

  return NextResponse.json({
    valid: r.valid,
    message: r.message,
    code: parsed.data.code.trim().toUpperCase(),
    discountCents: r.discount_cents,
    freeShipping: r.free_shipping,
    shippingCents: r.shipping_cents,
    subtotalCents: subtotal,
    finalTotalCents: r.final_total_cents
  });
}
