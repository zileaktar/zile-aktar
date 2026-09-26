'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';
import { assertAal2 } from '@/lib/admin-auth';
import { sendTelegramMessage } from '@/lib/notify';

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
    await assertAal2(supabase);
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
    await assertAal2(supabase);
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

export interface TestNotificationResult {
  ok: boolean;
  message: string;
}

/**
 * Telegram bildirim ayarlarını uçtan uca dener: canlı sunucudaki gerçek ortam
 * değişkenleriyle bir test mesajı gönderir ve sonucu (ya da tam sebebi)
 * ekrana döndürür. Anahtarın kendisi ASLA döndürülmez.
 */
export async function sendTestNotificationAction(): Promise<TestNotificationResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Giriş yapmalısınız.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  try {
    assertRole(profile?.role, 'admin');
    await assertAal2(supabase);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const result = await sendTelegramMessage(
    '🔔 <b>Test bildirimi</b>\nZile Aktar yönetim panelinden gönderildi. Bu mesajı görüyorsanız bildirimler çalışıyor.'
  );

  if (result.ok) return { ok: true, message: 'Test mesajı gönderildi — telefonunuzu kontrol edin.' };
  if (result.reason === 'not_configured') {
    return {
      ok: false,
      message: `Bildirim ayarları canlı sunucuda tanımlı değil: ${result.missing.join(', ')}. Vercel'de değişken adını ve "Production" ortamının seçili olduğunu kontrol edip yeniden deploy edin.`
    };
  }
  if (result.reason === 'telegram_error') {
    const hint =
      result.status === 401
        ? 'Bot anahtarı hatalı (Vercel\'deki TELEGRAM_BOT_TOKEN değerini yeniden girin).'
        : result.status === 400 || result.status === 403
          ? 'Sohbet numarası hatalı ya da bot engellenmiş/başlatılmamış (bota Telegram\'dan "Başlat" deyin, TELEGRAM_CHAT_ID\'yi kontrol edin).'
          : 'Telegram isteği reddetti.';
    return { ok: false, message: `${hint} (Telegram: HTTP ${result.status} ${result.description})` };
  }
  return { ok: false, message: `Telegram'a bağlanılamadı (${result.kind}). Biraz sonra tekrar deneyin.` };
}
