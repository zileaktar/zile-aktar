'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';

export interface SettingsFormState {
  error: string | null;
}

const updateLogoSchema = z.object({
  logoPath: z.string().trim().min(1, 'Bir logo görseli yükleyin.')
});

/**
 * Bu Server Action, ürün formlarındaki gibi kullanıcının KENDİ oturumuyla
 * (service_role DEĞİL) çalışır — yazma, RLS'in `site_settings_staff_update`
 * politikasından geçer. Görsel önce /api/upload/presigned-url ile Storage'a
 * yüklenir (bkz. LogoSettingsForm.tsx), buraya yalnızca sonuç yolu gelir.
 */
export async function updateLogoAction(_prevState: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Giriş yapmalısınız.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  try {
    assertRole(profile?.role, 'admin');
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const parsed = updateLogoSchema.safeParse({ logoPath: formData.get('logoPath') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek.' };
  }

  const { error } = await supabase.from('site_settings').update({ logo_path: parsed.data.logoPath }).eq('id', true);
  if (error) {
    return { error: 'Logo kaydedilemedi.' };
  }

  revalidateTag('site-settings');
  revalidatePath('/', 'layout');
  revalidatePath('/admin/ayarlar');
  return { error: null };
}

const bankInfoSchema = z.object({
  accountHolder: z.string().trim().max(120).optional().default(''),
  bankName: z.string().trim().max(120).optional().default(''),
  // TR + 24 rakam (boşluklar temizlenir). Boş bırakılabilir (havale kapalı demektir).
  iban: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, '').toUpperCase())
    .refine((v) => v === '' || /^TR\d{24}$/.test(v), 'Geçerli bir TR IBAN girin (TR + 24 rakam).'),
  note: z.string().trim().max(400).optional().default('')
});

/** Havale/EFT banka bilgisi — checkout başarı sayfasında müşteriye gösterilir. */
export async function updateBankInfoAction(_prevState: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Giriş yapmalısınız.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  try {
    assertRole(profile?.role, 'admin');
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const parsed = bankInfoSchema.safeParse({
    accountHolder: formData.get('accountHolder'),
    bankName: formData.get('bankName'),
    iban: formData.get('iban'),
    note: formData.get('note')
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek.' };
  }
  const { accountHolder, bankName, iban, note } = parsed.data;

  const { error } = await supabase
    .from('site_settings')
    .update({
      bank_account_holder: accountHolder || null,
      bank_name: bankName || null,
      bank_iban: iban || null,
      bank_note: note || null
    })
    .eq('id', true);
  if (error) return { error: 'Banka bilgileri kaydedilemedi.' };

  revalidateTag('site-settings');
  revalidatePath('/admin/ayarlar');
  return { error: null };
}
