import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { ForbiddenError } from '@/lib/rbac';

/**
 * Yönetici işlemleri için iki adımlı doğrulama (TOTP / AAL2) zorunluluğu.
 *
 * Admin layout'u AAL2 olmayanı /admin/mfa'ya yönlendirir, ama Server Action'lar
 * ve /api/upload/presigned-url gibi uçlar layout'u ATLAYARAK doğrudan
 * çağrılabilir — bu yüzden her yönetici mutasyonunda rol kontrolünün hemen
 * ardından bu fonksiyon da çağrılır. Veritabanı katmanında ayrıca
 * is_staff()/is_admin() AAL2 şartı arar (migration 0036).
 *
 * Not: AAL, çağıranın aynı istekte `auth.getUser()` ile sunucuda doğruladığı
 * oturum token'ının `aal` alanından okunur.
 */
export async function assertAal2(supabase: SupabaseClient<Database>): Promise<void> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || data?.currentLevel !== 'aal2') {
    throw new ForbiddenError('Bu işlem için iki adımlı doğrulama (Authenticator kodu) gerekir.');
  }
}
