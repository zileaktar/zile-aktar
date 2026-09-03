import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCartSuggestions } from '@/lib/data/products';
import { generalApiRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const uuid = z.string().uuid();

/**
 * Sepet çekmecesi "kasa altı" öneri şeridi. Salt-okunur, herkese açık.
 * `?exclude=<uuid,uuid,...>` — sepetteki ürünler önerilmesin.
 */
export async function GET(request: Request) {
  const { success } = await safeRateLimit(generalApiRateLimit, getClientIp(request.headers));
  if (!success) return NextResponse.json({ items: [] }, { status: 429 });

  const raw = new URL(request.url).searchParams.get('exclude') ?? '';
  const exclude = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => uuid.safeParse(s).success)
    .slice(0, 50);

  const items = await getCartSuggestions(exclude, 6);
  return NextResponse.json({ items });
}
