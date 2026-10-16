'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';
import { assertAal2 } from '@/lib/admin-auth';

export interface ShippingFormState {
  error: string | null;
  ok?: boolean;
}

const num = (message: string) => z.number({ invalid_type_error: message, required_error: message });

const rateSchema = z.object({
  maxGrams: num('Her aralık için geçerli bir kg sınırı girin.')
    .int()
    .min(1, 'Ağırlık sınırı 0 olamaz.')
    .max(1000000, 'Ağırlık sınırı en fazla 1000 kg olabilir.'),
  priceCents: num('Her aralık için geçerli bir ücret girin (örn. 39,90).').int().min(0, 'Ücret negatif olamaz.').max(10000000)
});

const shippingSchema = z.object({
  freeThresholdCents: num('Ücretsiz kargo sınırı geçerli bir tutar olmalı.').int().min(0).nullable(),
  defaultItemGrams: num('Varsayılan ağırlık geçerli bir sayı olmalı.')
    .int()
    .min(1, 'Varsayılan ağırlık en az 1 g olmalı.')
    .max(100000),
  packagingGrams: num('Koli/ambalaj ağırlığı geçerli bir sayı olmalı.').int().min(0).max(100000),
  extraPerKgCents: num('Ek kg ücreti geçerli bir tutar olmalı.').int().min(0).max(10000000),
  rates: z
    .array(rateSchema)
    .min(1, 'En az bir ağırlık aralığı girin.')
    .max(20, 'En fazla 20 aralık girilebilir.')
    .refine((rs) => new Set(rs.map((r) => r.maxGrams)).size === rs.length, 'Aynı ağırlık sınırı iki kez girilmiş.')
});

/** "39,90" / "39.90" / "1.234,50" → kuruş. Boş → null. Geçersiz → NaN. */
function tlToCents(raw: FormDataEntryValue | null): number | null {
  const v = String(raw ?? '').trim();
  if (!v) return null;
  const normalized = v.includes(',') ? v.replace(/\./g, '').replace(',', '.') : v;
  const num = Number(normalized);
  return Number.isFinite(num) ? Math.round(num * 100) : Number.NaN;
}

function toInt(raw: FormDataEntryValue | null): number {
  const v = String(raw ?? '').trim();
  return v === '' ? 0 : Number.parseInt(v, 10);
}

/**
 * Admin → Ayarlar → Kargo Ücretleri. Kullanıcının KENDİ oturumuyla çalışır;
 * save_shipping_config RPC'si içinde is_admin() (AAL2 dahil) tekrar kontrol edilir.
 */
export async function saveShippingConfigAction(_prev: ShippingFormState, formData: FormData): Promise<ShippingFormState> {
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

  let rawRates: { maxKg: string; price: string }[] = [];
  try {
    rawRates = JSON.parse(String(formData.get('ratesJson') ?? '[]'));
  } catch {
    return { error: 'Ağırlık aralıkları okunamadı.' };
  }

  const parsed = shippingSchema.safeParse({
    freeThresholdCents: tlToCents(formData.get('freeThreshold')),
    defaultItemGrams: toInt(formData.get('defaultItemGrams')),
    packagingGrams: toInt(formData.get('packagingGrams')),
    extraPerKgCents: tlToCents(formData.get('extraPerKg')) ?? 0,
    rates: rawRates
      .filter((r) => String(r.maxKg ?? '').trim() || String(r.price ?? '').trim())
      .map((r) => ({
        maxGrams: Math.round(Number(String(r.maxKg).replace(',', '.')) * 1000),
        priceCents: tlToCents(r.price) ?? Number.NaN
      }))
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formda hata var.' };
  }
  const d = parsed.data;

  const { error } = await supabase.rpc('save_shipping_config', {
    p_free_threshold_cents: d.freeThresholdCents,
    p_default_item_grams: d.defaultItemGrams,
    p_packaging_grams: d.packagingGrams,
    p_extra_per_kg_cents: d.extraPerKgCents,
    p_rates: [...d.rates].sort((a, b) => a.maxGrams - b.maxGrams).map((r) => ({ max_grams: r.maxGrams, price_cents: r.priceCents }))
  });
  if (error) {
    return { error: 'Kargo ayarları kaydedilemedi: ' + error.message };
  }

  revalidateTag('shipping');
  revalidatePath('/', 'layout');
  return { error: null, ok: true };
}
