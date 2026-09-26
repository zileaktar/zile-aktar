import { MONTHS_TR, REPORT_PERIODS } from '@/lib/reports';

// Yıl listesinin başlangıcı (mağazanın satışa başladığı yıldan önce rapor anlamsız).
const FIRST_REPORT_YEAR = 2025;

const REPORT_URL = '/api/admin/reports/pdf';

const fieldClass = 'text-sm border border-primary/15 rounded-lg px-3 py-2 bg-cream w-full';
const buttonClass =
  'w-full sm:w-auto shrink-0 text-sm font-semibold text-white bg-primary rounded-lg px-4 py-2 hover:bg-primary/90';

/** Türkiye takvimine göre bugün: "YYYY-MM-DD" + yıl + ay. */
function todayInIstanbul() {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  const [year = FIRST_REPORT_YEAR, month = 1] = iso.split('-').map(Number);
  return { iso, year, month };
}

function YearSelect({ current }: { current: number }) {
  const years: number[] = [];
  for (let y = Math.max(current, FIRST_REPORT_YEAR); y >= FIRST_REPORT_YEAR; y--) years.push(y);
  return (
    <select name="year" defaultValue={current} aria-label="Yıl" className={fieldClass}>
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}

/**
 * Ayarlar sayfasında satış raporu PDF'leri:
 *  - Hızlı: bugün / bu hafta / bu ay / bu yıl.
 *  - Tarih seçerek: seçilen gün, o günün haftası, seçilen ay veya yıl.
 * Formlar düz GET formu — JavaScript gerektirmez; PDF doğrudan iner.
 */
export function SalesReportCard() {
  const today = todayInIstanbul();

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <h2 className="font-semibold text-primary">Satış Raporları (PDF)</h2>
        <p className="text-xs text-carbon/60 mt-1">
          Seçtiğiniz dönemin siparişleri tutarlarıyla özetlenir: sipariş sayısı, kart ve havale tahsilatı, iadeler ve
          toplam ciro; ardından dönemin sipariş listesi. Haftalar Pazartesi başlar. Raporda müşteri adı, adresi veya
          telefonu yer almaz — muhasebecinizle paylaşabilirsiniz.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-carbon mb-2">Hızlı rapor</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REPORT_PERIODS.map((p) => (
            <a
              key={p.value}
              href={`${REPORT_URL}?period=${p.value}`}
              className="text-center text-sm font-semibold text-white bg-primary rounded-lg px-3 py-2.5 hover:bg-primary/90"
            >
              {p.label} · {p.buttonLabel}
            </a>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-dashed border-primary/15 space-y-3">
        <h3 className="text-sm font-semibold text-carbon">Tarih seçerek rapor</h3>

        <form method="get" action={REPORT_URL} className="flex flex-col sm:flex-row sm:items-end gap-2">
          <input type="hidden" name="period" value="daily" />
          <label className="flex-1 flex flex-col gap-1 text-xs text-carbon/60">
            Gün
            <input type="date" name="date" required defaultValue={today.iso} max={today.iso} className={fieldClass} />
          </label>
          <button type="submit" className={buttonClass}>
            Günün raporu
          </button>
        </form>

        <form method="get" action={REPORT_URL} className="flex flex-col sm:flex-row sm:items-end gap-2">
          <input type="hidden" name="period" value="weekly" />
          <label className="flex-1 flex flex-col gap-1 text-xs text-carbon/60">
            Hafta (haftadaki herhangi bir günü seçin)
            <input type="date" name="date" required defaultValue={today.iso} max={today.iso} className={fieldClass} />
          </label>
          <button type="submit" className={buttonClass}>
            Haftanın raporu
          </button>
        </form>

        <form method="get" action={REPORT_URL} className="flex flex-col sm:flex-row sm:items-end gap-2">
          <input type="hidden" name="period" value="monthly" />
          <label className="flex-1 flex flex-col gap-1 text-xs text-carbon/60">
            Ay
            <select name="month" defaultValue={today.month} className={fieldClass}>
              {MONTHS_TR.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 flex flex-col gap-1 text-xs text-carbon/60">
            Yıl
            <YearSelect current={today.year} />
          </label>
          <button type="submit" className={buttonClass}>
            Ayın raporu
          </button>
        </form>

        <form method="get" action={REPORT_URL} className="flex flex-col sm:flex-row sm:items-end gap-2">
          <input type="hidden" name="period" value="yearly" />
          <label className="flex-1 flex flex-col gap-1 text-xs text-carbon/60">
            Yıl
            <YearSelect current={today.year} />
          </label>
          <button type="submit" className={buttonClass}>
            Yılın raporu
          </button>
        </form>
      </div>

      <p className="text-[11px] text-carbon/45">
        Ciroya yalnızca ödemesi alınmış (Ödendi / Kargoya Verildi / Teslim Edildi) siparişler dahildir.
      </p>
    </div>
  );
}
