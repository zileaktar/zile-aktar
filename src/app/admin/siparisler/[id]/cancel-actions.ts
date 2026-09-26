'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';
import { assertAal2 } from '@/lib/admin-auth';
import { accountMutationRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { cancelOrRefundOrder } from '@/lib/order-cancel';

export interface CancelOrderFormState {
  ok: boolean;
  message: string | null;
}

const cancelSchema = z.object({
  orderId: z.string().uuid(),
  // Onay kutusu işaretlenmeden işlem yapılmaz (yanlışlıkla tıklamaya karşı).
  confirm: z.literal('on', { errorMap: () => ({ message: 'Onay kutusunu işaretleyin.' }) }),
  restock: z.enum(['on']).optional()
});

/**
 * Sipariş iptali / ücret iadesi. PARA HAREKETİ olduğu için yalnızca ADMIN
 * (moderatör değil) + iki adımlı doğrulama (AAL2). Hız sınırı fail-closed.
 */
export async function cancelOrderAction(
  _prev: CancelOrderFormState,
  formData: FormData
): Promise<CancelOrderFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Giriş yapmalısınız.' };

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    assertRole(profile?.role, 'admin');
    await assertAal2(supabase);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const parsed = cancelSchema.safeParse({
    orderId: formData.get('orderId'),
    confirm: formData.get('confirm') ?? undefined,
    restock: formData.get('restock') ?? undefined
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Geçersiz istek.' };
  }

  const { success } = await safeRateLimit(accountMutationRateLimit, `order-cancel:${user.id}`, { failClosed: true });
  if (!success) return { ok: false, message: 'Çok fazla deneme. Bir dakika sonra tekrar deneyin.' };

  const result = await cancelOrRefundOrder({
    orderId: parsed.data.orderId,
    restock: parsed.data.restock === 'on',
    clientIp: getClientIp(headers())
  });

  revalidatePath(`/admin/siparisler/${parsed.data.orderId}`);
  revalidatePath('/admin/siparisler');
  return { ok: result.ok, message: result.message };
}
