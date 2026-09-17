'use client';

import { useState, useTransition } from 'react';
import { createReturnRequestAction } from '@/app/hesabim/siparislerim/[id]/return-actions';
import { RETURN_REASONS } from '@/lib/validations/return-request';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'İnceleniyor', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Onaylandı', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Tamamlandı', className: 'bg-green-100 text-green-700' }
};

export interface ExistingReturnRequest {
  status: string;
  reason: string;
  detail: string;
  adminNote: string;
  createdAt: string;
}

/**
 * Sipariş detayında self-servis iade talebi — ya mevcut talebin durumunu
 * gösterir, ya da (uygunsa) yeni talep açma formunu. `eligible` sunucuda
 * hesaplanır (sipariş `delivered` + cayma süresi içinde); asıl güvenlik
 * sınırı yine de RLS'tir (bkz. return-actions.ts).
 */
export function ReturnRequestForm({
  orderId,
  eligible,
  existingRequest
}: {
  orderId: string;
  eligible: boolean;
  existingRequest: ExistingReturnRequest | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof RETURN_REASONS)[number]>(RETURN_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (existingRequest) {
    const s = STATUS_LABELS[existingRequest.status] ?? STATUS_LABELS.pending!;
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-semibold text-primary">İade / İptal Talebiniz</h2>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.className}`}>{s.label}</span>
        </div>
        <p className="text-sm text-carbon/70">
          <span className="font-medium">{existingRequest.reason}</span>
          {existingRequest.detail && <> — {existingRequest.detail}</>}
        </p>
        <p className="text-[11px] text-carbon/40 mt-1">
          {new Date(existingRequest.createdAt).toLocaleString('tr-TR')} tarihinde oluşturuldu.
        </p>
        {existingRequest.adminNote && (
          <p className="text-sm text-primary-dark bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 mt-2">
            {existingRequest.adminNote}
          </p>
        )}
      </div>
    );
  }

  if (!eligible) return null;

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-5 text-sm">
        ✅ İade talebiniz alındı. En kısa sürede tarafınıza dönüş yapılacaktır.
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-primary hover:underline">
        İade / İptal Talebi Oluştur
      </button>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createReturnRequestAction(orderId, { reason, detail });
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <h2 className="font-semibold text-primary">İade / İptal Talebi Oluştur</h2>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <label className="block text-xs font-semibold text-carbon/60">
        Sebep
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as (typeof RETURN_REASONS)[number])}
          className="mt-1 w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm"
        >
          {RETURN_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-carbon/60">
        Açıklama (opsiyonel)
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Ek detay eklemek isterseniz..."
          className="mt-1 w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-full"
        >
          {pending ? 'Gönderiliyor...' : 'Talebi Gönder'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(false)}
          className="border border-primary/20 text-carbon/60 font-semibold text-sm px-4 py-2 rounded-full"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
