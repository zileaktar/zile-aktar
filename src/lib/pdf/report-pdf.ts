import 'server-only';
import { PdfBuilder, COLORS, type TableRow } from '@/lib/pdf/builder';
import { formatDateTimeTR, formatPriceFromCents } from '@/lib/format';
import { orderStatusLabel, paymentMethodLabel } from '@/lib/order-status';
import { LEGAL } from '@/lib/legal';
import { buildSalesReport, REPORT_PERIODS, type ReportOrder, type ReportPeriod } from '@/lib/reports';

/**
 * Satış raporu PDF'i (Ayarlar → Raporlar). Şimdiye kadarki TÜM siparişleri
 * seçilen döneme (gün/hafta/ay/yıl) göre özetler, ardından her siparişi dönem
 * başlıkları altında listeler. Müşteri kişisel verisi (ad, adres, telefon,
 * e-posta) BİLİNÇLİ OLARAK yer almaz — rapor muhasebeciyle paylaşılabilir.
 */
export async function renderSalesReportPdf(orders: ReportOrder[], period: ReportPeriod): Promise<Uint8Array> {
  const periodLabel = REPORT_PERIODS.find((p) => p.value === period)?.label ?? period;
  const { periods, overall } = buildSalesReport(orders, period);
  const pdf = await PdfBuilder.create(`${periodLabel} Satış Raporu`, `${LEGAL.markaAdi} · ${periodLabel} Satış Raporu`);

  pdf.text(LEGAL.markaAdi, { size: 18, bold: true, color: COLORS.primary });
  pdf.text(`${periodLabel.toLocaleUpperCase('tr-TR')} SATIŞ RAPORU`, { size: 14, bold: true, color: COLORS.primary });
  const oldest = overall.orders.at(-1);
  const newest = overall.orders[0];
  pdf.text(
    oldest && newest
      ? `Kapsam: ${formatDateTimeTR(oldest.created_at)} – ${formatDateTimeTR(newest.created_at)} (şimdiye kadarki tüm siparişler)`
      : 'Henüz sipariş kaydı yok.',
    { size: 9, color: COLORS.muted }
  );
  pdf.divider();

  // --- Genel özet
  pdf.heading('Genel Özet (Tüm Zamanlar)');
  pdf.keyValues(
    [
      ['Toplam sipariş kaydı', String(overall.orderCount)],
      ['Ödemesi alınan sipariş', String(overall.paidCount)],
      ['Toplam ciro', formatPriceFromCents(overall.revenueCents)],
      ['  Kartla ödenen', formatPriceFromCents(overall.cardCents)],
      ['  Havale / EFT', formatPriceFromCents(overall.havaleCents)],
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
  pdf.text(
    'Ciro; durumu "Ödendi", "Kargoya Verildi" veya "Teslim Edildi" olan siparişlerin genel toplamıdır (kargo dahil). ' +
      'İade edilen, iptal edilen, başarısız ve bekleyen siparişler ciroya dahil edilmez.',
    { size: 8, color: COLORS.muted }
  );

  // --- Dönem özetleri
  pdf.heading(`${periodLabel} Özet`);
  pdf.table(
    [
      { header: 'Dönem', width: 0.27 },
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

  // --- Tüm siparişler, dönem başlıkları altında
  pdf.heading('Sipariş Listesi');
  const rows: TableRow[] = [];
  for (const p of periods) {
    rows.push({ section: `${p.label} — ${p.paidCount} ödenen sipariş · Ciro ${formatPriceFromCents(p.revenueCents)}` });
    for (const o of p.orders) {
      rows.push({
        cells: [
          formatDateTimeTR(o.created_at),
          o.order_number,
          orderStatusLabel(o.status).label,
          paymentMethodLabel(o.payment_provider),
          formatPriceFromCents(o.total_cents)
        ]
      });
    }
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
