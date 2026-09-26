import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { authorizePdfRequest, textResponse } from '@/lib/pdf/route-auth';
import { renderOrderPdf } from '@/lib/pdf/order-pdf';
import { pdfResponse } from '@/lib/pdf/builder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Yönetim paneli → sipariş detayı → "PDF İndir": siparişin tüm ayrıntılarını PDF olarak verir. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const parsedId = z.string().uuid().safeParse(params.id);
  if (!parsedId.success) return textResponse('Geçersiz sipariş.', 400);

  try {
    const auth = await authorizePdfRequest('moderator');
    if ('response' in auth) return auth.response;
    const { supabase } = auth;

    const { data: order, error } = await supabase
      .from('orders')
      .select(
        'order_number, status, user_id, subtotal_cents, shipping_cents, deal_discount_cents, discount_cents, coupon_code, total_cents, shipping_address, billing_address, contact_email, contact_phone, payment_provider, payment_ref, shipping_carrier, tracking_number, shipped_at, delivered_at, created_at, updated_at, order_items(product_name_snapshot, variant_label_snapshot, unit_price_cents, quantity)'
      )
      .eq('id', parsedId.data)
      .maybeSingle();
    if (error) throw error;
    if (!order) return textResponse('Sipariş bulunamadı.', 404);

    const { data: returnRequest } = await supabase
      .from('return_requests')
      .select('status, reason, detail, admin_note, created_at')
      .eq('order_id', parsedId.data)
      .maybeSingle();

    const bytes = await renderOrderPdf({
      ...order,
      order_items: order.order_items ?? [],
      return_request: returnRequest ?? null
    });
    return pdfResponse(bytes, `siparis-${order.order_number}.pdf`);
  } catch (err) {
    Sentry.captureException(err);
    return textResponse('PDF oluşturulamadı. Lütfen tekrar deneyin.', 500);
  }
}
