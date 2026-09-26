import 'server-only';
import { PdfBuilder, COLORS } from '@/lib/pdf/builder';
import { formatDateTimeTR, formatPriceFromCents } from '@/lib/format';
import { orderStatusLabel, paymentMethodLabel } from '@/lib/order-status';
import { LEGAL } from '@/lib/legal';
import type { Database } from '@/lib/supabase/types';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type Address = OrderRow['shipping_address'];

export type OrderPdfData = Pick<
  OrderRow,
  | 'order_number'
  | 'status'
  | 'user_id'
  | 'subtotal_cents'
  | 'shipping_cents'
  | 'deal_discount_cents'
  | 'discount_cents'
  | 'coupon_code'
  | 'total_cents'
  | 'shipping_address'
  | 'billing_address'
  | 'contact_email'
  | 'contact_phone'
  | 'payment_provider'
  | 'payment_ref'
  | 'shipping_carrier'
  | 'tracking_number'
  | 'shipped_at'
  | 'delivered_at'
  | 'created_at'
  | 'updated_at'
> & {
  order_items: Array<{
    product_name_snapshot: string;
    variant_label_snapshot: string;
    unit_price_cents: number;
    quantity: number;
  }>;
  return_request: {
    status: string;
    reason: string;
    detail: string;
    admin_note: string;
    created_at: string;
  } | null;
};

const RETURN_STATUS_LABEL: Record<string, string> = {
  pending: 'İnceleniyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  completed: 'Tamamlandı'
};

function addressPairs(a: Address): Array<[string, string]> {
  return [
    ['Ad Soyad', a.full_name],
    ['Telefon', a.phone],
    ['İl / İlçe', `${a.city} / ${a.district}`],
    ['Adres', a.address_line]
  ];
}

/** Bir siparişin TÜM ayrıntılarını içeren PDF (yönetim paneli → sipariş detayı → "PDF İndir"). */
export async function renderOrderPdf(order: OrderPdfData): Promise<Uint8Array> {
  const pdf = await PdfBuilder.create(`Sipariş ${order.order_number}`, `${LEGAL.markaAdi} · Sipariş ${order.order_number}`);

  // --- Başlık + satıcı bilgisi
  pdf.text(LEGAL.markaAdi, { size: 18, bold: true, color: COLORS.primary });
  pdf.text(`${LEGAL.unvan} · ${LEGAL.isletmeTuru}`, { size: 8.5, color: COLORS.muted });
  pdf.text(LEGAL.adres, { size: 8.5, color: COLORS.muted });
  pdf.text(`Tel: ${LEGAL.telefon} · E-posta: ${LEGAL.eposta} · ${LEGAL.webAdresi}`, { size: 8.5, color: COLORS.muted });
  pdf.text(`${LEGAL.vergiDairesi} · VKN: ${LEGAL.vergiNo} · MERSİS: ${LEGAL.mersisNo}`, {
    size: 8.5,
    color: COLORS.muted
  });
  pdf.divider();

  pdf.text('SİPARİŞ ÖZETİ', { size: 14, bold: true, color: COLORS.primary, lineGap: 4 });

  // --- Sipariş bilgileri
  pdf.heading('Sipariş Bilgileri');
  pdf.keyValues([
    ['Sipariş No', order.order_number],
    ['Sipariş Tarihi', formatDateTimeTR(order.created_at)],
    ['Son Güncelleme', formatDateTimeTR(order.updated_at)],
    ['Durum', orderStatusLabel(order.status).label],
    ['Müşteri Türü', order.user_id ? 'Üye' : 'Misafir (üye olmadan)'],
    ['Ödeme Yöntemi', paymentMethodLabel(order.payment_provider)],
    ['Banka / Ödeme Referansı', order.payment_ref ?? '—']
  ]);

  // --- İletişim + adresler
  pdf.heading('Müşteri İletişim Bilgileri');
  pdf.keyValues([
    ['E-posta', order.contact_email],
    ['Telefon', order.contact_phone]
  ]);

  pdf.heading('Teslimat Adresi');
  pdf.keyValues(addressPairs(order.shipping_address));

  pdf.heading('Fatura Adresi');
  if (order.billing_address) {
    pdf.keyValues(addressPairs(order.billing_address));
  } else {
    pdf.text('Teslimat adresi ile aynı.', { size: 9.5, color: COLORS.muted });
  }

  // --- Ürünler
  pdf.heading('Ürünler');
  pdf.table(
    [
      { header: '#', width: 0.05 },
      { header: 'Ürün', width: 0.39 },
      { header: 'Seçenek', width: 0.18 },
      { header: 'Adet', width: 0.08, align: 'right' },
      { header: 'Birim Fiyat', width: 0.15, align: 'right' },
      { header: 'Tutar', width: 0.15, align: 'right' }
    ],
    order.order_items.map((item, i) => ({
      cells: [
        String(i + 1),
        item.product_name_snapshot,
        item.variant_label_snapshot,
        String(item.quantity),
        formatPriceFromCents(item.unit_price_cents),
        formatPriceFromCents(item.unit_price_cents * item.quantity)
      ]
    }))
  );

  const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
  const totals: Parameters<PdfBuilder['totals']>[0] = [
    { label: `Ara Toplam (${itemCount} adet)`, value: formatPriceFromCents(order.subtotal_cents) }
  ];
  if (order.deal_discount_cents > 0) {
    totals.push({ label: 'Kampanya İndirimi', value: `-${formatPriceFromCents(order.deal_discount_cents)}` });
  }
  if (order.discount_cents > 0) {
    totals.push({
      label: `Kupon İndirimi${order.coupon_code ? ` (${order.coupon_code})` : ''}`,
      value: `-${formatPriceFromCents(order.discount_cents)}`,
      color: COLORS.red
    });
  }
  totals.push({
    label: 'Kargo',
    value: order.shipping_cents === 0 ? 'Ücretsiz' : formatPriceFromCents(order.shipping_cents)
  });
  totals.push({ label: 'GENEL TOPLAM', value: formatPriceFromCents(order.total_cents), bold: true });
  pdf.totals(totals);

  // --- Kargo
  pdf.heading('Kargo Bilgisi');
  pdf.keyValues([
    ['Kargo Firması', order.shipping_carrier ?? '—'],
    ['Takip Numarası', order.tracking_number ?? '—'],
    ['Kargoya Verilme', order.shipped_at ? formatDateTimeTR(order.shipped_at) : '—'],
    ['Teslim Edilme', order.delivered_at ? formatDateTimeTR(order.delivered_at) : '—']
  ]);

  // --- İade / iptal talebi
  if (order.return_request) {
    const r = order.return_request;
    pdf.heading('İade / İptal Talebi');
    pdf.keyValues([
      ['Talep Tarihi', formatDateTimeTR(r.created_at)],
      ['Durum', RETURN_STATUS_LABEL[r.status] ?? r.status],
      ['Sebep', r.reason],
      ['Açıklama', r.detail || '—'],
      ['Mağaza Notu', r.admin_note || '—']
    ]);
  }

  pdf.space(14);
  pdf.divider();
  pdf.text(
    'Bu belge sipariş bilgilerini gösterir; fatura yerine geçmez. Belge müşteri kişisel verileri içerir — ' +
      'yalnızca sipariş işlemleri için kullanın ve üçüncü kişilerle paylaşmayın (KVKK).',
    { size: 8, color: COLORS.muted }
  );

  return pdf.finish();
}
