import type { OrderStatus } from '@/lib/supabase/types';

/*
 * Satış raporu hesaplamaları (saf fonksiyonlar — birim testli, bkz.
 * tests/unit/reports.test.ts). Dönemler HER ZAMAN Türkiye takvimine göre
 * belirlenir: gece 00:30'da (TR) verilen sipariş, UTC'de önceki güne düşse
 * bile raporda doğru güne yazılır. Haftalar Pazartesi başlar.
 */

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Rapor türleri. Her rapor yalnızca İÇİNDE BULUNULAN dönemi kapsar (bugün, bu
 * hafta, bu ay, bu yıl). `breakdown`: raporun içindeki dağılım tablosunun
 * birimi (ör. aylık raporda gün gün, yıllık raporda ay ay); günlük raporda yok.
 */
export const REPORT_PERIODS: ReadonlyArray<{
  value: ReportPeriod;
  label: string;
  buttonLabel: string;
  breakdown: ReportPeriod | null;
}> = [
  { value: 'daily', label: 'Günlük', buttonLabel: 'Bugün', breakdown: null },
  { value: 'weekly', label: 'Haftalık', buttonLabel: 'Bu Hafta', breakdown: 'daily' },
  { value: 'monthly', label: 'Aylık', buttonLabel: 'Bu Ay', breakdown: 'daily' },
  { value: 'yearly', label: 'Yıllık', buttonLabel: 'Bu Yıl', breakdown: 'monthly' }
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

export const MONTHS_TR = [
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

const istanbulOffset = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Istanbul', timeZoneName: 'longOffset' });

/** Verilen andaki Türkiye saat farkı (ms) — "GMT+03:00" → 3 saat. */
function istanbulOffsetMs(date: Date): number {
  const name = istanbulOffset.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? '';
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3])) * 60_000;
}

/** Türkiye takviminde y-m-d gününün 00:00'ı (UTC an olarak). Taşan ay/gün değerleri Date.UTC ile normalize olur. */
function istanbulMidnight(y: number, m: number, d: number): Date {
  const utcMidnight = Date.UTC(y, m - 1, d);
  return new Date(utcMidnight - istanbulOffsetMs(new Date(utcMidnight)));
}

/**
 * `anchor` anını içeren dönemin [başlangıç, bitiş) aralığı (Türkiye takvimi):
 * o gün, o hafta (Pazartesi–Pazar), o ay veya o yıl. `anchor` verilmezse
 * içinde bulunulan dönem (bugün / bu hafta / bu ay / bu yıl).
 */
export function currentPeriodRange(
  period: ReportPeriod,
  anchor: Date = new Date()
): { start: Date; end: Date; key: string; label: string } {
  const { y, m, d } = istanbulDate(anchor);
  const { key, label } = periodOf(anchor, period);
  switch (period) {
    case 'daily':
      return { start: istanbulMidnight(y, m, d), end: istanbulMidnight(y, m, d + 1), key, label };
    case 'weekly': {
      const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
      const monday = d - ((dow + 6) % 7);
      return { start: istanbulMidnight(y, m, monday), end: istanbulMidnight(y, m, monday + 7), key, label };
    }
    case 'monthly':
      return { start: istanbulMidnight(y, m, 1), end: istanbulMidnight(y, m + 1, 1), key, label };
    case 'yearly':
      return { start: istanbulMidnight(y, 1, 1), end: istanbulMidnight(y + 1, 1, 1), key, label };
  }
}

export interface DailyPoint {
  key: string; // "2026-09-26"
  shortLabel: string; // "26.09"
  label: string; // "26.09.2026 Cumartesi"
  revenueCents: number;
  paidCount: number;
}

/**
 * Panel ana sayfası grafiği: bugün dahil son `days` gün (Türkiye takvimi), HER gün
 * için bir nokta — siparişsiz günler 0 ile (boşluklar grafikten kaybolmasın).
 * `orders` aralık başından beri (bkz. lastDaysStart) gelen siparişlerdir.
 */
export function buildDailySeries(orders: ReportOrder[], days: number, now: Date = new Date()): DailyPoint[] {
  const byKey = new Map(buildSalesReport(orders, 'daily').periods.map((p) => [p.key, p]));
  const { y, m, d } = istanbulDate(now);
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const noon = new Date(istanbulMidnight(y, m, d - i).getTime() + 12 * 3_600_000);
    const { key, label } = periodOf(noon, 'daily');
    const p = byKey.get(key);
    points.push({
      key,
      shortLabel: label.slice(0, 5),
      label,
      revenueCents: p?.revenueCents ?? 0,
      paidCount: p?.paidCount ?? 0
    });
  }
  return points;
}

/** buildDailySeries için sorgu başlangıcı: (days-1) gün önceki Türkiye gece yarısı. */
export function lastDaysStart(days: number, now: Date = new Date()): Date {
  const { y, m, d } = istanbulDate(now);
  return istanbulMidnight(y, m, d - (days - 1));
}

/** Yönetim panelindeki tarih seçimi (URL parametreleri, doğrulanmış). */
export interface ReportDateSelection {
  /** "YYYY-MM-DD" — günlük ve haftalık rapor için. */
  date?: string | undefined;
  month?: number | undefined;
  year?: number | undefined;
}

/**
 * Seçilen tarihi dönem içinden bir "çapa" anına çevirir (Türkiye takvimi, gün
 * ortası — saat farkı kaymalarından etkilenmez). Seçim yoksa `null` (= içinde
 * bulunulan dönem); seçim eksik/geçersizse `'invalid'`.
 */
export function reportAnchor(period: ReportPeriod, sel: ReportDateSelection): Date | null | 'invalid' {
  const noon = (y: number, m: number, d: number) => new Date(istanbulMidnight(y, m, d).getTime() + 12 * 3_600_000);
  if (period === 'daily' || period === 'weekly') {
    if (!sel.date) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sel.date);
    if (!match) return 'invalid';
    const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
    // 31 Şubat gibi takvimde olmayan günleri reddet.
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return 'invalid';
    return noon(y, m, d);
  }
  if (period === 'monthly') {
    if (sel.year === undefined && sel.month === undefined) return null;
    if (sel.year === undefined || sel.month === undefined) return 'invalid';
    return noon(sel.year, sel.month, 15);
  }
  if (sel.year === undefined) return null;
  return noon(sel.year, 7, 1);
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
