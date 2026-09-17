import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ProductWithVariants } from '@/lib/data/products';

export interface FavoritesContext {
  loggedIn: boolean;
  favoriteIds: Set<string>;
}

/**
 * Ürün kartlarında kalp ikonunu doğru göstermek için: kullanıcı giriş yapmış
 * mı ve hangi ürünleri favorilemiş. Tek sorguda, sayfa başına bir kez çağrılır
 * (her karta ayrı istek atılmaz).
 */
export async function getFavoritesContext(): Promise<FavoritesContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { loggedIn: false, favoriteIds: new Set() };

  const { data } = await supabase.from('favorites').select('product_id').eq('user_id', user.id);
  return { loggedIn: true, favoriteIds: new Set((data ?? []).map((r) => r.product_id)) };
}

/** /hesabim/favoriler sayfası — kullanıcının favorilediği ürünler, varyantlarıyla. */
export async function getFavoriteProducts(): Promise<ProductWithVariants[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('favorites')
    .select('created_at, products!inner(*, product_variants(*), categories!inner(slug, name))')
    .eq('user_id', user.id)
    .eq('products.is_active', true)
    .order('created_at', { ascending: false });

  type Row = { products: ProductWithVariants };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r.products,
    product_variants: [...r.products.product_variants].sort((a, b) => a.sort_order - b.sort_order)
  }));
}
