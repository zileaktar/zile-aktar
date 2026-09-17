import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getFavoriteProducts } from '@/lib/data/favorites';
import { ProductCard } from '@/components/product/ProductCard';

export const metadata: Metadata = { title: 'Favorilerim', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/giris?redirectTo=/hesabim/favoriler');

  const products = await getFavoriteProducts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-2xl text-primary mb-2">Favorilerim</h1>
      <p className="text-sm text-carbon/60 mb-8">Kalp ikonuyla işaretlediğiniz ürünler burada listelenir.</p>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🤍</div>
          <p className="font-semibold text-lg text-primary">Henüz favori ürününüz yok</p>
          <p className="text-carbon/50 text-sm mt-1">Beğendiğiniz ürünlerdeki kalp ikonuna tıklayarak buraya ekleyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isFavorited loggedIn />
          ))}
        </div>
      )}
    </div>
  );
}
