import * as Sentry from '@sentry/nextjs';
import { authorizePdfRequest, textResponse } from '@/lib/pdf/route-auth';
import { loadVariantSnapshots } from '@/lib/bulk-variants-server';
import { variantsToCsv } from '@/lib/bulk-variants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Ürünler → Toplu Güncelleme → "Güncel listeyi indir": tüm varyantların
 * fiyat/stok listesi, Excel'de doğrudan açılan CSV (`;` + UTF-8 BOM).
 * Yalnız admin + iki adımlı doğrulama (yetki kontrolü PDF uçlarıyla ortak).
 */
export async function GET() {
  try {
    const auth = await authorizePdfRequest('admin');
    if ('response' in auth) return auth.response;

    const csv = '﻿' + variantsToCsv(await loadVariantSnapshots(auth.supabase));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="urun-fiyat-stok-${today}.csv"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (err) {
    Sentry.captureException(err);
    return textResponse('Liste oluşturulamadı. Lütfen tekrar deneyin.', 500);
  }
}
