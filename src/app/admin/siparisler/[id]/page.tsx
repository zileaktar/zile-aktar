import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { formatPriceFromCents } from '@/lib/format';
import type { OrderStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  failed: 'Başarısız',
  shipped: 'Kargoya Verildi',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
  refunded: 'İade Edildi'
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, subtotal_cents, shipping_cents, total_cents, currency, shipping_address, billing_address, contact_email, contact_phone, payment_provider, payment_ref, created_at, updated_at, order_items(id, product_name_snapshot, variant_label_snapshot, unit_price_cents, quantity)'
    )
    .eq('id', id)
    .single();

  if (!order) notFound();

  const addr = order.shipping_address;
  const billing = order.billing_address;
  const items = order.order_items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/siparisler" className="text-primary hover:underline">
          ← Siparişler
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display font-bold text-2xl text-primary">{order.order_number}</h1>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <p className="text-xs text-carbon/50">
        Oluşturma: {new Date(order.created_at).toLocaleString('tr-TR')} · Son güncelleme:{' '}
        {new Date(order.updated_at).toLocaleString('tr-TR')}
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-primary mb-3">Teslimat Adresi</h2>
          <div className="text-sm text-carbon/80 space-y-1">
            <div className="font-medium">{addr.full_name}</div>
            <div>{addr.phone}</div>
            <div>
              {addr.district} / {addr.city}
            </div>
            <div className="text-carbon/60">{addr.address_line}</div>
          </div>
          {billing && (
            <div className="mt-4 pt-3 border-t border-dashed border-primary/15">
              <h3 className="font-semibold text-primary text-sm mb-2">Fatura Adresi</h3>
              <div className="text-sm text-carbon/80 space-y-1">
                <div className="font-medium">{billing.full_name}</div>
                <div>{billing.phone}</div>
                <div>
                  {billing.district} / {billing.city}
                </div>
                <div className="text-carbon/60">{billing.address_line}</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-primary mb-3">İletişim</h2>
          <div className="text-sm text-carbon/80 space-y-1">
            <div>E-posta: {order.contact_email}</div>
            <div>Telefon: {order.contact_phone}</div>
          </div>
          <h2 className="font-semibold text-primary mt-4 mb-2">Ödeme</h2>
          <div className="text-sm text-carbon/80 space-y-1">
            <div>Sağlayıcı: {order.payment_provider}</div>
            <div>Referans: {order.payment_ref ?? '—'}</div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
