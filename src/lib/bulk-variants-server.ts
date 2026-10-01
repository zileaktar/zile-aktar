import 'server-only';
import type { createSupabaseServerClient } from '@/lib/supabase/server';
import type { VariantSnapshot } from '@/lib/bulk-variants';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

interface VariantRow {
  sku: string;
  label: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock: number;
  sort_order: number;
  products: { name: string; is_active: boolean; categories: { name: string } | null } | null;
}

/**
 * Tüm varyantların güncel fiyat/stok listesi (toplu güncelleme dışa aktarımı ve
 * önizleme karşılaştırması). Sıralama: aktif ürünler önce, sonra kategori + ürün adı
 * — Excel'de dosya mağazadaki düzene yakın görünsün.
 */
export async function loadVariantSnapshots(supabase: SupabaseServerClient): Promise<VariantSnapshot[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('sku, label, price_cents, compare_at_price_cents, stock, sort_order, products(name, is_active, categories(name))')
    .limit(10_000);
  if (error) throw error;

  const rows = ((data ?? []) as unknown as VariantRow[]).map<VariantSnapshot & { sortOrder: number }>((r) => ({
    sku: r.sku,
    categoryName: r.products?.categories?.name ?? '',
    productName: r.products?.name ?? '',
    label: r.label,
    priceCents: r.price_cents,
    compareAtCents: r.compare_at_price_cents,
    stock: r.stock,
    isActive: r.products?.is_active ?? false,
    sortOrder: r.sort_order
  }));

  rows.sort(
    (a, b) =>
      Number(b.isActive) - Number(a.isActive) ||
      a.categoryName.localeCompare(b.categoryName, 'tr') ||
      a.productName.localeCompare(b.productName, 'tr') ||
      a.sortOrder - b.sortOrder
  );
  return rows.map((r) => ({
    sku: r.sku,
    categoryName: r.categoryName,
    productName: r.productName,
    label: r.label,
    priceCents: r.priceCents,
    compareAtCents: r.compareAtCents,
    stock: r.stock,
    isActive: r.isActive
  }));
}
