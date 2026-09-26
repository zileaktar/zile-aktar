import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatPriceFromCents, formatDateTimeTR, formatOrderTimeTR } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/lib/stock';

// Özet metrikler (sipariş sayısı, son siparişler, düşük stok) her zaman canlı olmalı —
// service_role sorgusu çerez taşımadığından aksi halde önbelleğe alınır.
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Panel içi özet metrikler için service_role kullanılır (RLS'i aşarak tüm
  // siparişleri toplu okur) — çünkü bu route zaten AdminLayout'ta rol kontrolünden
  // geçmiş bir kullanıcıya sunuluyor.
  const supabase = createSupabaseServiceRoleClient();

  const [{ count: orderCount }, { count: productCount }, { data: recentOrders }, { data: lowStock }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('order_number, total_cents, status, created_at').order('created_at', { ascending: false }).limit(5),
    // Yalnız AKTİF ürünler (pasif ürünlerin stoğu önemsiz), en az stoklu en üstte.
    supabase
      .from('product_variants')
      .select('label, stock, product_id, products!inner(name, is_active)')
      .lte('stock', LOW_STOCK_THRESHOLD)
      .eq('products.is_active', true)
      .order('stock')
      .limit(50)
  ]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-primary mb-6">Yönetim Paneli</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-sm text-carbon/50 mb-1">Toplam Sipariş</div>
          <div className="font-display font-bold text-3xl text-primary">{orderCount ?? 0}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-sm text-carbon/50 mb-1">Aktif Ürün</div>
          <div className="font-display font-bold text-3xl text-primary">{productCount ?? 0}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-primary mb-3">Son Siparişler</h2>
          <div className="space-y-2">
            {recentOrders?.map((o) => (
              // flex-wrap: dar telefonda (320px) sipariş no + saat + tutar tek satıra
              // sığmıyordu; artık gerekirse ikinci satıra geçer.
              <div key={o.order_number} className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-sm">
                <span className="font-medium break-all">{o.order_number}</span>
                <span className="text-carbon/50 whitespace-nowrap" title={formatDateTimeTR(o.created_at)}>
                  {formatOrderTimeTR(o.created_at)}
                </span>
                <span className="text-carbon/60 whitespace-nowrap">{formatPriceFromCents(o.total_cents)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-red-600 mb-3">⚠️ Kritik Stok ({LOW_STOCK_THRESHOLD} adet ve altı)</h2>
          <div className="space-y-2">
            {lowStock && lowStock.length > 0 ? (
              lowStock.map((v, idx) => (
                <Link
                  key={idx}
                  href={`/admin/urunler/${v.product_id}/duzenle`}
                  className="flex justify-between gap-3 text-sm hover:underline"
                >
                  <span className="min-w-0 break-words">
                    {v.products?.name} ({v.label})
                  </span>
                  <span className="font-bold text-red-600 shrink-0 whitespace-nowrap">
                    {v.stock <= 0 ? 'Tükendi' : `${v.stock} adet`}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-carbon/50">Düşük stoklu ürün yok.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
