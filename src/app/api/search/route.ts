import { NextResponse } from 'next/server';
import { quickSearchProducts } from '@/lib/data/products';
import { generalApiRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Arama çubuğu anlık öneri (typeahead) ucu. Salt-okunur, herkese açık; yan
 * etkisi yok (CSRF kontrolü gerekmez). Yine de IP bazlı hız sınırı uygulanır.
 */
export async function GET(request: Request) {
  const { success } = await safeRateLimit(generalApiRateLimit, getClientIp(request.headers));
  if (!success) return NextResponse.json({ items: [] }, { status: 429 });

  const q = new URL(request.url).searchParams.get('q') ?? '';
  const items = await quickSearchProducts(q);
  return NextResponse.json({ items });
}
