import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';
import { createProductAction } from '@/app/admin/urunler/actions';

export default async function NewProductPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: categories } = await supabase.from('categories').select('id, name').order('sort_order');

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-primary mb-6">Yeni Ürün Ekle</h1>
      <ProductForm mode="create" categories={categories ?? []} action={createProductAction} />
    </div>
  );
}
