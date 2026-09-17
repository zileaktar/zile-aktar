'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { accountMutationRateLimit, safeRateLimit } from '@/lib/rate-limit';
import { returnRequestSchema, type ReturnRequestInput } from '@/lib/validations/return-request';

export interface ReturnRequestActionResult {
  error: string | null;
}

const idSchema = z.string().uuid();

/**
 * İade talebi oluşturur — kullanıcının kendi oturumuyla çalışır. Asıl sınır
 * RLS `return_requests_insert_own` politikasıdır: siparişin gerçekten bu
 * kullanıcıya ait ve `delivered` durumda olduğunu, `status`'ün 'pending'
 * gönderildiğini DB seviyesinde zorlar (bkz. migration 0033) — bu action
 * yalnızca form doğrulaması + hız sınırı ekler.
 */
export async function createReturnRequestAction(
  orderId: string,
  input: ReturnRequestInput
): Promise<ReturnRequestActionResult> {
  if (!idSchema.safeParse(orderId).success) return { error: 'Geçersiz sipariş.' };
  const parsed = returnRequestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz bilgi.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Giriş yapmalısınız.' };

  const { success } = await safeRateLimit(accountMutationRateLimit, user.id);
  if (!success) return { error: 'Çok fazla işlem yaptınız. Lütfen bir dakika bekleyip tekrar deneyin.' };

  const { error } = await supabase.from('return_requests').insert({
    order_id: orderId,
    user_id: user.id,
    reason: parsed.data.reason,
    detail: parsed.data.detail
  });
  if (error) return { error: 'Talep oluşturulamadı. Siparişin teslim edilmiş olduğundan emin olun.' };

  revalidatePath(`/hesabim/siparislerim/${orderId}`);
  return { error: null };
}
