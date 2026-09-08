'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { accountMutationRateLimit, safeRateLimit } from '@/lib/rate-limit';
import { savedAddressSchema, type SavedAddressInput } from '@/lib/validations/address';

export interface AddressActionResult {
  error: string | null;
}

const idSchema = z.string().uuid();
const RATE_LIMIT_MESSAGE = 'Çok fazla işlem yaptınız. Lütfen bir dakika bekleyip tekrar deneyin.';

/**
 * Adres CRUD action'ları — hepsi kullanıcının kendi oturumuyla çalışır; asıl
 * sınır RLS `addresses_all_own` politikasıdır. `.eq('user_id', ...)` filtreleri
 * savunma derinliği içindir. Tek varsayılan adres garantisini DB trigger'ı
 * (`trg_addresses_single_default`, migration 0029) sağlar.
 *
 * `authorize()`: oturum + kullanıcı bazlı hız sınırı (dakikada 20 yazma).
 * Server Action'larda CSRF koruması framework içinde yerleşiktir.
 */
async function authorize() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Giriş yapmalısınız.', supabase, user: null };
  const { success } = await safeRateLimit(accountMutationRateLimit, user.id);
  if (!success) return { ok: false as const, error: RATE_LIMIT_MESSAGE, supabase, user: null };
  return { ok: true as const, error: null, supabase, user };
}

function toRow(input: SavedAddressInput) {
  return {
    label: input.label,
    full_name: input.fullName,
    phone: input.phone,
    city: input.city,
    district: input.district,
    address_line: input.addressLine
  };
}

function revalidateAddressViews() {
  revalidatePath('/hesabim');
  revalidatePath('/hesabim/adreslerim');
  revalidatePath('/checkout');
}

export async function createAddressAction(input: SavedAddressInput): Promise<AddressActionResult> {
  const parsed = savedAddressSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz adres bilgisi.' };

  const ctx = await authorize();
  if (!ctx.ok) return { error: ctx.error };

  // Kullanıcının ilk adresi otomatik olarak varsayılan olur.
  const { count } = await ctx.supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ctx.user.id);
  const isDefault = parsed.data.isDefault === true || !count;

  const { error } = await ctx.supabase
    .from('addresses')
    .insert({ user_id: ctx.user.id, ...toRow(parsed.data), is_default: isDefault });
  if (error) return { error: 'Adres kaydedilemedi, lütfen tekrar deneyin.' };

  revalidateAddressViews();
  return { error: null };
}

export async function updateAddressAction(id: string, input: SavedAddressInput): Promise<AddressActionResult> {
  if (!idSchema.safeParse(id).success) return { error: 'Geçersiz adres.' };
  const parsed = savedAddressSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz adres bilgisi.' };

  const ctx = await authorize();
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from('addresses')
    .update({ ...toRow(parsed.data), ...(parsed.data.isDefault === true ? { is_default: true } : {}) })
    .eq('id', id)
    .eq('user_id', ctx.user.id);
  if (error) return { error: 'Adres güncellenemedi, lütfen tekrar deneyin.' };

  revalidateAddressViews();
  return { error: null };
}

export async function deleteAddressAction(id: string): Promise<AddressActionResult> {
  if (!idSchema.safeParse(id).success) return { error: 'Geçersiz adres.' };

  const ctx = await authorize();
  if (!ctx.ok) return { error: ctx.error };

  const { data: row } = await ctx.supabase
    .from('addresses')
    .select('is_default')
    .eq('id', id)
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  const { error } = await ctx.supabase.from('addresses').delete().eq('id', id).eq('user_id', ctx.user.id);
  if (error) return { error: 'Adres silinemedi, lütfen tekrar deneyin.' };

  // Varsayılan adres silindiyse kalan en yeni adres varsayılan yapılır.
  if (row?.is_default) {
    const { data: next } = await ctx.supabase
      .from('addresses')
      .select('id')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) await ctx.supabase.from('addresses').update({ is_default: true }).eq('id', next.id);
  }

  revalidateAddressViews();
  return { error: null };
}

export async function setDefaultAddressAction(id: string): Promise<AddressActionResult> {
  if (!idSchema.safeParse(id).success) return { error: 'Geçersiz adres.' };

  const ctx = await authorize();
  if (!ctx.ok) return { error: ctx.error };

  // Trigger (0029) diğer adreslerin varsayılanını otomatik kaldırır.
  const { error } = await ctx.supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', ctx.user.id);
  if (error) return { error: 'Varsayılan adres ayarlanamadı, lütfen tekrar deneyin.' };

  revalidateAddressViews();
  return { error: null };
}
