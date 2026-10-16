import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generalApiRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { checkTrustedOrigin } from '@/lib/csrf';
import { quoteCart } from '@/lib/shipping-server';
import { getShippingConfig } from '@/lib/data/shipping';

export const runtime = 'nodejs';

const bodySchema = z.object({
  items: z
    .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) }))
    .min(1)
    .max(50)
});

/**
 * Ödeme sayfası için kargo ücreti ÖNİZLEMESİ (ağırlığa göre, migration 0043).
 * Gerçek ücret sipariş anında create_order içinde yeniden hesaplanır.
 */
export async function POST(request: Request) {
  const csrf = checkTrustedOrigin(request);
  if (csrf) return csrf;

  const { success } = await safeRateLimit(generalApiRateLimit, getClientIp(request.headers));
  if (!success) return NextResponse.json({ error: 'Çok fazla istek. Biraz sonra tekrar deneyin.' }, { status: 429 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

  const [quote, config] = await Promise.all([quoteCart(parsed.data.items), getShippingConfig()]);
  if (!quote) return NextResponse.json({ error: 'Kargo ücreti hesaplanamadı.' }, { status: 500 });

  return NextResponse.json({
    subtotalCents: quote.subtotalCents,
    weightGrams: quote.weightGrams,
    shippingCents: quote.shippingCents,
    freeThresholdCents: config.freeThresholdCents
  });
}
