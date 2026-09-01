import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPriceFromCents } from '@/lib/format';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Beklemede', className: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Ödendi', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Başarısız', className: 'bg-red-100 text-red-700' },
  shipped: { label: 'Kargoya Verildi', className: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Teslim Edildi', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal Edildi', className: 'bg-carbon/10 text-carbon/60' },
  refunded: { label: 'İade Edildi', className: 'bg-carbon/10 text-carbon/60' }
};

export default async function OrderHistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/giris?redirectTo=/hesabim/siparislerim');

  // RLS: orders_select_own_or_staff politikası, yalnızca user_id = auth.uid() olan
  // satırların döneceğini garanti eder — burada ayrıca .eq('user_id', ...) yazmaya
  // gerek yoktur ama okunabilirlik için eklenmiştir.
  // .limit() kasıtlı: uzun yıllar alışveriş yapan bir müşterinin sipariş geçmişi
  // sınırsız büyümesin diye en yeni 50 sipariş gösterilir.
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-2xl text-primary mb-6">Siparişlerim</h1>

      {!orders || orders.length === 0 ? (
        <p className="text-carbon/50">Henüz siparişiniz yok.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending!;
            return (
              <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-primary">{order.order_number}</div>
                    <div className="text-xs text-carbon/50">{new Date(order.created_at).toLocaleDateString('tr-TR')}</div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.className}`}>{status.label}</span>
                </div>
                <div className="space-y-1 mb-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-carbon/70">
                      <span>
                        {item.product_name_snapshot} ({item.variant_label_snapshot}) × {item.quantity}
                      </span>
                      <span>{formatPriceFromCents(item.unit_price_cents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-primary pt-2 border-t border-dashed border-primary/15">
                  <span>Toplam</span>
                  <span>{formatPriceFromCents(order.total_cents)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
