'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';

const moderateSchema = z.object({
  reviewId: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'delete'])
});

/**
 * Yorum moderasyonu. Kullanıcının KENDİ oturumuyla çalışır — yazma RLS'in
 * `reviews_moderate_staff` / `reviews_delete_staff` politikalarından geçer.
 * Rol kontrolü ayrıca burada (assertRole) tekrar yapılır.
 */
export async function moderateReviewAction(formData: FormData): Promise<void> {
  const parsed = moderateSchema.safeParse({
    reviewId: formData.get('reviewId'),
    action: formData.get('action')
  });
  if (!parsed.success) return;
  const { reviewId, action } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single();
  assertRole(profile?.role, 'moderator');

  if (action === 'delete') {
    await supabase.from('reviews').delete().eq('id', reviewId);
  } else {
    await supabase
      .from('reviews')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', reviewId);
  }

  revalidatePath('/admin/yorumlar');
}
