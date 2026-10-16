'use client';

import { useActionState, useState } from 'react';
import { ActionForm, useActionFormPending } from '@/components/ui/ActionForm';
import { saveShippingConfigAction, type ShippingFormState } from '@/app/admin/ayarlar/shipping-actions';
import { calcShippingCents, type ShippingConfig } from '@/lib/shipping';

interface RateRow {
  maxKg: string;
  price: string;
}

const INPUT = 'mt-1 w-full bg-cream border border-primary/15 rounded-xl px-3 py-2.5 text-sm';

function centsToTlText(cents: number): string {
  return (cents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SaveButton() {
  const pending = useActionFormPending();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold px-6 py-3 rounded-full transition"
    >
      {pending ? 'Kaydediliyor...' : 'Kargo Ücretlerini Kaydet'}
    </button>
  );
}

/**
 * Admin → Ayarlar → Kargo Ücretleri (ağırlığa göre, migration 0043).
 * Aralıklar "X kg'a kadar Y TL" biçiminde girilir; kaydedilince sepet, ödeme
 * sayfası, yasal metinler ve Google ürün listesi kendiliğinden güncellenir.
 */
export function ShippingSettingsForm({ config }: { config: ShippingConfig }) {
  const [state, formAction] = useActionState<ShippingFormState, FormData>(saveShippingConfigAction, { error: null });
  const [rows, setRows] = useState<RateRow[]>(
    config.rates.map((r) => ({
      maxKg: (r.maxGrams / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 3 }),
      price: centsToTlText(r.priceCents)
    }))
  );
  const [testKg, setTestKg] = useState('1');

  function update(i: number, patch: Partial<RateRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // Önizleme: girilen (henüz kaydedilmemiş) aralıklarla örnek bir gönderinin ücreti.
  const previewRates = rows
    .map((r) => ({
      maxGrams: Math.round(Number(r.maxKg.replace(',', '.')) * 1000),
      // Sunucuyla aynı: virgül varsa Türkçe biçim ("1.234,50"), yoksa düz ondalık ("39.90").
      priceCents: Math.round(
        Number(r.price.includes(',') ? r.price.replace(/\./g, '').replace(',', '.') : r.price) * 100
      )
    }))
    .filter((r) => Number.isFinite(r.maxGrams) && r.maxGrams > 0 && Number.isFinite(r.priceCents));
  const testGrams = Math.round(Number(testKg.replace(',', '.')) * 1000);
  const previewCents =
    previewRates.length > 0 && Number.isFinite(testGrams)
      ? calcShippingCents({ ...config, freeThresholdCents: null, rates: previewRates }, 1, testGrams)
      : null;

  return (
    <ActionForm action={formAction} className="bg-white rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl">
      <div>
        <h2 className="font-display font-bold text-primary">Kargo Ücretleri (Ağırlığa Göre)</h2>
        <p className="text-xs text-carbon/50 mt-1">
          Kargo ücreti, sepetteki ürünlerin toplam ağırlığına göre hesaplanır. Her satır &quot;bu kg&apos;a kadar şu
          ücret&quot; demektir. Kaydettiğiniz anda sepet, ödeme sayfası, Teslimat/Kargo ve sözleşme metinleri
          güncellenir. Google Merchant Center&apos;daki kargo ayarını da aynı ücretlerle güncelleyin.
        </p>
      </div>

      <input type="hidden" name="ratesJson" value={JSON.stringify(rows)} />

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[11px] font-semibold text-carbon/55">
          <span>… kg&apos;a kadar</span>
          <span>Ücret (TL)</span>
          <span className="w-9" />
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <input
              value={r.maxKg}
              inputMode="decimal"
              placeholder="örn. 1"
              onChange={(e) => update(i, { maxKg: e.target.value })}
              className={INPUT.replace('mt-1 ', '')}
              aria-label={`${i + 1}. aralık kg sınırı`}
            />
            <input
              value={r.price}
              inputMode="decimal"
              placeholder="örn. 39,90"
              onChange={(e) => update(i, { price: e.target.value })}
              className={INPUT.replace('mt-1 ', '')}
              aria-label={`${i + 1}. aralık ücreti`}
            />
            <button
              type="button"
              disabled={rows.length <= 1}
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              className="touch-target w-9 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 disabled:opacity-30"
              aria-label={`${i + 1}. aralığı sil`}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { maxKg: '', price: '' }])}
          className="text-sm font-semibold text-primary hover:underline"
        >
          + Aralık ekle
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-carbon/60">
          En büyük aralığı aşan her kg için ek ücret (TL)
          <input
            name="extraPerKg"
            defaultValue={config.extraPerKgCents ? centsToTlText(config.extraPerKgCents) : ''}
            inputMode="decimal"
            placeholder="0 = ek ücret yok"
            className={INPUT}
          />
        </label>
        <label className="block text-xs font-semibold text-carbon/60">
          Ücretsiz kargo sınırı (TL)
          <input
            name="freeThreshold"
            defaultValue={config.freeThresholdCents != null ? centsToTlText(config.freeThresholdCents) : ''}
            inputMode="decimal"
            placeholder="Boş = ücretsiz kargo yok"
            className={INPUT}
          />
        </label>
        <label className="block text-xs font-semibold text-carbon/60">
          Koli / ambalaj ağırlığı (g, her siparişe eklenir)
          <input name="packagingGrams" defaultValue={String(config.packagingGrams)} inputMode="numeric" className={INPUT} />
        </label>
        <label className="block text-xs font-semibold text-carbon/60">
          Ağırlığı girilmemiş ürün için varsayılan (g)
          <input name="defaultItemGrams" defaultValue={String(config.defaultItemGrams)} inputMode="numeric" className={INPUT} />
        </label>
      </div>

      <div className="bg-cream rounded-xl p-3 text-xs text-carbon/70 flex flex-wrap items-center gap-2">
        <span>Deneme:</span>
        <input
          value={testKg}
          onChange={(e) => setTestKg(e.target.value)}
          inputMode="decimal"
          className="w-20 bg-white border border-primary/15 rounded-lg px-2 py-1 text-sm"
          aria-label="Deneme ağırlığı (kg)"
        />
        <span>kg ürün →</span>
        <b className="text-primary">{previewCents != null ? `${centsToTlText(previewCents)} TL` : '—'}</b>
        <span className="text-carbon/45">(ambalaj dahil, ücretsiz kargo sınırı hariç)</span>
      </div>

      {state.error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{state.error}</div>}
      {state.ok && !state.error && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">Kargo ücretleri kaydedildi.</div>
      )}

      <SaveButton />
    </ActionForm>
  );
}
