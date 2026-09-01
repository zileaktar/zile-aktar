import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface PublicReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author_name: string;
  created_at: string;
}

/** Bir ürünün ONAYLI yorumları + ortalama puan (RLS: status='approved' herkese açık). */
export async function getProductReviews(productId: string): Promise<{
  reviews: PublicReview[];
  count: number;
  average: number;
}> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, title, body, author_name, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  const reviews = (data ?? []) as PublicReview[];
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  return { reviews, count, average };
}

/**
 * Giriş yapmış kullanıcı için yorum bağlamı: daha önce yorum yaptı mı, bu ürünü
 * satın aldı mı ("doğrulanmış alışveriş" rozeti + order_id bağlama için).
 */
export async function getReviewContext(productId: string): Promise<{
  isLoggedIn: boolean;
  hasReviewed: boolean;
  reviewStatus: 'pending' | 'approved' | 'rejected' | null;
  verifiedOrderId: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { isLoggedIn: false, hasReviewed: false, reviewStatus: null, verifiedOrderId: null };

  const [{ data: existing }, { data: purchase }] = await Promise.all([
    supabase.from('reviews').select('status').eq('product_id', productId).eq('user_id', user.id).maybeSingle(),
    supabase
      .from('order_items')
      .select('order_id, orders!inner(user_id, status)')
      .eq('product_id', productId)
      .eq('orders.user_id', user.id)
      .in('orders.status', ['paid', 'shipped', 'delivered'])
      .limit(1)
      .maybeSingle()
  ]);

  return {
    isLoggedIn: true,
    hasReviewed: Boolean(existing),
    reviewStatus: existing?.status ?? null,
    verifiedOrderId: (purchase as { order_id: string } | null)?.order_id ?? null
  };
}
