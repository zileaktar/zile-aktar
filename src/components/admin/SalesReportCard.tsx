import { REPORT_PERIODS } from '@/lib/reports';

/** Ayarlar sayfasında: şimdiye kadarki tüm siparişlerin dönemsel satış raporu PDF'leri. */
export function SalesReportCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div>
        <h2 className="font-semibold text-primary">Satış Raporları (PDF)</h2>
        <p className="text-xs text-carbon/60 mt-1">
          Şimdiye kadarki tüm siparişler, tutarlarıyla birlikte seçtiğiniz döneme göre özetlenir: sipariş sayısı,
          kart ve havale tahsilatı, iadeler ve toplam ciro; ardından her dönemin sipariş listesi. Raporda müşteri
          adı, adresi veya telefonu yer almaz — muhasebecinizle paylaşabilirsiniz.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {REPORT_PERIODS.map((p) => (
          <a
            key={p.value}
            href={`/api/admin/reports/pdf?period=${p.value}`}
            className="text-center text-sm font-semibold text-white bg-primary rounded-lg px-3 py-2.5 hover:bg-primary/90"
          >
            {p.label} Rapor
          </a>
        ))}
      </div>
      <p className="text-[11px] text-carbon/45">
        Ciroya yalnızca ödemesi alınmış (Ödendi / Kargoya Verildi / Teslim Edildi) siparişler dahildir.
      </p>
    </div>
  );
}
