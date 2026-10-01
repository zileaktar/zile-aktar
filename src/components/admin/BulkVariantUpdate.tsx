'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ActionForm, useActionFormPending } from '@/components/ui/ActionForm';
import {
  applyBulkUpdateAction,
  previewBulkUpdateAction,
  type ApplyState,
  type PreviewState
} from '@/app/admin/urunler/toplu/actions';
import { formatPriceFromCents } from '@/lib/format';
import type { BulkChange, VariantValues } from '@/lib/bulk-variants';

function PendingButton({ label, pendingLabel, disabled }: { label: string; pendingLabel: string; disabled?: boolean }) {
  const pending = useActionFormPending();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="touch-target w-full sm:w-auto text-sm font-semibold text-white bg-primary rounded-lg px-5 py-2.5 hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function Diff({ from, to, render }: { from: number | null; to: number | null; render: (v: number | null) => string }) {
  if (from === to) return <span className="text-carbon/50">{render(to)}</span>;
  return (
    <span className="whitespace-nowrap">
      <span className="text-carbon/40 line-through">{render(from)}</span> → <b className="text-primary">{render(to)}</b>
    </span>
  );
}

const price = (v: number | null) => (v == null ? '—' : formatPriceFromCents(v));
const qty = (v: number | null) => (v == null ? '—' : `${v}`);

function ChangeRow({ c }: { c: BulkChange }) {
  const cell = (k: keyof VariantValues, render: (v: number | null) => string) => (
    <Diff from={c.old[k]} to={c.next[k]} render={render} />
  );
  return (
    <tr className="align-top">
      <td className="px-3 py-2">
        <div className="font-medium">{c.productName}</div>
        <div className="text-xs text-carbon/50">
          {c.label} · <span className="font-mono">{c.sku}</span>
        </div>
      </td>
      <td className="px-3 py-2">{cell('priceCents', price)}</td>
      <td className="px-3 py-2">{cell('compareAtCents', price)}</td>
      <td className="px-3 py-2">{cell('stock', qty)}</td>
    </tr>
  );
}

/** Ürünler → Toplu Güncelleme: CSV indir → Excel'de düzenle → yükle → önizle → uygula. */
export function BulkVariantUpdate() {
  const [previewState, previewAction] = useActionState<PreviewState, FormData>(previewBulkUpdateAction, {
    error: null,
    preview: null
  });
  const [applyState, applyAction] = useActionState<ApplyState, FormData>(applyBulkUpdateAction, {
    error: null,
    updated: null,
    conflicts: []
  });
  const preview = previewState.preview;
  const blocked = !preview || preview.errors.length > 0 || preview.changes.length === 0;
  const nameBySku = new Map(preview?.changes.map((c) => [c.sku, `${c.productName} (${c.label})`]) ?? []);

  if (applyState.updated !== null) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-5 text-sm space-y-2">
          <p className="font-semibold">{applyState.updated} ürün seçeneği güncellendi. Değişiklikler sitede hemen görünür.</p>
          {applyState.conflicts.length > 0 && (
            <div className="text-amber-800">
              <p>
                Şu {applyState.conflicts.length} satır güncellenmedi — dosyayı indirdikten sonra değerleri değişmiş (ör. sipariş
                gelip stok düşmüş). Güncel listeyi yeniden indirip bu ürünleri tekrar düzenleyin:
              </p>
              <ul className="list-disc ml-5 mt-1">
                {applyState.conflicts.map((sku) => (
                  <li key={sku}>{nameBySku.get(sku) ?? sku}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/urunler/toplu" className="text-sm font-semibold text-primary hover:underline">
          Yeni bir dosya yükle
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-primary">1. Güncel listeyi indirin</h2>
        <p className="text-xs text-carbon/60">
          Tüm ürünlerin fiyat ve stokları Excel&apos;de açılan bir dosya olarak iner. Yalnızca <b>Fiyat (TL)</b>,{' '}
          <b>İndirimsiz Fiyat (TL)</b> ve <b>Stok</b> sütunlarını değiştirin; SKU ve başlıklara dokunmayın. İndirim yoksa
          &quot;İndirimsiz Fiyat&quot; boş kalmalı. Ürün eklemek/silmek için ürün düzenleme sayfasını kullanın.
        </p>
        {/* Düz <a>: dosya indirmesi. */}
        <a
          href="/api/admin/variants/export"
          className="inline-block text-sm font-semibold text-white bg-primary rounded-lg px-5 py-2.5 hover:bg-primary/90"
        >
          Güncel listeyi indir (CSV)
        </a>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-primary">2. Düzenlediğiniz dosyayı yükleyin</h2>
        <p className="text-xs text-carbon/60">
          Excel&apos;de kaydederken <b>&quot;CSV UTF-8 (virgülle ayrılmış)&quot;</b> ya da <b>&quot;CSV (virgülle ayrılmış)&quot;</b>{' '}
          seçin. Yükleyince önce değişikliklerin önizlemesi gösterilir; onaylamadan hiçbir şey değişmez.
        </p>
        <ActionForm action={previewAction} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-full max-w-full text-sm text-carbon/60 file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-primary"
          />
          <PendingButton label="Önizle" pendingLabel="Okunuyor…" />
        </ActionForm>
        {previewState.error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{previewState.error}</p>
        )}
      </div>

      {preview && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-primary">3. Kontrol edin ve onaylayın</h2>
          <p className="text-sm text-carbon/70">
            Dosyada {preview.totalRows} satır: <b>{preview.changes.length}</b> değişiklik, {preview.unchanged} değişmeyen
            {preview.errors.length > 0 && (
              <>
                , <b className="text-red-700">{preview.errors.length} hatalı</b>
              </>
            )}
            .
          </p>

          {preview.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800 space-y-1">
              <p className="font-semibold">
                Hatalı satırlar var — dosyayı düzeltip tekrar yükleyin (hata varken hiçbir değişiklik uygulanmaz):
              </p>
              <ul className="list-disc ml-5 max-h-60 overflow-y-auto">
                {preview.errors.slice(0, 100).map((e) => (
                  <li key={`${e.line}-${e.message}`}>
                    {e.line}. satır: {e.message}
                  </li>
                ))}
              </ul>
              {preview.errors.length > 100 && <p>… ve {preview.errors.length - 100} hata daha.</p>}
            </div>
          )}

          {preview.changes.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-primary/10">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-cream text-left text-xs uppercase text-carbon/50">
                  <tr>
                    <th className="px-3 py-2">Ürün</th>
                    <th className="px-3 py-2">Fiyat</th>
                    <th className="px-3 py-2">İndirimsiz fiyat</th>
                    <th className="px-3 py-2">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {preview.changes.map((c) => (
                    <ChangeRow key={c.sku} c={c} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.changes.length === 0 && preview.errors.length === 0 && (
            <p className="text-sm text-carbon/60">Dosyada değişiklik yok — tüm değerler sistemdekiyle aynı.</p>
          )}

          {applyState.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{applyState.error}</p>
          )}

          <ActionForm action={applyAction} className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input type="hidden" name="changesJson" value={JSON.stringify(preview.changes)} />
            <PendingButton
              label={`${preview.changes.length} değişikliği uygula`}
              pendingLabel="Uygulanıyor…"
              disabled={blocked}
            />
            <Link href="/admin/urunler" className="text-sm font-semibold text-carbon/60 hover:text-carbon">
              Vazgeç
            </Link>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
