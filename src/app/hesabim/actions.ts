'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { turkishPhoneRegex } from '@/lib/validations/checkout';

export interface ProfileFormState {
  error: string | null;
  saved?: boolean;
}

const profileSchema = z.object({
  fullName: z.string().trim().min(3, 'Ad soyad en az 3 karakter olmalı.').max(120),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || turkishPhoneRegex.test(v), 'Telefon 05xxxxxxxxx formatında olmalı.')
});

/**
 * Kullanıcı kendi profilini (ad, telefon) günceller. Kendi oturumuyla — RLS
 * `profiles_update_own` politikası (rol değiştirilemez, migration 0011) geçerli.
 */
export async function updateProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') ?? ''
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz bilgi.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Giriş yapmalısınız.' };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
    .eq('id', user.id);
  if (error) return { error: 'Kaydedilemedi, lütfen tekrar deneyin.' };

  revalidatePath('/hesabim');
  return { error: null, saved: true };
}
