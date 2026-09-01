import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { presignedUploadRequestSchema } from '@/lib/validations/product';
import { assertRole, ForbiddenError } from '@/lib/rbac';
import { generalApiRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { checkTrustedOrigin } from '@/lib/csrf';
import { env } from '@/lib/env.mjs';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

/**
 * Ürün görseli yükleme akışı:
 *  1. Admin, bu uca dosya adı + content-type gönderir (dosyanın kendisi DEĞİL).
 *  2. Biz kimlik/rol doğrular, rastgele bir dosya adı üretir ve Supabase Storage'dan
 *     bir "signed upload URL" isteriz (Supabase bu URL'i kısa ömürlü — SDK'nın
 *     kendi varsayılan süresiyle — üretir; SUPABASE_STORAGE_SIGNED_URL_TTL
 *     burada yalnızca istemciye bilgilendirme amaçlı döndürülür).
 *  3. İstemci, gerçek dosyayı bu URL'e DOĞRUDAN yükler — bizim sunucumuzdan
 *     hiçbir görsel baytı geçmez (bant genişliği ve sunucu belleği tasarrufu).
 *
 * NOT: Supabase JS SDK sürümünüzde `createSignedUploadUrl` ikinci bir "expiresIn"
 * parametresi destekliyorsa (SDK değişkenlik gösterebilir), süreyi burada açıkça
 * `env.SUPABASE_STORAGE_SIGNED_URL_TTL` ile geçirin; desteklemiyorsa Supabase'in
 * varsayılan süresi geçerlidir.
 */
export async function POST(request: Request) {
  const csrfResponse = checkTrustedOrigin(request);
  if (csrfResponse) return csrfResponse;

  const ip = getClientIp(request.headers);
  const { success } = await safeRateLimit(generalApiRateLimit, ip);
  if (!success) {
    return NextResponse.json({ error: 'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.' }, { status: 429 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Bu işlem için giriş yapmalısınız.' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    assertRole(profile?.role, 'moderator');

    const body = await request.json();
    const parsed = presignedUploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek.', details: parsed.error.flatten() }, { status: 400 });
    }

    const extension = parsed.data.fileName.split('.').pop();
    const objectPath = `${parsed.data.folder}/${crypto.randomUUID()}.${extension}`;

    // Signed upload URL üretimi service_role gerektirir (RLS bypass, storage.objects yazma yetkisi).
    const serviceClient = createSupabaseServiceRoleClient();
    const { data, error } = await serviceClient.storage.from('product-images').createSignedUploadUrl(objectPath);

    if (error || !data) {
      Sentry.captureException(error ?? new Error('createSignedUploadUrl boş sonuç döndü'));
      return NextResponse.json({ error: 'Yükleme bağlantısı oluşturulamadı.' }, { status: 502 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      // `path`: DB'ye (products.image_path) yazılacak, bucket adını içeren tam yol.
      // `objectPath`: istemcinin `uploadToSignedUrl(objectPath, token, file)` çağrısında
      // kullanması gereken, bucket adı OLMADAN göreli yol — ikisi karıştırılmamalı.
      path: `product-images/${objectPath}`,
      objectPath,
      token: data.token,
      expiresInSeconds: env.SUPABASE_STORAGE_SIGNED_URL_TTL
    });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
