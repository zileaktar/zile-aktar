import Link from 'next/link';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { formatPriceFromCents } from '@/lib/format';
import { updateReturnRequestAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'İnceleniyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  completed: 'Tamamlandı'
};
const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-carbon/10 text-carbon/60'
};

interface ReturnRow {
  id: string;
  reason: string;
  detail: string;
  status: string;
  admin_note: string;
  created_at: string;
  order_id: string;
  orders:
    | { order_number: string; contact_email: string; contact_phone: string; total_cents: number }
    | { order_number: string; contact_email: string; contact_phone: string; total_cents: number }[]
    | null;
}

function ReturnCard({ r }: { r: ReturnRow }) {
  const order = Array.isArray(r.orders) ? r.orders[0] : r.orders;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          <Link href={`/admin/siparisler/${r.order_id}`} className="font-semibold text-primary hover:underline">
            {order?.order_number ?? '—'}
          </Link>
          <span className="ml-2 text-xs text-carbon/50">
            {order?.contact_email} · {order?.contact_phone}
          </span>
          {order && <span className="ml-2 text-xs text-carbon/50">{formatPriceFromCents(order.total_cents)}</span>}
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[r.status] ?? ''}`}>
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </div>
      <p className="text-sm font-medium">{r.reason}</p>
      {r.detail && <p className="text-sm text-carbon/70">{r.detail}</p>}
      <p className="text-[11px] text-carbon/40 mt-1">{new Date(r.created_at).toLocaleString('tr-TR')}</p>

      <form action={updateReturnRequestAction} className="flex flex-wrap items-end gap-2 mt-3 pt-3 border-t border-dashed border-primary/10">
        <input type="hidden" name="requestId" value={r.id} />
        <label className="flex flex-col gap-1 text-xs text-carbon/60">
          Durum
          <select
            name="status"
            defaultValue={r.status === 'pending' ? 'approved' : r.status}
            className="text-sm border border-primary/15 rounded-lg px-2 py-1.5 bg-cream"
          >
            <option value="approved">Onayla</option>
            <option value="rejected">Reddet</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </label>
        <label className="flex-1 min-w-[180px] flex flex-col gap-1 text-xs text-carbon/60">
          Not (müşteri görür)
          <input
            type="text"
            name="adminNote"
            defaultValue={r.admin_note}
            maxLength={1000}
            placeholder="Örn. kargo ile geri gönderin, XX numarasına ulaşın..."
            className="text-sm border border-primary/15 rounded-lg px-2 py-1.5 bg-cream w-full"
          />
        </label>
        <button type="submit" className="text-sm font-semibold text-white bg-primary rounded-lg px-4 py-2 hover:bg-primary/90">
          Kaydet
        </button>
      </form>
    </div>
  );
}

export default async function AdminReturnsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from('return_requests')
    .select('id, order_id, reason, detail, status, admin_note, created_at, orders(order_number, contact_email, contact_phone, total_cents)')
    .order('created_at', { ascending: false })
    .limit(100);

  const requests = (data ?? []) as unknown as ReturnRow[];
  const pending = requests.filter((r) => r.status === 'pending');
  const others = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-primary">İade / İptal Talepleri</h1>
      <p className="text-xs text-carbon/50 -mt-4">
        Burada durumu değiştirmek yalnızca müşteriye bir yanıt/not gösterir — siparişi fiilen iptal edip stoğu
        geri almak veya ödemeyi iade etmek için <b>Siparişler</b> sayfasından sipariş durumunu ayrıca güncellemen
        gerekir.
      </p>

      <div>
        <h2 className="font-semibold text-primary mb-3">İnceleme Bekleyenler ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-carbon/50">Bekleyen iade talebi yok.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <ReturnCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <h2 className="font-semibold text-carbon/60 mb-3">Geçmiş</h2>
          <div className="space-y-3">
            {others.map((r) => (
              <ReturnCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
