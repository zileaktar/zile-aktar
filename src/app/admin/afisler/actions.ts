'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';

export interface BannerActionState {
  error: string | null;
  ok?: boolean;
}

const bannerSchema = z.object({
  imagePath: z.string().trim().min(1, 'Görsel zorunlu.'),
  title: z.string().trim().max(120).optional().default(''),
  subtitle: z.string().trim().max(240).optional().default(''),
  linkUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default('')
    .refine((v) => v === '' || v.startsWith('/') || /^https?:\/\//i.test(v), 'Bağlantı "/" ile başlamalı ya da http(s):// içermeli.'),
  ctaLabel: z.string().trim().max(40).optional().default('')
});

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

function readBannerForm(formData: FormData) {
  return bannerSchema.safeParse({
    imagePath: formData.get('imagePath'),
    title: formData.get('title') ?? '',
    subtitle: formData.get('subtitle') ?? '',
    linkUrl: formData.get('linkUrl') ?? '',
    ctaLabel: formData.get('ctaLabel') ?? ''
  });
}

/** id boşsa yeni afiş oluşturur, doluysa mevcut afişi günceller. */
export async function saveBannerAction(id: string | null, _prev: BannerActionState, formData: FormData): Promise<BannerActionState> {
  let supabase;
  try {
    supabase = await requireStaff();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const parsed = readBannerForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formda hata var.' };
  const d = parsed.data;

  const row = {
    image_path: d.imagePath,
    title: d.title || null,
    subtitle: d.subtitle || null,
    link_url: d.linkUrl || null,
    cta_label: d.ctaLabel || null
  };

  if (id) {
    const { error } = await supabase.from('campaign_banners').update(row).eq('id', id);
    if (error) return { error: 'Afiş güncellenemedi: ' + error.message };
  } else {
    const { data: maxRow } = await supabase
      .from('campaign_banners')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from('campaign_banners')
      .insert({ ...row, sort_order: (maxRow?.sort_order ?? 0) + 1 });
    if (error) return { error: 'Afiş eklenemedi: ' + error.message };
  }

  revalidatePath('/admin/afisler');
  revalidatePath('/');
  return { error: null, ok: true };
}

export async function toggleBannerAction(id: string): Promise<BannerActionState> {
  let supabase;
  try {
    supabase = await requireStaff();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }
  const { data: current } = await supabase.from('campaign_banners').select('is_active').eq('id', id).single();
  if (!current) return { error: 'Afiş bulunamadı.' };
  const { error } = await supabase.from('campaign_banners').update({ is_active: !current.is_active }).eq('id', id);
  if (error) return { error: 'Durum değiştirilemedi.' };
  revalidatePath('/admin/afisler');
  revalidatePath('/');
  return { error: null, ok: true };
}

export async function deleteBannerAction(id: string): Promise<BannerActionState> {
  let supabase;
  try {
    supabase = await requireStaff();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }
  const { error } = await supabase.from('campaign_banners').delete().eq('id', id);
  if (error) return { error: 'Afiş silinemedi.' };
  revalidatePath('/admin/afisler');
  revalidatePath('/');
  return { error: null, ok: true };
}

/** Afişi sıralamada bir üst/alt komşusuyla takas eder. */
export async function moveBannerAction(id: string, direction: 'up' | 'down'): Promise<BannerActionState> {
  let supabase;
  try {
    supabase = await requireStaff();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' };
  }

  const { data: all } = await supabase
    .from('campaign_banners')
    .select('id, sort_order')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (!all) return { error: 'Afişler okunamadı.' };

  const index = all.findIndex((row) => row.id === id);
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= all.length) return { error: null, ok: true };

  const a = all[index]!;
  const b = all[swapWith]!;

  if (a.sort_order === b.sort_order) {
    // Eşit sort_order (eski kayıtlar) — sadece taşınan afişi komşunun bir
    // ilerisine/gerisine it, tam sıralama bir sonraki kaydetmede oturur.
    await supabase
      .from('campaign_banners')
      .update({ sort_order: direction === 'up' ? b.sort_order - 1 : b.sort_order + 1 })
      .eq('id', a.id);
  } else {
    await supabase.from('campaign_banners').update({ sort_order: b.sort_order }).eq('id', a.id);
    await supabase.from('campaign_banners').update({ sort_order: a.sort_order }).eq('id', b.id);
  }

  revalidatePath('/admin/afisler');
  revalidatePath('/');
  return { error: null, ok: true };
}
