'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole, ForbiddenError } from '@/lib/rbac';
import { authRateLimit, safeRateLimit } from '@/lib/rate-limit';

/**
 * Yönetici iki adımlı doğrulama (TOTP) aksiyonları.
 *
 * Tarayıcıdaki Supabase istemcisi oturumu OKUYAMAZ (oturum çerezleri
 * HttpOnly), bu yüzden kurulum ve doğrulama sunucuda, çerezli istemciyle
 * yapılır. challengeAndVerify başarılı olunca yeni (AAL2) oturum çerezleri
 * aynı yanıtta yazılır.
 *
 * Bu aksiyonlar AAL1 oturumla çağrılır (AAL2'ye yükseltmenin kendisi
 * buradadır), ama rol kontrolü yine yapılır: yalnızca personel hesapları.
 */
async function requireStaffSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new ForbiddenError('Oturum bulunamadı, lütfen tekrar giriş yapın.');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  assertRole(profile?.role, 'moderator');
  return { supabase, user };
}

export type StartEnrollmentResult = { error: string } | { factorId: string; qrCode: string; secret: string };

export async function startMfaEnrollmentAction(): Promise<StartEnrollmentResult> {
  try {
    const { supabase } = await requireStaffSession();

    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) return { error: 'Doğrulama bilgileri okunamadı, lütfen tekrar deneyin.' };

    // Doğrulanmış bir faktör varken yeni kurulum AÇILMAZ: aksi halde parolayı
    // ele geçiren biri kendi telefonunu ekleyip MFA'yı atlatabilirdi.
    if (factors.totp.length > 0) {
      return { error: 'Bu hesapta zaten kayıtlı bir doğrulama uygulaması var. Kodunuzu girin.' };
    }

    // Yarım kalmış (QR okutulup kodu hiç girilmemiş) kurulumları temizle.
    for (const factor of factors.all) {
      if (factor.factor_type === 'totp' && factor.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Zile Aktar Yönetim ${new Date().toISOString().slice(0, 10)}`
    });
    if (error || !data) {
      return { error: 'Kurulum başlatılamadı. Supabase panelinde MFA (TOTP) açık olmalı.' };
    }

    return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
  } catch (err) {
    if (err instanceof ForbiddenError) return { error: err.message };
    throw err;
  }
}

const verifySchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, 'Uygulamadaki 6 haneli kodu girin.')
});

export async function verifyMfaCodeAction(factorId: string, code: string): Promise<{ error: string | null }> {
  try {
    const parsed = verifySchema.safeParse({ factorId, code: code.trim() });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz kod.' };

    const { supabase, user } = await requireStaffSession();

    // 6 haneli kod = 1.000.000 olasılık: kaba kuvvete karşı kullanıcı bazlı
    // sıkı sınır (5 dakikada 10 deneme). Sınırlayıcı çalışmıyorsa REDDET.
    const { success } = await safeRateLimit(authRateLimit, `mfa:${user.id}`, { failClosed: true });
    if (!success) return { error: 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.' };

    // Faktörün bu kullanıcıya ait olduğunu Supabase kendisi doğrular.
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: parsed.data.factorId,
      code: parsed.data.code
    });
    if (error) return { error: 'Kod hatalı veya süresi dolmuş. Uygulamadaki güncel kodu girin.' };

    return { error: null };
  } catch (err) {
    if (err instanceof ForbiddenError) return { error: err.message };
    throw err;
  }
}
