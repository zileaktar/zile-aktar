import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MfaForm } from './MfaForm';

export const dynamic = 'force-dynamic';

/**
 * Yönetici iki adımlı doğrulama sayfası. Kullanıcı + rol kontrolü admin
 * layout'unda ve middleware'de yapılır; bu sayfa AAL2 şartından muaftır
 * (AAL2'ye burada yükseltilir).
 *  - Doğrulanmış TOTP faktörü varsa: kod girişi.
 *  - Yoksa: kurulum (QR kod) + ilk kod doğrulaması.
 */
export default async function AdminMfaPage() {
  const supabase = await createSupabaseServerClient();

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === 'aal2') redirect('/admin');

  // listFactors().totp yalnızca DOĞRULANMIŞ faktörleri içerir.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedFactorId = factors?.totp[0]?.id ?? null;

  return <MfaForm verifiedFactorId={verifiedFactorId} />;
}
