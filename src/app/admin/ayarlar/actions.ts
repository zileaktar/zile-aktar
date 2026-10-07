'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';
import { assertAal2 } from '@/lib/admin-auth';
import { headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
import { sendTelegramMessage } from '@/lib/notify';
import { createCommonPaymentToken } from '@/lib/vakifbank';
import { env } from '@/lib/env.mjs';
import { LEGAL } from '@/lib/legal';
import { accountMutationRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';

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

export interface VakifbankTestResult {
  ok: boolean;
  message: string;
  /** Bankanın yanıtı (hata kodu + mesaj) — destek talebinde aynen iletilebilir. */
  bankResponse: string | null;
  /** Vercel'deki değerlerin BİÇİMİ — değerlerin kendisi (ve şifre) asla gösterilmez. */
  config: string[];
}

/** "000000011023629" → "15 hane, …3629" — yalnız biçim kontrolü için. */
function describeValue(value: string, keepEnd: number): string {
  const trimmed = value.trim();
  const notes: string[] = [`${value.length} karakter`];
  if (trimmed.length !== value.length) notes.push('⚠️ başında/sonunda BOŞLUK var');
  if (/^\d+$/.test(trimmed)) notes.push('yalnız rakam');
  return `${notes.join(', ')}, sonu …${trimmed.slice(-keepEnd)}`;
}

/**
 * VakıfBank canlı bağlantı testi (Ayarlar). Bankada 1,00 TL'lik bir ödeme OTURUMU
 * açmayı dener (CreateTokenCPY) — kart girilmediği için PARA ÇEKİLMEZ, oturum
 * kullanılmadan süresi dolar. Sipariş vermeden "bilgiler doğru mu / banka hesabı
 * açtı mı?" sorusunu yanıtlar. Şifre ve tam numaralar ASLA döndürülmez.
 */
export async function testVakifbankConnectionAction(): Promise<VakifbankTestResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Giriş yapmalısınız.', bankResponse: null, config: [] };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  try {
    assertRole(profile?.role, 'admin');
    await assertAal2(supabase);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Yetkisiz işlem.', bankResponse: null, config: [] };
  }
  const { success } = await safeRateLimit(accountMutationRateLimit, `vakifbank-test:${user.id}`, { failClosed: true });
  if (!success) return { ok: false, message: 'Çok fazla deneme. Bir dakika sonra tekrar deneyin.', bankResponse: null, config: [] };

  const host = (u: string) => {
    try {
      return new URL(u).host;
    } catch {
      return `geçersiz adres: ${u.slice(0, 40)}`;
    }
  };
  const label = (h: string) => (h.includes('test') ? '⚠️ TEST' : 'CANLI');
  const apiHost = host(env.VAKIFBANK_API_BASE_URL);
  const vposHost = host(env.VAKIFBANK_VPOS_BASE_URL);
  const pageHost = host(env.VAKIFBANK_PAYMENT_PAGE_URL);
  const config = [
    `VAKIFBANK_API_BASE_URL: ${label(apiHost)} (${apiHost})`,
    `VAKIFBANK_VPOS_BASE_URL (iptal/iade): ${label(vposHost)} (${vposHost})`,
    `VAKIFBANK_PAYMENT_PAGE_URL: ${label(pageHost)} (${pageHost})`,
    `Üye işyeri no: ${describeValue(env.VAKIFBANK_MERCHANT_NUMBER, 4)}${env.VAKIFBANK_MERCHANT_NUMBER.trim().length !== 15 ? ' — ⚠️ VakıfBank 15 hane bekler (başına 0 ekleyerek tamamlayın)' : ''}`,
    `Terminal no: ${env.VAKIFBANK_TERMINAL_NUMBER.trim().slice(0, 2)}…, ${describeValue(env.VAKIFBANK_TERMINAL_NUMBER, 2)}`,
    `API şifresi: ${env.VAKIFBANK_PASSWORD.length} karakter${env.VAKIFBANK_PASSWORD.trim().length !== env.VAKIFBANK_PASSWORD.length ? ' — ⚠️ başında/sonunda BOŞLUK var' : ''}`
  ];

  try {
    const returnUrl = `${env.NEXT_PUBLIC_APP_URL}/odeme-basarisiz`;
    const result = await createCommonPaymentToken({
      orderId: `TEST-${Date.now()}`,
      amount: '1.00',
      clientIp: getClientIp(await headers()),
      successUrl: returnUrl,
      failUrl: returnUrl,
      // Boş telefon/e-posta bankada "alan formatı" (1001) hatası veriyordu — mağazanın
      // kendi iletişim bilgileri gönderilir (gerçek siparişte müşterininki gider).
      cardHoldersName: LEGAL.markaAdi,
      buyerPhone: `90${LEGAL.telefon.replace(/\D/g, '').replace(/^0/, '')}`,
      buyerEmail: LEGAL.eposta
    });
    const bankResponse = `ErrorCode: ${result.ErrorCode ?? '—'} · ${result.ResponseMessage ?? '—'}`;
    if (result.ErrorCode === '0000' && result.PaymentToken) {
      return {
        ok: true,
        message: 'Bağlantı BAŞARILI — banka ödeme oturumu açtı. Kartla ödeme çalışmaya hazır. (Test oturumu kullanılmadan düşer, para çekilmez.)',
        bankResponse,
        config
      };
    }
    const hint = apiHost.includes('test')
      ? 'Site bankanın TEST sunucusuna bağlanıyor — gerçek üye işyeri bilgileri orada tanınmaz. Vercel → Environment Variables → VAKIFBANK_API_BASE_URL (Production) değerini canlı adrese çevirip yeniden yayınlayın.'
      : result.ErrorCode === '5023'
        ? 'Banka üye işyeri numarasını Ortak Ödeme servisinde bulamıyor. Numara biçimi doğruysa (15 hane) üye işyerinin Ortak Ödeme için canlıda tanımlanması gerekir — bankaya bu kodla yazın.'
        : result.ErrorCode === '2005' || result.ErrorCode === '5001'
          ? 'Kimlik doğrulama başarısız: API şifresi ya da üye işyeri/terminal eşleşmesi hatalı.'
          : result.ErrorCode === '5002'
            ? 'Üye işyeri tanımı eksik veya pasif — banka tarafında aktifleştirilmeli.'
            : 'Banka isteği reddetti — hata kodunu bankaya iletin.';
    return { ok: false, message: hint, bankResponse, config };
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'vakifbank-test' } });
    return {
      ok: false,
      message: 'Bankaya ulaşılamadı (ağ hatası ya da banka güvenlik duvarı). Biraz sonra tekrar deneyin.',
      bankResponse: err instanceof Error ? err.message.slice(0, 200) : null,
      config
    };
  }
}
