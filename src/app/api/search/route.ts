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

  // Uzunluk sınırı: arama kutusu için 64 karakter fazlasıyla yeterli; çok uzun
  // bir desen ilike sorgusunu gereksiz yere pahalılaştırır. Karakter temizliği
  // quickSearchProducts içinde yapılır.
  const q = (new URL(request.url).searchParams.get('q') ?? '').slice(0, 64);
  const items = await quickSearchProducts(q);
  return NextResponse.json({ items });
}
