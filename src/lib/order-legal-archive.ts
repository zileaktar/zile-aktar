import 'server-only';
import { createHash } from 'node:crypto';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import {
  buildOrderLegalDocuments,
  LEGAL_DOCS_VERSION,
  type LegalDocAddress,
  type LegalDocInput,
  type LegalDocType
} from '@/lib/legal-documents';

type DbAddress = { full_name: string; phone: string; city: string; district: string; address_line: string };

interface ArchiveOrderRow {
  order_number: string;
  created_at: string;
  contact_email: string;
  subtotal_cents: number;
  shipping_cents: number;
  deal_discount_cents: number;
  discount_cents: number;
  coupon_code: string | null;
  total_cents: number;
  payment_provider: string;
  shipping_address: DbAddress;
  billing_address: DbAddress | null;
  order_items: { product_name_snapshot: string; variant_label_snapshot: string; unit_price_cents: number; quantity: number }[];
}

function toAddress(a: DbAddress): LegalDocAddress {
  return { fullName: a.full_name, phone: a.phone, city: a.city, district: a.district, addressLine: a.address_line };
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Siparişin DB'deki GERÇEK verisinden (fiyatlar create_order'ın hesapladığı) belge girdisini kurar. */
export function orderRowToLegalInput(order: ArchiveOrderRow): LegalDocInput {
  return {
    orderNumber: order.order_number,
    orderDate: order.created_at,
    buyerEmail: order.contact_email,
    shippingAddress: toAddress(order.shipping_address),
    billingAddress: order.billing_address ? toAddress(order.billing_address) : null,
    items: order.order_items.map((i) => ({
      name: i.product_name_snapshot,
      variantLabel: i.variant_label_snapshot,
      quantity: i.quantity,
      unitPriceCents: i.unit_price_cents
    })),
    subtotalCents: order.subtotal_cents,
    dealDiscountCents: order.deal_discount_cents,
    couponDiscountCents: order.discount_cents,
    couponCode: order.coupon_code,
    shippingCents: order.shipping_cents,
    totalCents: order.total_cents,
    paymentMethod: order.payment_provider === 'havale' ? 'havale' : 'card'
  };
}

/**
 * Sipariş oluşturulduğu (müşteri ÖBF + MSS'yi onayladığı) anda iki belgeyi
 * üretip `order_legal_documents`'a yazar. Tablo değiştirilemez (migration 0044).
 * Başarısızsa HATA FIRLATIR — çağıran (checkout) siparişi iptal eder: sözleşmesi
 * arşivlenmemiş bir satış yapılmaz.
 */
export async function archiveOrderLegalDocuments(
  orderId: string,
  meta: { ip: string | null; userAgent: string | null }
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('orders')
    .select(
      'order_number, created_at, contact_email, subtotal_cents, shipping_cents, deal_discount_cents, discount_cents, coupon_code, total_cents, payment_provider, shipping_address, billing_address, order_items(product_name_snapshot, variant_label_snapshot, unit_price_cents, quantity)'
    )
    .eq('id', orderId)
    .single();
  if (error || !data) throw new Error(`Sözleşme arşivi: sipariş okunamadı (${error?.message ?? 'yok'})`);

  const docs = buildOrderLegalDocuments(orderRowToLegalInput(data as unknown as ArchiveOrderRow));
  const acceptedAt = new Date().toISOString();
  const rows = (Object.keys(docs) as LegalDocType[]).map((docType) => ({
    order_id: orderId,
    doc_type: docType,
    doc_version: LEGAL_DOCS_VERSION,
    content_html: docs[docType],
    content_sha256: sha256Hex(docs[docType]),
    accepted_at: acceptedAt,
    accepted_ip: meta.ip,
    accepted_user_agent: meta.userAgent ? meta.userAgent.slice(0, 400) : null
  }));

  const { error: insertError } = await supabase.from('order_legal_documents').insert(rows);
  if (insertError) throw new Error(`Sözleşme arşivi yazılamadı: ${insertError.message}`);
}
