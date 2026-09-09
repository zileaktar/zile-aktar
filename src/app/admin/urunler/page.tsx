import Link from 'next/link';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { formatPriceFromCents } from '@/lib/format';
import { ProductListFilters } from '@/components/admin/ProductListFilters';

/**
 * Ürün LİSTESİ + arama/filtre çubuğu. Filtre durumu URL arama parametrelerinde
 * (`q`, `kategori`, `durum`, `stok`, `sirala`) tutulur; ad/kategori/durum
 * filtreleri veritabanında, toplam-stok bazlı filtre ve sıralama ise (varyant
 * toplamı PostgREST'te doğrudan filtrelenemediği için) bellekte uygulanır.
 * Oluşturma/düzenleme "/admin/urunler/yeni" ve "/admin/urunler/[id]/duzenle"
 * sayfalarında (bkz. src/app/admin/urunler/actions.ts).
 */
// Stok, sipariş verildikçe (create_order) değişir — liste her zaman canlı olmalı.
export const dynamic = 'force-dynamic';

interface AdminProductsPageProps {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    durum?: string;
    stok?: string;
    sirala?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { q, kategori, durum, stok, sirala } = await searchParams;
  const supabase = createSupabaseServiceRoleClient();

  // Kategori filtresi listesi — admin pasif kategorileri de düzenlediği için hepsi.
  const { data: categories } = await supabase.from('categories').select('id, name').order('sort_order');
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  let query = supabase
    .from('products')
    .select('id, name, slug, is_active, category_id, product_variants(label, price_cents, stock)')
    .limit(200);

  const search = q?.trim();
  if (search) query = query.ilike('name', `%${search.replace(/[%_,()*\\]/g, ' ')}%`);
  if (kategori) query = query.eq('category_id', kategori);
  if (durum === 'aktif') query = query.eq('is_active', true);
  else if (durum === 'pasif') query = query.eq('is_active', false);
  query = sirala === 'isim' ? query.order('name', { ascending: true }) : query.order('created_at', { ascending: false });

  const { data: rawProducts } = await query;

  let products = (rawProducts ?? []).map((p) => {
    const totalStock = p.product_variants.reduce((s, v) => s + v.stock, 0);
    return { ...p, totalStock };
  });

  if (stok === 'var') products = products.filter((p) => p.totalStock > 0);
  else if (stok === 'azalan') products = products.filter((p) => p.totalStock > 0 && p.totalStock < 10);
  else if (stok === 'yok') products = products.filter((p) => p.totalStock === 0);

  if (sirala === 'stok-az') products = [...products].sort((a, b) => a.totalStock - b.totalStock);

  const hasFilter = Boolean(search || kategori || durum || stok || sirala);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-primary">Ürünler</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-carbon/50">
            {products.length} ürün{hasFilter ? ' (filtreli)' : ''}
          </span>
          <Link
            href="/admin/urunler/yeni"
            className="touch-target bg-primary hover:bg-primary-dark text-white text-sm font-bold px-4 py-2.5 rounded-full transition"
          >
            + Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      <ProductListFilters categories={categories ?? []} />

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-carbon/50">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Varyantlar</th>
              <th className="px-4 py-3">Toplam Stok</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-carbon/50">
                  Filtreye uyan ürün bulunamadı.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-carbon/60">{categoryNameById.get(p.category_id) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-carbon/10 text-carbon/50'
                      }`}
                    >
                      {p.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-carbon/60">
                    {p.product_variants.map((v) => `${v.label}: ${formatPriceFromCents(v.price_cents)}`).join(' · ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.totalStock < 10 ? 'font-bold text-red-600' : 'text-carbon/70'}>{p.totalStock}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/urunler/${p.id}/duzenle`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
