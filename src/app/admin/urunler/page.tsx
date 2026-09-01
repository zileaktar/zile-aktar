import Link from 'next/link';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { formatPriceFromCents } from '@/lib/format';

/**
 * Ürün LİSTESİ. Oluşturma/düzenleme "/admin/urunler/yeni" ve
 * "/admin/urunler/[id]/duzenle" sayfalarında — Zod (productInputSchema) ->
 * RBAC (assertRole) -> kullanıcının KENDİ oturumuyla RLS'ten geçen yazma
 * (bkz. src/app/admin/urunler/actions.ts) zincirini izler. Görsel yükleme
 * akışı uçtan uca çalışır: src/app/api/upload/presigned-url/route.ts.
 */
// Stok, sipariş verildikçe (create_order) değişir — liste her zaman canlı olmalı.
export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const supabase = createSupabaseServiceRoleClient();
  // .limit() kasıtlı: yüzlerce ürüne çıkıldığında bu liste sınırsız büyümesin diye
  // bir üst sınır konuldu. Katalog bu sınırı aştığında burada da anasayfadakine
  // benzer gerçek bir sayfalama (bkz. src/lib/data/products.ts) eklenmelidir.
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, is_active, product_variants(label, price_cents, stock)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-primary">Ürünler</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-carbon/50">{products?.length ?? 0} ürün</span>
          <Link href="/admin/urunler/yeni" className="touch-target bg-primary hover:bg-primary-dark text-white text-sm font-bold px-4 py-2.5 rounded-full transition">
            + Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-carbon/50">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Varyantlar</th>
              <th className="px-4 py-3">Toplam Stok</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {products?.map((p) => {
              const totalStock = p.product_variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-carbon/10 text-carbon/50'}`}>
                      {p.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-carbon/60">
                    {p.product_variants.map((v) => `${v.label}: ${formatPriceFromCents(v.price_cents)}`).join(' · ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={totalStock < 10 ? 'font-bold text-red-600' : 'text-carbon/70'}>{totalStock}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/urunler/${p.id}/duzenle`} className="text-xs font-semibold text-primary hover:underline">
                      Düzenle
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
