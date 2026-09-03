import 'server-only';
import { unstable_cache } from 'next/cache';
import { createSupabaseServerClient, createSupabaseAnonServerClient } from '@/lib/supabase/server';
import { dealFromRow } from '@/lib/pricing';
import type { ProductRow, ProductVariantRow, ProductForm } from '@/lib/supabase/types';

export interface ProductWithVariants extends ProductRow {
  product_variants: ProductVariantRow[];
  categories: { slug: string; name: string };
}

/**
 * Kategori listesi 5 dakika boyunca ISR benzeri önbelleklenir (Next.js Data Cache).
 * Bir admin kategori eklediğinde revalidateTag('categories') çağrılarak
 * önbellek anında geçersiz kılınır (bkz. src/app/api/admin/categories/route.ts).
 *
 * `createSupabaseAnonServerClient()` (çerez taşımayan) KASITLI olarak kullanılır:
 * `unstable_cache` içinde `cookies()`'e dokunan bir istemci (createSupabaseServerClient)
 * kullanılırsa Next.js build sırasında "Accessing Dynamic data sources inside a cache
 * scope is not supported" hatasıyla durur — kategoriler zaten herkese açık veri
 * olduğundan kullanıcı oturumuna hiç ihtiyaç yoktur.
 */
export const getCategories = unstable_cache(
  async () => {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, name, sort_order')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw new Error(`Kategoriler alınamadı: ${error.message}`);
    return data;
  },
  ['categories'],
  { revalidate: 300, tags: ['categories'] }
);

export const PRODUCTS_PAGE_SIZE = 24;

/**
 * Aktif ürünlerde GERÇEKTEN kullanılan form değerleri (toz/yaprak/yağ...).
 * Anasayfadaki form filtresi yalnızca bu değerler için gösterilir — henüz hiçbir
 * ürüne atanmamış bir form için boş sonuç veren bir çip gösterilmez.
 */
export const getAvailableForms = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase.from('products').select('form').eq('is_active', true).not('form', 'is', null);
    if (error) return [];
    return [...new Set((data ?? []).map((r) => r.form).filter((f): f is ProductForm => f != null))];
  },
  ['available-forms'],
  { revalidate: 300, tags: ['products'] }
);

interface GetProductsParams {
  // `?: string | undefined` (yalnızca `?: string` değil) — Next.js searchParams'tan
  // gelen değerler zaten `string | undefined` tipinde; exactOptionalPropertyTypes
  // altında bunu doğrudan geçirebilmek için hedef tipin de undefined'ı KABUL etmesi
  // gerekiyor (bkz. src/app/page.tsx çağrısı).
  categorySlug?: string | undefined;
  searchQuery?: string | undefined;
  /** Ürün formu (toz/tane/yaprak/yağ...) — migration 0013 `product_form` enum değeri. */
  form?: string | undefined;
  /** 1 tabanlı sayfa numarası. */
  page?: number | undefined;
}

export interface GetProductsResult {
  products: ProductWithVariants[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Ürünleri (aktif olanları) varyantlarıyla birlikte, SAYFALANMIŞ olarak getirir.
 * Arama, PostgreSQL "turkish" tam metin arama indeksini kullanır (bkz. migration 0001).
 * Bu fonksiyon kasıtlı olarak önbelleklenmez: stok/fiyat bilgisi her zaman güncel olmalı.
 *
 * `.range()` ile sayfalama ZORUNLUDUR: sayfalama olmadan bu sorgu, kataloğun
 * TAMAMINI (ileride 150+ ürün) tek seferde çeker — küçük bir katalogda fark
 * etmez ama büyüdükçe hem veritabanı hem de sayfa yükleme süresi doğrusal olarak
 * kötüleşir.
 */
export async function getProducts({ categorySlug, searchQuery, form, page = 1 }: GetProductsParams = {}): Promise<GetProductsResult> {
  const supabase = await createSupabaseServerClient();
  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * PRODUCTS_PAGE_SIZE;
  const to = from + PRODUCTS_PAGE_SIZE - 1;

  let query = supabase
    .from('products')
    .select('*, product_variants(*), categories!inner(slug, name)', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (categorySlug && categorySlug !== 'all') {
    query = query.eq('categories.slug', categorySlug);
  }

  if (form && form.trim().length > 0) {
    // Çağıran (page.tsx) değeri PRODUCT_FORMS'a karşı doğruluyor; burada enum'a cast güvenli.
    query = query.eq('form', form.trim() as ProductForm);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    // Arama çubuğu anlık önerisiyle (quickSearchProducts) AYNI eşleştirme:
    // ürün adı VEYA açıklamasında büyük/küçük harf duyarsız kısmi eşleşme.
    // Böylece açılır listede önerilen ürün, "tüm sonuçları gör" sayfasında da
    // görünür. `websearch_to_tsquery` yarım kelimeyi ("çör") eşleştirmediği için
    // tam metin aramadan buna geçildi (katalog küçük, ilike yeterince hızlı).
    // PostgREST `.or()` filtresini bozan karakterler temizlenir.
    const safe = searchQuery.replace(/[%_,()*\\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (safe.length > 0) {
      query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Ürünler alınamadı: ${error.message}`);

  const products = (data as unknown as ProductWithVariants[]).map((p) => ({
    ...p,
    product_variants: [...p.product_variants].sort((a, b) => a.sort_order - b.sort_order)
  }));

  const totalCount = count ?? 0;
  return {
    products,
    totalCount,
    page: safePage,
    pageSize: PRODUCTS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PRODUCTS_PAGE_SIZE))
  };
}

export interface QuickSearchItem {
  slug: string;
  name: string;
  imagePath: string;
  categoryName: string;
  minPriceCents: number;
}

/**
 * Arama çubuğu "anlık öneri" (typeahead) sonuçları. Ürün adı VE açıklamasında
 * büyük/küçük harf duyarsız kısmi eşleşme (ilike) yapar — kullanıcı "çör" yazınca
 * "Çörek Otu" önerilir (tam metin arama `tsquery`'si ön-ek eşleştirmediği için
 * yarım kelimede sonuç vermez). Açıklamada geçen eşleşmeler "benzer ürün" etkisi
 * verir. Anon istemci + küçük katalog (~200 satır) olduğundan hızlıdır; sonuç
 * önbelleklenmez (stok/fiyat güncel kalmalı).
 */
export async function quickSearchProducts(rawQuery: string, limit = 8): Promise<QuickSearchItem[]> {
  // PostgREST `.or()` filtresini bozan karakterleri (virgül, parantez) ve ilike
  // joker karakterlerini (%, _) temizle — kullanıcı girdisi doğrudan desene giriyor.
  const safe = rawQuery.replace(/[%_,()*\\]/g, ' ').replace(/\s+/g, ' ').trim();
  if (safe.length < 2) return [];

  const supabase = createSupabaseAnonServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('slug, name, image_path, categories!inner(name), product_variants(price_cents)')
    .eq('is_active', true)
    .or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
    .limit(limit * 2);

  if (error || !data) return [];

  const needle = safe.toLocaleLowerCase('tr');
  return (
    data as unknown as Array<{
      slug: string;
      name: string;
      image_path: string;
      categories: { name: string };
      product_variants: { price_cents: number }[];
    }>
  )
    .filter((p) => p.product_variants.length > 0)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      imagePath: p.image_path,
      categoryName: p.categories.name,
      minPriceCents: Math.min(...p.product_variants.map((v) => v.price_cents))
    }))
    // Adı eşleşenler önce (açıklamada geçen "benzer" ürünler sonra).
    .sort((a, b) => {
      const am = a.name.toLocaleLowerCase('tr').includes(needle) ? 0 : 1;
      const bm = b.name.toLocaleLowerCase('tr').includes(needle) ? 0 : 1;
      return am - bm;
    })
    .slice(0, limit);
}

export interface CartSuggestion {
  productId: string;
  slug: string;
  name: string;
  imagePath: string;
  variantId: string;
  variantLabel: string;
  priceCents: number;
  compareAtCents: number | null;
  deal: { buyQty: number; getQty: number; getPercent: number } | null;
}

/**
 * Sepet çekmecesindeki "kasa altı" öneri şeridi için ürünler. Aktif + en az bir
 * varyantı stokta olan ürünlerden; sepette OLAN ürünler hariç. Kampanyalı /
 * indirimli ürünler öne alınır (dürtüsel alışverişe uygun). Her ürün için en
 * ucuz stoktaki varyant "hızlı ekle" hedefi olarak döndürülür.
 */
export async function getCartSuggestions(excludeProductIds: string[], limit = 6): Promise<CartSuggestion[]> {
  const supabase = createSupabaseAnonServerClient();
  let query = supabase
    .from('products')
    .select(
      'id, slug, name, image_path, deal_buy_qty, deal_get_qty, deal_get_percent, product_variants(id, label, price_cents, compare_at_price_cents, stock, sort_order)'
    )
    .eq('is_active', true)
    .limit(48);

  if (excludeProductIds.length > 0) {
    query = query.not('id', 'in', `(${excludeProductIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  type Row = {
    id: string;
    slug: string;
    name: string;
    image_path: string;
    deal_buy_qty: number | null;
    deal_get_qty: number | null;
    deal_get_percent: number | null;
    product_variants: { id: string; label: string; price_cents: number; compare_at_price_cents: number | null; stock: number; sort_order: number }[];
  };

  const scored = (data as unknown as Row[])
    .map((p) => {
      const inStock = p.product_variants.filter((v) => v.stock > 0).sort((a, b) => a.sort_order - b.sort_order);
      if (inStock.length === 0) return null;
      const cheapest = inStock.reduce((min, v) => (v.price_cents < min.price_cents ? v : min), inStock[0]!);
      const deal = dealFromRow(p);
      const hasCompare = cheapest.compare_at_price_cents != null && cheapest.compare_at_price_cents > cheapest.price_cents;
      const score = (deal ? 2 : 0) + (hasCompare ? 1 : 0) + Math.random();
      return {
        score,
        item: {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          imagePath: p.image_path,
          variantId: cheapest.id,
          variantLabel: cheapest.label,
          priceCents: cheapest.price_cents,
          compareAtCents: cheapest.compare_at_price_cents,
          deal
        } satisfies CartSuggestion
      };
    })
    .filter((x): x is { score: number; item: CartSuggestion } => x !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.item);
}

/**
 * Ürün detay sayfasındaki "Benzer Ürünler" bloğu — aynı kategoriden, mevcut ürün
 * hariç, en az bir varyantı stokta olan aktif ürünler. Karışık sırayla `limit` adet.
 */
export async function getRelatedProducts(categorySlug: string, excludeProductId: string, limit = 4): Promise<ProductWithVariants[]> {
  const supabase = createSupabaseAnonServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*), categories!inner(slug, name)')
    .eq('is_active', true)
    .eq('categories.slug', categorySlug)
    .neq('id', excludeProductId)
    .limit(24);

  if (error || !data) return [];

  return (data as unknown as ProductWithVariants[])
    .map((p) => ({ ...p, product_variants: [...p.product_variants].sort((a, b) => a.sort_order - b.sort_order) }))
    .filter((p) => p.product_variants.some((v) => v.stock > 0))
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*), categories!inner(slug, name)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(`Ürün alınamadı: ${error.message}`);
  if (!data) return null;

  const product = data as unknown as ProductWithVariants;
  return { ...product, product_variants: [...product.product_variants].sort((a, b) => a.sort_order - b.sort_order) };
}
