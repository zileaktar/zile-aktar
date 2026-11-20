'use client';

import { useState } from 'react';
import { buildDistanceSalesHtml, buildPreliminaryInfoHtml, type LegalDocInput } from '@/lib/legal-documents';

/**
 * Ödeme sayfasında, onay kutularından ÖNCE siparişe özel ÖBF / MSS'yi gösterir
 * (MSY m.5: ön bilgilendirme sözleşme kurulmadan önce, siparişin gerçek
 * bilgileriyle yapılır). İçerik `legal-documents.ts`'teki AYNI fonksiyonla
 * üretilir; sipariş anında sunucu bunu DB'deki kesin tutarlarla yeniden üretip
 * arşivler ve e-postayla gönderir. Kullanıcı girdisi fonksiyon içinde escape edilir.
 */
export function OrderLegalPreview({ input }: { input: LegalDocInput }) {
  const [open, setOpen] = useState<'preliminary_info' | 'distance_sales' | null>(null);

  const html =
    open === 'preliminary_info' ? buildPreliminaryInfoHtml(input) : open === 'distance_sales' ? buildDistanceSalesHtml(input) : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setOpen(open === 'preliminary_info' ? null : 'preliminary_info')}
          className="px-3 py-1.5 rounded-full border border-primary/30 text-primary font-semibold hover:bg-primary/5"
          aria-expanded={open === 'preliminary_info'}
        >
          {open === 'preliminary_info' ? 'Formu gizle' : 'Siparişinize özel Ön Bilgilendirme Formu'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(open === 'distance_sales' ? null : 'distance_sales')}
          className="px-3 py-1.5 rounded-full border border-primary/30 text-primary font-semibold hover:bg-primary/5"
          aria-expanded={open === 'distance_sales'}
        >
          {open === 'distance_sales' ? 'Sözleşmeyi gizle' : 'Siparişinize özel Mesafeli Satış Sözleşmesi'}
        </button>
      </div>
      {html && (
        <div
          className="max-h-72 overflow-y-auto border border-primary/15 rounded-xl p-3 bg-cream/40"
          // İçerik buildXxxHtml tarafından üretilir; tüm kullanıcı girdisi escapeHtml'den geçer.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
