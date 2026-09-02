import 'server-only';
import { unstable_cache } from 'next/cache';
import { createSupabaseServerClient, createSupabaseAnonServerClient } from '@/lib/supabase/server';
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
