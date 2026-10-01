'use client';

import { useState } from 'react';
import { formatPriceFromCents } from '@/lib/format';
import type { DailyPoint } from '@/lib/reports';

/*
 * Panel ana sayfası: son 30 günün günlük cirosu (tek seri → lejant yok, başlık
 * söyler). Sipariş adedi AYNI grafiğe ikinci eksenle konmaz (farklı ölçek) —
 * üstteki özet kartlarında ve çubuğun ipucunda gösterilir.
 *
 * Renk #3a8a5f: sitenin yeşil ailesinden, veri işareti için doğrulandı (dataviz
 * validate_palette: açıklık bandı, doygunluk, beyaz zemine ≥3:1 kontrast — PASS).
 * Marka koyu yeşili (#1b4332) çubuk için fazla koyu/soluk kalıyordu.
 */
const BAR_COLOR = '#3a8a5f';

/** Eksen için "temiz" üst sınır (kuruş): 1 / 2 / 5 × 10^n TL. */
function niceMaxCents(maxCents: number): number {
  const tl = Math.max(maxCents / 100, 1);
  const pow = 10 ** Math.floor(Math.log10(tl));
  const step = [1, 2, 5, 10].find((s) => s * pow >= tl) ?? 10;
  return step * pow * 100;
}

function axisLabel(cents: number): string {
  return new Intl.NumberFormat('tr-TR', { notation: cents >= 10_000_000 ? 'compact' : 'standard', maximumFractionDigits: 0 }).format(cents / 100) + ' ₺';
}

export function SalesChart({ points }: { points: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const total = points.reduce((s, p) => s + p.revenueCents, 0);
  const paid = points.reduce((s, p) => s + p.paidCount, 0);
  const max = niceMaxCents(Math.max(...points.map((p) => p.revenueCents), 0));
  const activePoint = active != null ? points[active] : undefined;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
      <div>
        <h2 className="font-semibold text-primary">Son {points.length} gün — günlük ciro</h2>
        <p className="text-xs text-carbon/50 mt-0.5">
          Ödemesi alınmış siparişler (Ödendi / Kargoda / Teslim). Çubuğun üzerine gelin veya dokunun.
        </p>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-carbon/50">Toplam ciro</div>
          <div className="font-semibold text-lg sm:text-2xl text-carbon">{formatPriceFromCents(total)}</div>
        </div>
        <div>
          <div className="text-xs text-carbon/50">Ödenen sipariş</div>
          <div className="font-semibold text-lg sm:text-2xl text-carbon">{paid}</div>
        </div>
        <div>
          <div className="text-xs text-carbon/50">Ortalama sepet</div>
          <div className="font-semibold text-lg sm:text-2xl text-carbon">
            {paid > 0 ? formatPriceFromCents(Math.round(total / paid)) : '—'}
          </div>
        </div>
      </div>

      {/* Grafik */}
      <div className="flex gap-2">
        {/* Y ekseni etiketleri */}
        <div className="relative w-14 shrink-0 h-44 text-[10px] text-carbon/45 tabular-nums">
          <span className="absolute right-0 -top-1.5">{axisLabel(max)}</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2">{axisLabel(max / 2)}</span>
          <span className="absolute right-0 -bottom-1.5">0 ₺</span>
        </div>

        <div className="relative flex-1 min-w-0">
          {/* Izgara: ince, düz, silik */}
          <div className="absolute inset-x-0 top-0 h-px bg-carbon/10" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-carbon/10" />
          <div className="absolute inset-x-0 top-44 h-px bg-carbon/25" />

          <div className="relative h-44 flex items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
            {points.map((p, i) => {
              const pct = (p.revenueCents / max) * 100;
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-label={`${p.label}: ${formatPriceFromCents(p.revenueCents)}, ${p.paidCount} sipariş`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive((a) => (a === i ? null : i))}
                  // Tıklama alanı tüm sütun yüksekliği — ince çubuğa nişan almak gerekmesin.
                  className="flex-1 h-full flex items-end justify-center focus:outline-none group"
                >
                  <span
                    className={`block w-full max-w-[24px] rounded-t-[4px] transition-opacity ${
                      active != null && active !== i ? 'opacity-40' : ''
                    } group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary`}
                    style={{
                      height: p.revenueCents > 0 ? `max(${pct}%, 2px)` : 0,
                      backgroundColor: BAR_COLOR
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* İpucu */}
          {activePoint && active != null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 rounded-lg bg-carbon px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap"
              style={{
                left: `${((active + 0.5) / points.length) * 100}%`,
                transform: `translate(${active < points.length / 4 ? '-10%' : active > (points.length * 3) / 4 ? '-90%' : '-50%'}, -100%)`
              }}
            >
              <div className="font-semibold">{activePoint.label}</div>
              <div>Ciro: {formatPriceFromCents(activePoint.revenueCents)}</div>
              <div>Ödenen sipariş: {activePoint.paidCount}</div>
            </div>
          )}

          {/* X ekseni: haftalık etiketler + son gün */}
          <div className="relative h-5 mt-1 text-[10px] text-carbon/45 tabular-nums">
            {points.map((p, i) =>
              i % 7 === 0 || i === points.length - 1 ? (
                <span
                  key={p.key}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${((i + 0.5) / points.length) * 100}%` }}
                >
                  {p.shortLabel}
                </span>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* Erişilebilirlik / tam değerler: tablo görünümü */}
      <details className="text-sm">
        <summary className="cursor-pointer text-primary font-semibold text-xs">Tablo olarak göster</summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-primary/10">
          <table className="w-full text-xs">
            <thead className="bg-cream text-left text-carbon/50 sticky top-0">
              <tr>
                <th className="px-3 py-1.5">Gün</th>
                <th className="px-3 py-1.5 text-right">Ciro</th>
                <th className="px-3 py-1.5 text-right">Sipariş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 tabular-nums">
              {[...points].reverse().map((p) => (
                <tr key={p.key}>
                  <td className="px-3 py-1.5">{p.label}</td>
                  <td className="px-3 py-1.5 text-right">{formatPriceFromCents(p.revenueCents)}</td>
                  <td className="px-3 py-1.5 text-right">{p.paidCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
