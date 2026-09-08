import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPriceFromCents } from '@/lib/format';
import { orderStatusLabel, paymentMethodLabel } from '@/lib/order-status';

export const metadata: Metadata = { title: 'Sipariş Detayı', robots: { index: false } };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect(`/giris?redirectTo=/hesabim/siparislerim/${id}`);

  // RLS `orders_select_own_or_staff` — başkasının siparişi hiç dönmez, notFound().
  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, subtotal_cents, shipping_cents, deal_discount_cents, discount_cents, coupon_code, total_cents, shipping_address, billing_address, contact_email, contact_phone, payment_provider, shipping_carrier, tracking_number, shipped_at, created_at, order_items(id, product_name_snapshot, variant_label_snapshot, unit_price_cents, quantity)'
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!order) notFound();

  const status = orderStatusLabel(order.status);
  const addr = order.shipping_address;
  const billing = order.billing_address;
  const items = order.order_items ?? [];
  const isPendingHavale = order.status === 'pending' && order.payment_provider === 'havale';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <div className="flex items-center gap-2 text-sm text-carbon/50">
        <Link href="/hesabim/siparislerim" className="hover:text-primary">
          Siparişlerim
        </Link>
        <span>/</span>
        <span className="text-carbon/70">{order.order_number}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">{order.order_number}</h1>
          <p className="text-xs text-carbon/50">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.className}`}>{status.label}</span>
      </div>

      {isPendingHavale && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          Havale/EFT ödemeniz bekleniyor. Açıklamaya <b>{order.order_number}</b> yazarak ödeme yaptıysanız,
          onaylandığında siparişiniz hazırlanmaya başlar.
        </div>
      )}

      {(order.shipping_carrier || order.tracking_number) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <div className="font-semibold mb-1">🚚 Kargo Bilgisi</div>
          {order.shipped_at && (
            <div className="text-xs text-blue-700/80 mb-1">
              {new Date(order.shipped_at).toLocaleDateString('tr-TR')} tarihinde kargoya verildi.
            </div>
          )}
          {order.shipping_carrier && <div>Kargo firması: {order.shipping_carrier}</div>}
          {order.tracking_number && (
            <div>
              Takip numarası: <span className="font-mono font-semibold">{order.tracking_number}</span>
            </div>
          )}
          <p className="text-xs text-blue-700/70 mt-1">Kargo firmasının web sitesinden takip numaranızla durumu izleyebilirsiniz.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-primary mb-3">Ürünler</h2>
        <div className="divide-y divide-primary/5">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between py-2.5 text-sm">
              <span className="text-carbon/80">
                {item.product_name_snapshot}{' '}
                <span className="text-carbon/50">
                  ({item.variant_label_snapshot}) × {item.quantity}
                </span>
              </span>
              <span className="font-medium">{formatPriceFromCents(item.unit_price_cents * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-primary/15 mt-3 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-carbon/60">
            <span>Ara Toplam</span>
            <span>{formatPriceFromCents(order.subtotal_cents)}</span>
          </div>
          {order.deal_discount_cents > 0 && (
            <div className="flex justify-between text-primary">
              <span>Kampanya indirimi</span>
              <span>-{formatPriceFromCents(order.deal_discount_cents)}</span>
            </div>
          )}
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-red-600">
              <span>İndirim{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
              <span>-{formatPriceFromCents(order.discount_cents)}</span>
            </div>
          )}
          <div className="flex justify-between text-carbon/60">
            <span>Kargo</span>
            <span>{order.shipping_cents === 0 ? 'Bedava' : formatPriceFromCents(order.shipping_cents)}</span>
          </div>
          <div className="flex justify-between font-display font-bold text-primary pt-1.5 border-t border-dashed border-primary/15">
            <span>Genel Toplam</span>
            <span>{formatPriceFromCents(order.total_cents)}</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-primary mb-2">Teslimat Adresi</h2>
          <div className="text-sm text-carbon/75 space-y-0.5">
            <div className="font-medium text-carbon">{addr.full_name}</div>
            <div>{addr.phone}</div>
            <div>
              {addr.district} / {addr.city}
            </div>
            <div className="text-carbon/55">{addr.address_line}</div>
          </div>
          {billing && (
            <div className="mt-3 pt-3 border-t border-dashed border-primary/15">
              <h3 className="font-semibold text-primary text-sm mb-1">Fatura Adresi</h3>
              <div className="text-sm text-carbon/75 space-y-0.5">
                <div className="font-medium text-carbon">{billing.full_name}</div>
                <div>{billing.phone}</div>
                <div>
                  {billing.district} / {billing.city}
                </div>
                <div className="text-carbon/55">{billing.address_line}</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-primary mb-2">Ödeme & İletişim</h2>
          <div className="text-sm text-carbon/75 space-y-0.5">
            <div>Ödeme yöntemi: {paymentMethodLabel(order.payment_provider)}</div>
            <div>E-posta: {order.contact_email}</div>
            <div>Telefon: {order.contact_phone}</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-carbon/50 pt-2">
        Sipariş veya iade ile ilgili sorularınız için{' '}
        <a href="/iletisim" className="text-primary underline">
          İletişim
        </a>{' '}
        sayfamızdan bize ulaşabilirsiniz.
      </p>
    </div>
  );
}
