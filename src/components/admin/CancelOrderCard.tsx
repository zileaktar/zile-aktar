'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { cancelOrderAction, type CancelOrderFormState } from '@/app/admin/siparisler/[id]/cancel-actions';
import type { CancelKind } from '@/lib/order-cancel';

const TEXT: Record<Exclude<CancelKind, 'closed'>, { title: string; info: string; confirm: string; button: string }> = {
  cancel_unpaid: {
    title: 'Siparişi İptal Et',
    info: 'Bu siparişin ödemesi alınmamış. İptal edilince ayrılan stok geri eklenir ve müşteriye bilgi e-postası gider. Kartlı siparişlerde önce bankaya sorulur; müşteri bu arada ödediyse iptal yapılmaz.',
    confirm: 'Siparişi iptal etmek istediğimi onaylıyorum.',
    button: 'Siparişi iptal et'
  },
  refund_card: {
    title: 'İptal Et ve Ücreti Karta İade Et',
    info: 'Ödeme VakıfBank üzerinden müşterinin kartına TAM TUTAR olarak iade edilir (aynı gün ise iptal, sonraki günlerde iade). Bu işlem geri alınamaz. Müşteriye bilgi e-postası gider.',
    confirm: 'Tutarın tamamının müşterinin kartına iade edileceğini onaylıyorum.',
    button: 'İptal et ve ücreti iade et'
  },
  refund_transfer: {
    title: 'İade Edildi Olarak Kapat (Havale)',
    info: 'Havale/EFT ödemeleri otomatik geri gönderilemez. Önce parayı müşterinin hesabına kendi bankanızdan gönderin, ardından bu düğmeyle siparişi kapatın. Müşteriye bilgi e-postası gider.',
    confirm: 'Ücreti müşteriye havale/EFT ile geri gönderdiğimi onaylıyorum.',
    button: 'İade edildi olarak kapat'
  }
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto text-sm font-semibold text-white bg-red-600 rounded-lg px-4 py-2.5 hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? 'İşleniyor… lütfen bekleyin' : label}
    </button>
  );
}

/** Sipariş detayında (yalnız admin): iptal / ücret iadesi kartı. */
export function CancelOrderCard({
  orderId,
  kind,
  totalLabel,
  defaultRestock
}: {
  orderId: string;
  kind: Exclude<CancelKind, 'closed'>;
  totalLabel: string;
  defaultRestock: boolean;
}) {
  const [state, formAction] = useFormState<CancelOrderFormState, FormData>(cancelOrderAction, {
    ok: false,
    message: null
  });
  const text = TEXT[kind];

  if (state.ok) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-5 text-sm">{state.message}</div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 space-y-3">
      <div>
        <h2 className="font-semibold text-red-700">{text.title}</h2>
        <p className="text-xs text-carbon/60 mt-1">{text.info}</p>
        {kind !== 'cancel_unpaid' && (
          <p className="text-sm text-carbon/80 mt-2">
            İade tutarı: <b>{totalLabel}</b>
          </p>
        )}
      </div>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        {kind !== 'cancel_unpaid' && (
          <label className="flex items-start gap-2 text-sm text-carbon/80">
            <input type="checkbox" name="restock" defaultChecked={defaultRestock} className="mt-1" />
            <span>
              Ürünleri stoğa geri ekle
              <span className="block text-xs text-carbon/50">
                Ürün size geri gelmediyse veya satılamayacak durumdaysa işareti kaldırın.
              </span>
            </span>
          </label>
        )}
        <label className="flex items-start gap-2 text-sm text-carbon/80">
          <input type="checkbox" name="confirm" required className="mt-1" />
          <span>{text.confirm}</span>
        </label>
        {state.message && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.message}</p>
        )}
        <SubmitButton label={text.button} />
      </form>
    </div>
  );
}
