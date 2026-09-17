'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { accountMutationRateLimit, safeRateLimit } from '@/lib/rate-limit';

export interface FavoriteActionResult {
  error: string | null;
  favorited?: boolean;
}

const idSchema = z.string().uuid();

/**
 * Favori aç/kapa — kullanıcının kendi oturumuyla çalışır (RLS `favorites_all_own`
 * asıl sınır). `accountMutationRateLimit` ile aynı kullanıcı-bazlı hız sınırı
 * (bkz. src/app/hesabim/adres-actions.ts — aynı desen).
 */
export async function toggleFavoriteAction(productId: string): Promise<FavoriteActionResult> {
  if (!idSchema.safeParse(productId).success) return { error: 'Geçersiz ürün.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Giriş yapmalısınız.' };

  const { success } = await safeRateLimit(accountMutationRateLimit, user.id);
  if (!success) return { error: 'Çok fazla işlem yaptınız. Lütfen bir dakika bekleyip tekrar deneyin.' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  let favorited: boolean;
  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
    if (error) return { error: 'İşlem başarısız, tekrar deneyin.' };
    favorited = false;
  } else {
    const { error } = await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
    if (error) return { error: 'İşlem başarısız, tekrar deneyin.' };
    favorited = true;
  }

  revalidatePath('/hesabim/favoriler');
  return { error: null, favorited };
}
