import type { OrderStatus } from '@/lib/supabase/types';

/*
 * Satış raporu hesaplamaları (saf fonksiyonlar — birim testli, bkz.
 * tests/unit/reports.test.ts). Dönemler HER ZAMAN Türkiye takvimine göre
 * belirlenir: gece 00:30'da (TR) verilen sipariş, UTC'de önceki güne düşse
 * bile raporda doğru güne yazılır. Haftalar Pazartesi başlar.
 */

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const REPORT_PERIODS: ReadonlyArray<{ value: ReportPeriod; label: string }> = [
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'yearly', label: 'Yıllık' }
];

export interface ReportOrder {
  order_number: string;
  status: OrderStatus;
  payment_provider: string;
  total_cents: number;
  shipping_cents: number;
  discount_cents: number;
  deal_discount_cents: number;
  created_at: string;
}

/** Ciroya sayılan durumlar: ödemesi alınmış siparişler. */
export const REVENUE_STATUSES: ReadonlyArray<OrderStatus> = ['paid', 'shipped', 'delivered'];

export function isRevenueStatus(status: OrderStatus): boolean {
  return REVENUE_STATUSES.includes(status);
}

export function isCardProvider(provider: string): boolean {
  // Eski (iyzico) kart siparişleri de "kart" sayılır.
  return provider === 'vakifbank' || provider === 'iyzico';
}

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık'
];
const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const istanbulYmd = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

/** Türkiye takvimindeki gün: { y, m (1-12), d }. */
function istanbulDate(value: string | Date) {
  const [y = 1970, m = 1, d = 1] = istanbulYmd.format(new Date(value)).split('-').map(Number);
  return { y, m, d };
}

const pad = (n: number) => String(n).padStart(2, '0');
const dmy = (y: number, m: number, d: number) => `${pad(d)}.${pad(m)}.${y}`;

/**
 * Siparişin ait olduğu dönem: sıralanabilir bir anahtar + okunaklı etiket.
 *  - Günlük: "2026-09-26" / "26.09.2026 Cumartesi"
 *  - Haftalık: pazartesi tarihi / "21.09.2026 – 27.09.2026"
 *  - Aylık: "2026-09" / "Eylül 2026"
 *  - Yıllık: "2026" / "2026"
 */
export function periodOf(value: string | Date, period: ReportPeriod): { key: string; label: string } {
  const { y, m, d } = istanbulDate(value);
  // Takvim günü üzerinde hesap yapmak için UTC öğlen kullanılır (yaz saati vb. kaymalardan bağımsız).
  const day = new Date(Date.UTC(y, m - 1, d, 12));
  switch (period) {
    case 'daily':
      return { key: `${y}-${pad(m)}-${pad(d)}`, label: `${dmy(y, m, d)} ${DAYS_TR[day.getUTCDay()] ?? ''}` };
    case 'weekly': {
      const mondayOffset = (day.getUTCDay() + 6) % 7;
      const monday = new Date(day.getTime() - mondayOffset * 86_400_000);
      const sunday = new Date(monday.getTime() + 6 * 86_400_000);
      const f = (x: Date) => dmy(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
      return {
        key: `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`,
        label: `${f(monday)} – ${f(sunday)}`
      };
    }
    case 'monthly':
      return { key: `${y}-${pad(m)}`, label: `${MONTHS_TR[m - 1] ?? ''} ${y}` };
    case 'yearly':
      return { key: String(y), label: String(y) };
  }
}

export interface PeriodSummary {
  key: string;
  label: string;
  /** Dönemdeki tüm sipariş kayıtları (beklemede/başarısız dahil). */
  orderCount: number;
  /** Ödemesi alınmış (ödendi/kargoda/teslim) sipariş sayısı. */
  paidCount: number;
  cardCents: number;
  havaleCents: number;
  /** Ciro = kart + havale (yalnız ödemesi alınmış siparişler, kargo dahil). */
  revenueCents: number;
  shippingCents: number;
  discountCents: number;
  refundedCount: number;
  refundedCents: number;
  cancelledCount: number;
  failedCount: number;
  pendingCount: number;
  orders: ReportOrder[];
}

function emptySummary(key: string, label: string): PeriodSummary {
  return {
    key,
    label,
    orderCount: 0,
    paidCount: 0,
    cardCents: 0,
    havaleCents: 0,
    revenueCents: 0,
    shippingCents: 0,
    discountCents: 0,
    refundedCount: 0,
    refundedCents: 0,
    cancelledCount: 0,
    failedCount: 0,
    pendingCount: 0,
    orders: []
  };
}

function addOrder(s: PeriodSummary, o: ReportOrder) {
  s.orderCount++;
  s.orders.push(o);
  if (isRevenueStatus(o.status)) {
    s.paidCount++;
    s.revenueCents += o.total_cents;
    s.shippingCents += o.shipping_cents;
    s.discountCents += o.discount_cents + o.deal_discount_cents;
    if (isCardProvider(o.payment_provider)) s.cardCents += o.total_cents;
    else s.havaleCents += o.total_cents;
  } else if (o.status === 'refunded') {
    s.refundedCount++;
    s.refundedCents += o.total_cents;
  } else if (o.status === 'cancelled') {
    s.cancelledCount++;
  } else if (o.status === 'failed') {
    s.failedCount++;
  } else if (o.status === 'pending') {
    s.pendingCount++;
  }
}

/**
 * Siparişleri döneme göre gruplar; en yeni dönem en üstte, her dönemin
 * siparişleri de en yeniden eskiye sıralı. İkinci değer tüm zamanların toplamıdır.
 */
export function buildSalesReport(
  orders: ReportOrder[],
  period: ReportPeriod
): { periods: PeriodSummary[]; overall: PeriodSummary } {
  const overall = emptySummary('all', 'Tüm zamanlar');
  const byKey = new Map<string, PeriodSummary>();
  const sorted = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const o of sorted) {
    const { key, label } = periodOf(o.created_at, period);
    let s = byKey.get(key);
    if (!s) {
      s = emptySummary(key, label);
      byKey.set(key, s);
    }
    addOrder(s, o);
    addOrder(overall, o);
  }
  const periods = [...byKey.values()].sort((a, b) => b.key.localeCompare(a.key));
  return { periods, overall };
}
