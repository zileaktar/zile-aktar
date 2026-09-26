import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertRole, ForbiddenError } from '@/lib/rbac';
import { assertAal2 } from '@/lib/admin-auth';
import { generalApiRateLimit, safeRateLimit } from '@/lib/rate-limit';
import type { UserRole } from '@/lib/supabase/types';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

/**
 * PDF indirme uçları için yetki kontrolü: giriş + rol + iki adımlı doğrulama
 * (AAL2) + kullanıcı başına hız sınırı. Başarılıysa kullanıcının ÇEREZLİ
 * istemcisini döndürür — veriler bu istemciyle okunur, böylece RLS
 * (`is_staff()`/`is_admin()` + aal2 şartı) ek bir savunma katmanı olarak kalır.
 */
export async function authorizePdfRequest(
  required: UserRole
): Promise<{ supabase: SupabaseServerClient } | { response: Response }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { response: textResponse('Bu işlem için giriş yapmalısınız.', 401) };

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    assertRole(profile?.role, required);
    await assertAal2(supabase);
  } catch (err) {
    if (err instanceof ForbiddenError) return { response: textResponse(err.message, 403) };
    throw err;
  }

  const { success } = await safeRateLimit(generalApiRateLimit, `pdf:${user.id}`);
  if (!success) return { response: textResponse('Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.', 429) };

  return { supabase };
}

export { textResponse };
