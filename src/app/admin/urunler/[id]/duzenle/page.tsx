import { notFound } from 'next/navigation';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';
import { updateProductAction } from '@/app/admin/urunler/actions';

export const dynamic = 'force-dynamic';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const [{ data: categories }, { data: product }] = await Promise.all([
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase
      .from('products')
      .select(
        'id, name, slug, description, image_path, category_id, badges, is_active, form, origin, storage_info, allergen_info, shelf_life_note, product_variants(id, label, price_cents, compare_at_price_cents, stock, sort_order, lot_no, expiry_date)'
      )
      .eq('id', id)
      .single()
  ]);

  if (!product) notFound();

  const boundAction = updateProductAction.bind(null, product.id);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-primary mb-6">Ürünü Düzenle</h1>
      <ProductForm
        mode="edit"
        categories={categories ?? []}
        action={boundAction}
        initialProduct={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          imagePath: product.image_path,
          categoryId: product.category_id,
          badges: product.badges,
          isActive: product.is_active,
          form: product.form,
          origin: product.origin ?? '',
          storageInfo: product.storage_info ?? '',
          allergenInfo: product.allergen_info ?? '',
          shelfLifeNote: product.shelf_life_note ?? '',
          variants: [...product.product_variants]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((v) => ({
              id: v.id,
              label: v.label,
              price: (v.price_cents / 100).toFixed(2),
              compareAtPrice: v.compare_at_price_cents != null ? (v.compare_at_price_cents / 100).toFixed(2) : '',
              stock: String(v.stock),
              lotNo: v.lot_no ?? '',
              expiryDate: v.expiry_date ?? ''
            }))
        }}
      />
    </div>
  );
}
