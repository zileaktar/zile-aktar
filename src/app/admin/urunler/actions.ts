'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';
import { productInputSchema, type ProductInput } from '@/lib/validations/product';

export interface ProductFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/** Bir varyant girdisini `product_variants` ortak sütunlarına çevirir. */
function variantExtras(v: ProductInput['variants'][number]) {
  return {
    price_cents: v.priceCents,
    compare_at_price_cents: v.compareAtPriceCents ?? null,
    stock: v.stock,
    lot_no: v.lotNo?.trim() || null,
    expiry_date: v.expiryDate?.trim() || null
  };
}

/** Zod çıktısını `products` tablosu sütunlarına çevirir (insert + update ortak). */
function productColumns(input: ProductInput) {
  return {
    category_id: input.categoryId,
    slug: input.slug,
    name: input.name,
    description: input.description,
    image_path: input.imagePath,
    badges: input.badges,
    is_active: input.isActive,
    form: input.form,
    origin: input.origin || null,
    storage_info: input.storageInfo || 'Serin, kuru ve güneş görmeyen yerde, ağzı kapalı saklayınız.',
    allergen_info: input.allergenInfo || null,
    shelf_life_note: input.shelfLifeNote || null,
    deal_buy_qty: input.dealBuyQty ?? null,
    deal_get_qty: input.dealGetQty ?? null,
    deal_get_percent: input.dealGetPercent ?? null
  };
}

/**
 * Bu iki Server Action, sayfayı çağıran kullanıcının KENDİ oturum çerezli
 * istemcisini (service_role DEĞİL) kullanır — yazma işlemleri RLS'in
 * `products_staff_write` / `variants_staff_write` politikalarından geçer.
 * Böylece "admin panelinde de RLS geçerlidir" ilkesi korunur; rol kontrolü
 * hem burada (assertRole) hem veritabanında (RLS) iki kere yapılmış olur.
 */
async function requireStaffClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapmalısınız.');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  assertRole(profile?.role, 'moderator');
  return supabase;
}

function parseProductFormData(formData: FormData) {
  let variants: unknown;
  try {
    variants = JSON.parse(String(formData.get('variantsJson') ?? '[]'));
  } catch {
    variants = [];
  }

  const formValue = String(formData.get('form') ?? '').trim();
  const toIntOrNull = (v: FormDataEntryValue | null) => {
    const n = Number.parseInt(String(v ?? '').trim(), 10);
    return Number.isFinite(n) ? n : null;
  };

  return productInputSchema.safeParse({
    categoryId: formData.get('categoryId'),
    slug: formData.get('slug'),
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    imagePath: formData.get('imagePath'),
    badges: formData.getAll('badges'),
    isActive: formData.get('isActive') === 'on',
    form: formValue === '' ? null : formValue,
    origin: formData.get('origin') ?? '',
    storageInfo: formData.get('storageInfo') ?? '',
    allergenInfo: formData.get('allergenInfo') ?? '',
    shelfLifeNote: formData.get('shelfLifeNote') ?? '',
    dealBuyQty: toIntOrNull(formData.get('dealBuyQty')),
    dealGetQty: toIntOrNull(formData.get('dealGetQty')),
    dealGetPercent: toIntOrNull(formData.get('dealGetPercent')),
    variants
  });
}

function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createProductAction(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  let supabase;
  try {
    supabase = await requireStaffClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return { error: 'Formda hatalar var, lütfen kontrol edin.', fieldErrors: firstFieldErrors(parsed.error) };
  }
  const input = parsed.data;

  const { data: product, error: insertError } = await supabase
    .from('products')
    .insert(productColumns(input))
    .select('id')
    .single();

  if (insertError || !product) {
    return { error: insertError?.code === '23505' ? 'Bu slug zaten kullanılıyor.' : 'Ürün oluşturulamadı.' };
  }

  const { error: variantsError } = await supabase.from('product_variants').insert(
    input.variants.map((v, idx) => ({
      product_id: product.id,
      sku: `${input.slug.toUpperCase()}-${idx + 1}`,
      label: v.label,
      sort_order: idx + 1,
      ...variantExtras(v)
    }))
  );

  if (variantsError) {
    return { error: 'Ürün oluşturuldu ama varyantlar kaydedilemedi: ' + variantsError.message };
  }

  revalidatePath('/admin/urunler');
  revalidatePath('/');
  redirect('/admin/urunler');
}

export async function updateProductAction(productId: string, _prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  let supabase;
  try {
    supabase = await requireStaffClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return { error: 'Formda hatalar var, lütfen kontrol edin.', fieldErrors: firstFieldErrors(parsed.error) };
  }
  const input = parsed.data;

  const { error: updateError } = await supabase
    .from('products')
    .update(productColumns(input))
    .eq('id', productId);

  if (updateError) {
    return { error: updateError.code === '23505' ? 'Bu slug zaten kullanılıyor.' : 'Ürün güncellenemedi.' };
  }

  // Varyantlar (product_id, label) üzerinden UPSERT edilir: aynı etiketli bir
  // varyant varsa fiyat/stok günceller, yoksa yeni ekler. Formdan çıkarılan
  // (artık gönderilmeyen) eski varyantlar BURADA silinmez — bir varyant daha
  // önce bir siparişte kullanıldıysa veritabanı bunu zaten engeller
  // (order_items.variant_id -> ... ON DELETE RESTRICT); silme işlemi ayrı,
  // tek tek "Sil" düğmesiyle yapılır (bkz. deleteVariantAction).
  // SKU, sıra numarasına (idx) DEĞİL yalnızca ürün+etikete göre üretilir —
  // aksi halde aynı varyant, sıralaması değiştiğinde farklı bir SKU üretir ve
  // bu, ayrı bir UNIQUE(sku) kısıtına başka bir varyantla çakışıp anlaşılmaz
  // bir hataya yol açabilirdi. onConflict hedefi zaten (product_id, label)
  // olduğundan kimlik burada, sku'da değil, bu ikilide oturur.
  const { error: upsertError } = await supabase.from('product_variants').upsert(
    input.variants.map((v, idx) => ({
      product_id: productId,
      sku: `${input.slug.toUpperCase()}-${v.label.replace(/\s+/g, '').toUpperCase()}`.slice(0, 60),
      label: v.label,
      sort_order: idx + 1,
      ...variantExtras(v)
    })),
    { onConflict: 'product_id,label', ignoreDuplicates: false }
  );

  if (upsertError) {
    return { error: 'Ürün güncellendi ama varyantlar kaydedilemedi: ' + upsertError.message };
  }

  // '/admin/urunler' (liste) zaten geçersiz kılınıyordu; DÜZENLEME sayfasının
  // KENDİSİ geçersiz kılınmadığı için bir ürünü kaydedip hemen tekrar
  // düzenlemeye girdiğinizde eski veri görünüyordu — bu satır o eksikti.
  revalidatePath(`/admin/urunler/${productId}/duzenle`);
  revalidatePath('/admin/urunler');
  revalidatePath(`/urun/${input.slug}`);
  revalidatePath('/');
  redirect('/admin/urunler');
}

/**
 * Tek bir varyantı siler. Bu varyant geçmişte bir siparişte kullanıldıysa
 * (order_items FK'si) veritabanı silmeyi REDDEDER — burada bu durum
 * yakalanıp kullanıcıya anlaşılır bir mesaj olarak döndürülür, ham bir
 * veritabanı hatasıyla sayfa çökmez.
 */
export async function deleteVariantAction(variantId: string, productSlug: string): Promise<{ error: string | null }> {
  let supabase;
  try {
    supabase = await requireStaffClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
  if (error) {
    if (error.code === '23503') {
      return { error: 'Bu varyant geçmiş bir siparişte kullanıldığı için silinemez. Bunun yerine stoğunu 0 yapabilirsiniz.' };
    }
    return { error: 'Varyant silinemedi.' };
  }

  revalidatePath('/admin/urunler');
  revalidatePath(`/urun/${productSlug}`);
  return { error: null };
}
