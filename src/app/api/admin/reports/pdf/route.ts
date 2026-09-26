import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { authorizePdfRequest, textResponse } from '@/lib/pdf/route-auth';
import { renderSalesReportPdf } from '@/lib/pdf/report-pdf';
import { pdfResponse } from '@/lib/pdf/builder';
import { formatDateTR } from '@/lib/format';
import type { ReportOrder } from '@/lib/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Çok sayıda siparişte PDF üretimi birkaç saniye sürebilir.
export const maxDuration = 60;

const periodSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);
const PAGE_SIZE = 1000;
// Güvenlik sınırı: sonsuz döngü / aşırı bellek kullanımına karşı.
const MAX_ORDERS = 50_000;

/** Ayarlar → Raporlar: tüm siparişlerin günlük/haftalık/aylık/yıllık satış raporu (yalnız admin). */
export async function GET(request: Request) {
  const period = periodSchema.safeParse(new URL(request.url).searchParams.get('period'));
  if (!period.success) return textResponse('Geçersiz rapor türü.', 400);

  try {
    const auth = await authorizePdfRequest('admin');
    if ('response' in auth) return auth.response;
    const { supabase } = auth;

    // PostgREST tek sorguda en fazla 1000 satır döndürür → sayfa sayfa oku.
    const orders: ReportOrder[] = [];
    for (let from = 0; from < MAX_ORDERS; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('orders')
        .select(
          'order_number, status, payment_provider, total_cents, shipping_cents, discount_cents, deal_discount_cents, created_at'
        )
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      orders.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    }

    const bytes = await renderSalesReportPdf(orders, period.data);
    const today = formatDateTR(new Date()).replace(/\./g, '-');
    return pdfResponse(bytes, `satis-raporu-${period.data}-${today}.pdf`);
  } catch (err) {
    Sentry.captureException(err);
    return textResponse('Rapor oluşturulamadı. Lütfen tekrar deneyin.', 500);
  }
}
