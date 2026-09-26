import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { authorizePdfRequest, textResponse } from '@/lib/pdf/route-auth';
import { renderSalesReportPdf } from '@/lib/pdf/report-pdf';
import { pdfResponse } from '@/lib/pdf/builder';
import { currentPeriodRange, reportAnchor, type ReportOrder } from '@/lib/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Çok sayıda siparişte PDF üretimi birkaç saniye sürebilir.
export const maxDuration = 60;

// Boş form alanları ("") "seçilmedi" sayılır.
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

const querySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  date: optional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  month: optional(z.coerce.number().int().min(1).max(12)),
  year: optional(z.coerce.number().int().min(2000).max(2100))
});

const PAGE_SIZE = 1000;
// Güvenlik sınırı: sonsuz döngü / aşırı bellek kullanımına karşı.
const MAX_ORDERS = 50_000;

/**
 * Ayarlar → Satış Raporları (yalnız admin). Tarih seçilmezse içinde bulunulan
 * dönem (bugün / bu hafta / bu ay / bu yıl); seçilirse o gün, o günün haftası,
 * o ay veya o yıl raporlanır.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = querySchema.safeParse({
    period: params.get('period'),
    date: params.get('date'),
    month: params.get('month'),
    year: params.get('year')
  });
  if (!query.success) return textResponse('Geçersiz rapor seçimi.', 400);
  const { period } = query.data;
  const anchor = reportAnchor(period, query.data);
  if (anchor === 'invalid') return textResponse('Geçersiz tarih seçimi.', 400);

  try {
    const auth = await authorizePdfRequest('admin');
    if ('response' in auth) return auth.response;
    const { supabase } = auth;

    // Seçilen (ya da içinde bulunulan) dönem — Türkiye takvimine göre.
    const range = currentPeriodRange(period, anchor ?? undefined);

    // PostgREST tek sorguda en fazla 1000 satır döndürür → sayfa sayfa oku.
    const orders: ReportOrder[] = [];
    for (let from = 0; from < MAX_ORDERS; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('orders')
        .select(
          'order_number, status, payment_provider, total_cents, shipping_cents, discount_cents, deal_discount_cents, created_at'
        )
        .gte('created_at', range.start.toISOString())
        .lt('created_at', range.end.toISOString())
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      orders.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    }

    const bytes = await renderSalesReportPdf(orders, period, range.label);
    return pdfResponse(bytes, `satis-raporu-${period}-${range.key}.pdf`);
  } catch (err) {
    Sentry.captureException(err);
    return textResponse('Rapor oluşturulamadı. Lütfen tekrar deneyin.', 500);
  }
}
