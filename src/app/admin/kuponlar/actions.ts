'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';

export interface CouponActionState {
  error: string | null;
  ok?: boolean;
}

const createSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Kod en az 3 karakter olmalı.')
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'Kod yalnızca harf, rakam, tire ve alt çizgi içerebilir.'),
    type: z.enum(['percent', 'fixed', 'free_shipping']),
    // Yüzde: 1-100 · Sabit: TL (kuruşa çevrilir) · Ücretsiz kargo: kullanılmaz.
    valueRaw: z.string().trim().optional().default(''),
    minCartTl: z.string().trim().optional().default(''),
    maxUses: z.string().trim().optional().default(''),
    perUserOnce: z.boolean().default(false),
    expiresAt: z.string().trim().optional().default('')
  })
  .superRefine((d, ctx) => {
    if (d.type === 'percent') {
      const n = Number(d.valueRaw.replace(',', '.'));
      if (!Number.isFinite(n) || n < 1 || n > 100)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['valueRaw'], message: 'Yüzde 1 ile 100 arası olmalı.' });
    } else if (d.type === 'fixed') {
      const n = Number(d.valueRaw.replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['valueRaw'], message: 'Geçerli bir TL tutarı girin.' });
    }
  });

function tlToCents(raw: string): number {
  const n = Number(raw.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapmalısınız.');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  assertRole(profile?.role, 'moderator');
  return supabase;
}

export async function createCouponAction(_prev: CouponActionState, formData: FormData): Promise<CouponActionState> {
  let supabase;
  try {
    supabase = await requireStaff();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const parsed = createSchema.safeParse({
    code: formData.get('code'),
    type: formData.get('type'),
    valueRaw: formData.get('valueRaw') ?? '',
    minCartTl: formData.get('minCartTl') ?? '',
    maxUses: formData.get('maxUses') ?? '',
    perUserOnce: formData.get('perUserOnce') === 'on',
    expiresAt: formData.get('expiresAt') ?? ''
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formda hata var.' };
  const d = parsed.data;

  const value =
    d.type === 'percent'
      ? Math.round(Number(d.valueRaw.replace(',', '.')))
      : d.type === 'fixed'
        ? tlToCents(d.valueRaw)
        : 0;

  const maxUsesNum = d.maxUses ? Number.parseInt(d.maxUses, 10) : null;

  const { error } = await supabase.from('coupons').insert({
    code: d.code.toUpperCase(),
    type: d.type,
    value,
    min_cart_cents: d.minCartTl ? tlToCents(d.minCartTl) : 0,
    max_uses: maxUsesNum && maxUsesNum > 0 ? maxUsesNum : null,
    per_user_once: d.perUserOnce,
    expires_at: d.expiresAt ? new Date(d.expiresAt).toISOString() : null
  });

  if (error) {
    return { error: error.code === '23505' ? 'Bu kod zaten var.' : 'Kupon oluşturulamadı: ' + error.message };
  }

  revalidatePath('/admin/kuponlar');
  return { error: null, ok: true };
}

export async function toggleCouponAction(id: string): Promise<CouponActionState> {
  let supabase;
  try {
    supabase = await requireStaff();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }
  const { data: current } = await supabase.from('coupons').select('is_active').eq('id', id).single();
  if (!current) return { error: 'Kupon bulunamadı.' };
  const { error } = await supabase.from('coupons').update({ is_active: !current.is_active }).eq('id', id);
  if (error) return { error: 'Durum değiştirilemedi.' };
  revalidatePath('/admin/kuponlar');
  return { error: null, ok: true };
}

export async function deleteCouponAction(id: string): Promise<CouponActionState> {
  let supabase;
  try {
    supabase = await requireStaff();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) return { error: 'Kupon silinemedi.' };
  revalidatePath('/admin/kuponlar');
  return { error: null, ok: true };
}
