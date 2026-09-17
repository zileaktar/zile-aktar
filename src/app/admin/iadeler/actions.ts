'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';

const moderateSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'completed']),
  adminNote: z.string().trim().max(1000).optional().default('')
});

/**
 * İade talebi karara bağlama. Kullanıcının KENDİ oturumuyla çalışır — yazma
 * RLS'in `return_requests_update_staff` politikasından geçer. Rol kontrolü
 * ayrıca burada (assertRole) tekrar yapılır (bkz. admin/yorumlar/actions.ts
 * ile aynı desen).
 */
export async function updateReturnRequestAction(formData: FormData): Promise<void> {
  const parsed = moderateSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    adminNote: formData.get('adminNote') ?? ''
  });
  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single();
  assertRole(profile?.role, 'moderator');

  await supabase
    .from('return_requests')
    .update({ status: parsed.data.status, admin_note: parsed.data.adminNote, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.requestId);

  revalidatePath('/admin/iadeler');
}
