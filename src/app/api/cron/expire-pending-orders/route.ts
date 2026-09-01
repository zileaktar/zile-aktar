import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { env } from '@/lib/env.mjs';

export const runtime = 'nodejs';

/** Sabit zamanlı karşılaştırma — CRON_SECRET'i basit `!==` ile karşılaştırmak
 * (uzunluk farkı önce döndüğü için) teorik bir zamanlama saldırısına açık bırakır. */
function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Vercel Cron ile günde bir kez tetiklenir (bkz. vercel.json).
 * 24 saatten uzun süredir "pending" kalan siparişler (kullanıcı 3DS'i hiç
 * tamamlamadan sayfadan ayrılmış olabilir) başarısız işaretlenir ve
 * mark_order_failed RPC'si rezerve edilen stoğu otomatik iade eder —
 * aksi halde satılmayan ürünler sonsuza kadar "stokta yok" görünür kalırdı.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  if (!timingSafeEqualString(authHeader, `Bearer ${env.CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Yalnızca KART (iyzico) siparişleri otomatik iptal edilir: müşteri 3DS'i
  // tamamlamadan ayrılmış olabilir. Havale/EFT siparişleri operasyon ekibi
  // tarafından elle yönetilir (dekont beklenir) — otomatik iptal edilmez.
  const { data: staleOrders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'pending')
    .eq('payment_provider', 'iyzico')
    .lt('created_at', cutoff);

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Sorgu başarısız.' }, { status: 500 });
  }

  for (const order of staleOrders ?? []) {
    await supabase.rpc('mark_order_failed', { p_order_id: order.id });
  }

  return NextResponse.json({ expiredCount: staleOrders?.length ?? 0 });
}
