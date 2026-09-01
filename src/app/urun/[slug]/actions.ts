'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { reviewInputSchema } from '@/lib/validations/review';

export interface ReviewFormState {
  error: string | null;
  success?: boolean;
}

/**
 * Ürün yorumu gönderimi. Giriş zorunlu. Yorum `status='pending'` ile eklenir —
 * moderatör onayına kadar sitede görünmez. RLS `reviews_insert_own` politikası
 * kullanıcının yalnızca kendi adına yorum eklemesini garanti eder; buradaki
 * kontroller (giriş, tekrar) ek katmandır.
 */
export async function submitReviewAction(
  slug: string,
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const parsed = reviewInputSchema.safeParse({
    productId: formData.get('productId'),
    rating: formData.get('rating'),
    title: formData.get('title') ?? '',
    body: formData.get('body')
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz yorum.' };
  }
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Yorum yapmak için giriş yapmalısınız.' };

  // Yazar adı anlık görüntüsü — RLS başka kullanıcının profilini okutmadığından
  // yorum satırına kopyalanır (bkz. migration 0014).
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const authorName = (profile?.full_name || '').trim() || 'Zile Aktar Müşterisi';

  // "Doğrulanmış alışveriş" bağlantısı (opsiyonel).
  const { data: purchase } = await supabase
    .from('order_items')
    .select('order_id, orders!inner(user_id, status)')
    .eq('product_id', input.productId)
    .eq('orders.user_id', user.id)
    .in('orders.status', ['paid', 'shipped', 'delivered'])
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('reviews').insert({
    product_id: input.productId,
    user_id: user.id,
    order_id: (purchase as { order_id: string } | null)?.order_id ?? null,
    rating: input.rating,
    title: input.title || null,
    body: input.body,
    author_name: authorName
  });

  if (error) {
    if (error.code === '23505') return { error: 'Bu ürüne zaten bir yorum yaptınız.' };
    return { error: 'Yorum kaydedilemedi, lütfen tekrar deneyin.' };
  }

  revalidatePath(`/urun/${slug}`);
  return { error: null, success: true };
}
