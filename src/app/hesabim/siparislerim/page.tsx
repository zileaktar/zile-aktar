import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPriceFromCents } from '@/lib/format';
import { orderStatusLabel } from '@/lib/order-status';

export const dynamic = 'force-dynamic';

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
    .select('id, order_number, status, total_cents, tracking_number, shipping_carrier, created_at, order_items(id, product_name_snapshot, variant_label_snapshot, unit_price_cents, quantity)')
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
            const status = orderStatusLabel(order.status);
            return (
              <Link
                key={order.id}
                href={`/hesabim/siparislerim/${order.id}`}
                className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
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
                {order.tracking_number && (
                  <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5 mb-3">
                    🚚 {order.shipping_carrier ? `${order.shipping_carrier} · ` : ''}Takip No: {order.tracking_number}
                  </div>
                )}
                <div className="flex justify-between font-bold text-primary pt-2 border-t border-dashed border-primary/15">
                  <span>Toplam</span>
                  <span>{formatPriceFromCents(order.total_cents)}</span>
                </div>
                <div className="text-right text-xs font-semibold text-primary mt-2">Detayı gör →</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
