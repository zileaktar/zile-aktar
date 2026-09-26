import 'server-only';
import { PdfBuilder, COLORS, type TableRow } from '@/lib/pdf/builder';
import { formatDateTimeTR, formatPriceFromCents } from '@/lib/format';
import { orderStatusLabel, paymentMethodLabel } from '@/lib/order-status';
import { LEGAL } from '@/lib/legal';
import { buildSalesReport, REPORT_PERIODS, type ReportOrder, type ReportPeriod } from '@/lib/reports';

const BREAKDOWN_TITLE: Record<ReportPeriod, string> = {
  daily: 'Gün Gün Dağılım',
  weekly: 'Hafta Hafta Dağılım',
  monthly: 'Ay Ay Dağılım',
  yearly: 'Yıl Yıl Dağılım'
};

function orderRow(o: ReportOrder): TableRow {
  return {
    cells: [
      formatDateTimeTR(o.created_at),
      o.order_number,
      orderStatusLabel(o.status).label,
      paymentMethodLabel(o.payment_provider),
      formatPriceFromCents(o.total_cents)
    ]
  };
}

/**
 * Satış raporu PDF'i (Ayarlar → Satış Raporları). YALNIZCA içinde bulunulan
 * dönemi (bugün / bu hafta / bu ay / bu yıl) kapsar: önce dönem özeti, sonra
 * (haftalık/aylık/yıllıkta) gün veya ay bazında dağılım, en sonda dönemin
 * sipariş listesi. Müşteri kişisel verisi (ad, adres, telefon, e-posta)
 * BİLİNÇLİ OLARAK yer almaz — rapor muhasebeciyle paylaşılabilir.
 *
 * `orders`: yalnızca dönem aralığındaki siparişler (route filtreler).
 */
export async function renderSalesReportPdf(
  orders: ReportOrder[],
  period: ReportPeriod,
  periodLabel: string
): Promise<Uint8Array> {
  const config = REPORT_PERIODS.find((p) => p.value === period);
  const typeLabel = config?.label ?? period;
  const breakdown = config?.breakdown ?? null;
  // Dağılım yoksa (günlük rapor) tüm siparişler tek grupta toplanır — yalnız "overall" kullanılır.
  const { periods, overall } = buildSalesReport(orders, breakdown ?? period);

  const pdf = await PdfBuilder.create(
    `${typeLabel} Satış Raporu — ${periodLabel}`,
    `${LEGAL.markaAdi} · ${typeLabel} Satış Raporu · ${periodLabel}`
  );

  pdf.text(LEGAL.markaAdi, { size: 18, bold: true, color: COLORS.primary });
  pdf.text(`${typeLabel.toLocaleUpperCase('tr-TR')} SATIŞ RAPORU`, { size: 14, bold: true, color: COLORS.primary });
  pdf.text(`Dönem: ${periodLabel}`, { size: 11, bold: true });
  pdf.text(`Rapor anındaki durum: ${formatDateTimeTR(new Date())}`, { size: 8.5, color: COLORS.muted });
  pdf.divider();

  // --- Dönem özeti
  pdf.heading('Özet');
  pdf.keyValues(
    [
      ['Toplam sipariş kaydı', String(overall.orderCount)],
      ['Ödemesi alınan sipariş', String(overall.paidCount)],
      ['Toplam ciro', formatPriceFromCents(overall.revenueCents)],
      ['Ciro — kartla ödenen', formatPriceFromCents(overall.cardCents)],
      ['Ciro — havale / EFT', formatPriceFromCents(overall.havaleCents)],
      ['Ciro içindeki kargo', formatPriceFromCents(overall.shippingCents)],
      ['Uygulanan indirimler', formatPriceFromCents(overall.discountCents)],
      [
        'Ortalama sepet',
        overall.paidCount > 0 ? formatPriceFromCents(Math.round(overall.revenueCents / overall.paidCount)) : '—'
      ],
      ['İade edilen', `${overall.refundedCount} sipariş · ${formatPriceFromCents(overall.refundedCents)}`],
      ['İptal edilen', `${overall.cancelledCount} sipariş`],
      ['Ödemesi başarısız', `${overall.failedCount} sipariş`],
      ['Ödeme bekleyen', `${overall.pendingCount} sipariş`]
    ],
    170
  );
  pdf.space(4);
  pdf.text(
    'Ciro; durumu "Ödendi", "Kargoya Verildi" veya "Teslim Edildi" olan siparişlerin genel toplamıdır (kargo dahil). ' +
      'İade edilen, iptal edilen, başarısız ve bekleyen siparişler ciroya dahil edilmez.',
    { size: 8, color: COLORS.muted }
  );

  if (overall.orderCount === 0) {
    pdf.space(10);
    pdf.text('Bu dönemde sipariş yok.', { size: 11, bold: true, color: COLORS.muted });
    return pdf.finish();
  }

  // --- Dağılım (haftalık/aylık: gün gün, yıllık: ay ay) — yalnız sipariş olan günler/aylar
  if (breakdown) {
    pdf.heading(BREAKDOWN_TITLE[breakdown]);
    pdf.table(
      [
        { header: breakdown === 'daily' ? 'Gün' : 'Ay', width: 0.27 },
        { header: 'Sipariş', width: 0.08, align: 'right' },
        { header: 'Ödenen', width: 0.08, align: 'right' },
        { header: 'Kart', width: 0.14, align: 'right' },
        { header: 'Havale', width: 0.14, align: 'right' },
        { header: 'İade', width: 0.13, align: 'right' },
        { header: 'Ciro', width: 0.16, align: 'right' }
      ],
      [
        ...periods.map<TableRow>((p) => ({
          cells: [
            p.label,
            String(p.orderCount),
            String(p.paidCount),
            formatPriceFromCents(p.cardCents),
            formatPriceFromCents(p.havaleCents),
            formatPriceFromCents(p.refundedCents),
            formatPriceFromCents(p.revenueCents)
          ]
        })),
        {
          bold: true,
          cells: [
            'TOPLAM',
            String(overall.orderCount),
            String(overall.paidCount),
            formatPriceFromCents(overall.cardCents),
            formatPriceFromCents(overall.havaleCents),
            formatPriceFromCents(overall.refundedCents),
            formatPriceFromCents(overall.revenueCents)
          ]
        }
      ]
    );
  }

  // --- Dönemin siparişleri (dağılım varsa gün/ay başlıkları altında)
  pdf.heading('Sipariş Listesi');
  const rows: TableRow[] = [];
  if (breakdown) {
    for (const p of periods) {
      rows.push({ section: `${p.label} — ${p.paidCount} ödenen sipariş · Ciro ${formatPriceFromCents(p.revenueCents)}` });
      rows.push(...p.orders.map(orderRow));
    }
  } else {
    rows.push(...overall.orders.map(orderRow));
  }
  pdf.table(
    [
      { header: 'Tarih', width: 0.19 },
      { header: 'Sipariş No', width: 0.24 },
      { header: 'Durum', width: 0.18 },
      { header: 'Ödeme', width: 0.21 },
      { header: 'Tutar', width: 0.18, align: 'right' }
    ],
    rows
  );

  return pdf.finish();
}
