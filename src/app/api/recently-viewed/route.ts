import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProductsBySlugs } from '@/lib/data/products';
import { generalApiRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const slugSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/**
 * "Son Gezdikleriniz" şeridi. Salt-okunur, herkese açık.
 * `?slugs=a,b,c` — istemcinin localStorage'da tuttuğu ürün slug'ları.
 */
export async function GET(request: Request) {
  const { success } = await safeRateLimit(generalApiRateLimit, getClientIp(request.headers));
  if (!success) return NextResponse.json({ items: [] }, { status: 429 });

  const raw = new URL(request.url).searchParams.get('slugs') ?? '';
  const slugs = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => slugSchema.safeParse(s).success)
    .slice(0, 12);

  const items = await getProductsBySlugs(slugs);
  return NextResponse.json({ items });
}
