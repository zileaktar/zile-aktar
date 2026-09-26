import { describe, expect, it } from 'vitest';
import { buildSalesReport, periodOf, type ReportOrder } from '@/lib/reports';

function order(partial: Partial<ReportOrder>): ReportOrder {
  return {
    order_number: 'ZA-1',
    status: 'paid',
    payment_provider: 'vakifbank',
    total_cents: 10000,
    shipping_cents: 0,
    discount_cents: 0,
    deal_discount_cents: 0,
    created_at: '2026-09-26T10:00:00Z',
    ...partial
  };
}

describe('periodOf', () => {
  it('günü Türkiye saatine göre belirler (UTC gece yarısı kayması yok)', () => {
    // 25 Eylül 22:30 UTC = 26 Eylül 01:30 TR
    expect(periodOf('2026-09-25T22:30:00Z', 'daily')).toEqual({ key: '2026-09-26', label: '26.09.2026 Cumartesi' });
  });

  it('haftayı pazartesiden başlatır', () => {
    // 27 Eylül 2026 Pazar → hafta 21–27 Eylül
    expect(periodOf('2026-09-27T12:00:00Z', 'weekly')).toEqual({
      key: '2026-09-21',
      label: '21.09.2026 – 27.09.2026'
    });
    // Pazartesi 28 Eylül → yeni hafta
    expect(periodOf('2026-09-28T12:00:00Z', 'weekly').key).toBe('2026-09-28');
  });

  it('ay ve yıl etiketleri Türkçe', () => {
    expect(periodOf('2026-12-31T21:30:00Z', 'monthly')).toEqual({ key: '2027-01', label: 'Ocak 2027' });
    expect(periodOf('2026-12-31T21:30:00Z', 'yearly').key).toBe('2027');
  });
});

describe('buildSalesReport', () => {
  it('ciroya yalnız ödemesi alınmış siparişleri sayar, kart/havale ayırır', () => {
    const { periods, overall } = buildSalesReport(
      [
        order({ status: 'paid', payment_provider: 'vakifbank', total_cents: 10000 }),
        order({ status: 'delivered', payment_provider: 'havale', total_cents: 5000, shipping_cents: 3990 }),
        order({ status: 'shipped', payment_provider: 'iyzico', total_cents: 2000 }),
        order({ status: 'refunded', total_cents: 7000 }),
        order({ status: 'failed', total_cents: 9999 }),
        order({ status: 'pending', total_cents: 9999 }),
        order({ status: 'cancelled', total_cents: 9999 })
      ],
      'monthly'
    );
    expect(periods).toHaveLength(1);
    expect(overall.orderCount).toBe(7);
    expect(overall.paidCount).toBe(3);
    expect(overall.revenueCents).toBe(17000);
    expect(overall.cardCents).toBe(12000);
    expect(overall.havaleCents).toBe(5000);
    expect(overall.shippingCents).toBe(3990);
    expect(overall.refundedCount).toBe(1);
    expect(overall.refundedCents).toBe(7000);
    expect(overall.failedCount + overall.pendingCount + overall.cancelledCount).toBe(3);
  });

  it('dönemleri ve siparişleri en yeniden eskiye sıralar', () => {
    const { periods } = buildSalesReport(
      [
        order({ order_number: 'A', created_at: '2026-08-10T10:00:00Z' }),
        order({ order_number: 'B', created_at: '2026-09-01T10:00:00Z' }),
        order({ order_number: 'C', created_at: '2026-09-20T10:00:00Z' })
      ],
      'monthly'
    );
    expect(periods.map((p) => p.label)).toEqual(['Eylül 2026', 'Ağustos 2026']);
    expect(periods[0]?.orders.map((o) => o.order_number)).toEqual(['C', 'B']);
  });
});
