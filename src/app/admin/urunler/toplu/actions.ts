'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';
import { assertAal2 } from '@/lib/admin-auth';
import { accountMutationRateLimit, safeRateLimit } from '@/lib/rate-limit';
import { loadVariantSnapshots } from '@/lib/bulk-variants-server';
import {
  buildBulkPreview,
  decodeCsvBytes,
  MAX_BULK_ROWS,
  MAX_PRICE_CENTS,
  MAX_STOCK,
  parseCsv,
  type BulkPreview
} from '@/lib/bulk-variants';
import { readXlsxRows } from '@/lib/xlsx-read';

const MAX_FILE_BYTES = 1024 * 1024; // 1 MB — 5000 satır için fazlasıyla yeterli

export interface PreviewState {
  error: string | null;
  preview: BulkPreview | null;
}

export interface ApplyState {
  error: string | null;
  updated: number | null;
  conflicts: string[];
}

/** Admin + iki adımlı doğrulama + hız sınırı (fail-closed). Hata metni döner, başarıda istemciyi. */
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Giriş yapmalısınız.' } as const;
  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    assertRole(profile?.role, 'admin');
    await assertAal2(supabase);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Yetkisiz işlem.' } as const;
  }
  const { success } = await safeRateLimit(accountMutationRateLimit, `bulk-variants:${user.id}`, { failClosed: true });
  if (!success) return { error: 'Çok fazla deneme. Bir dakika sonra tekrar deneyin.' } as const;
  return { supabase } as const;
}

/** 1. adım: yüklenen CSV'yi okur, güncel değerlerle karşılaştırır — VERİTABANINA YAZMAZ. */
export async function previewBulkUpdateAction(_prev: PreviewState, formData: FormData): Promise<PreviewState> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error, preview: null };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Lütfen bir CSV dosyası seçin.', preview: null };
  if (file.size > MAX_FILE_BYTES) return { error: 'Dosya çok büyük (en fazla 1 MB).', preview: null };
  const isXlsx = /\.xlsx$/i.test(file.name);
  if (/\.xls$/i.test(file.name)) {
    return {
      error:
        'Eski Excel biçimi (.xls) okunamıyor. Excel\'de "Dosya → Farklı Kaydet → Excel Çalışma Kitabı (.xlsx)" ya da "CSV" seçip kaydedin, o dosyayı yükleyin.',
      preview: null
    };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const rows = isXlsx ? readXlsxRows(bytes) : parseCsv(decodeCsvBytes(bytes));
    const current = new Map((await loadVariantSnapshots(auth.supabase)).map((v) => [v.sku, v]));
    return { error: null, preview: buildBulkPreview(rows, current) };
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'bulk-variants-preview' } });
    return {
      error: 'Dosya okunamadı. Panelden indirilen listeyi ya da Stok Tablosu aracının dışa aktardığı dosyayı (CSV veya .xlsx) kullanın.',
      preview: null
    };
  }
}

const valuesSchema = z.object({
  priceCents: z.number().int().positive().max(MAX_PRICE_CENTS),
  compareAtCents: z.number().int().positive().max(MAX_PRICE_CENTS).nullable(),
  stock: z.number().int().min(0).max(MAX_STOCK)
});
const changesSchema = z
  .array(
    z.object({
      sku: z.string().min(1).max(100),
      old: valuesSchema,
      next: valuesSchema.refine((v) => v.compareAtCents == null || v.compareAtCents > v.priceCents)
    })
  )
  .min(1)
  .max(MAX_BULK_ROWS);

/** 2. adım: önizlemesi onaylanan değişiklikleri uygular (değeri arada değişen satırlar atlanır). */
export async function applyBulkUpdateAction(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error, updated: null, conflicts: [] };

  let parsed;
  try {
    parsed = changesSchema.safeParse(JSON.parse(String(formData.get('changesJson') ?? '')));
  } catch {
    parsed = null;
  }
  if (!parsed?.success) return { error: 'Geçersiz istek. Dosyayı tekrar yükleyin.', updated: null, conflicts: [] };

  const { data, error } = await auth.supabase.rpc('bulk_update_variants', {
    p_rows: parsed.data.map((c) => ({
      sku: c.sku,
      old_price_cents: c.old.priceCents,
      old_compare_at_price_cents: c.old.compareAtCents,
      old_stock: c.old.stock,
      price_cents: c.next.priceCents,
      compare_at_price_cents: c.next.compareAtCents,
      stock: c.next.stock
    }))
  });
  if (error || !data) {
    Sentry.captureException(error ?? new Error('bulk_update_variants boş yanıt'), {
      tags: { context: 'bulk-variants-apply' }
    });
    return { error: 'Güncelleme yapılamadı, hiçbir ürün değiştirilmedi. Lütfen tekrar deneyin.', updated: null, conflicts: [] };
  }

  // Fiyat/stok vitrinde de hemen görünsün (ana sayfa, kategori, ürün sayfaları).
  revalidatePath('/', 'layout');
  return { error: null, updated: data.updated, conflicts: data.conflicts };
}
