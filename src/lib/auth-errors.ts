/**
 * Supabase Auth şifre hatalarını müşterinin anlayacağı Türkçe mesaja çevirir.
 *
 * "Sızdırılmış şifre koruması" (Supabase → Auth → Email → Prevent use of leaked
 * passwords; HaveIBeenPwned) açıkken, internette sızdırılmış listelerde geçen bir
 * şifre `code: 'weak_password'` (+ `reasons: ['pwned']`) ile reddedilir. Eskiden bu
 * durumda yalnız "Kayıt oluşturulamadı" / "bağlantının süresi dolmuş olabilir"
 * gibi yanıltıcı mesajlar çıkıyordu.
 */
export function weakPasswordMessage(error: { code?: string | undefined; reasons?: string[] } | null): string | null {
  if (!error || error.code !== 'weak_password') return null;
  if (error.reasons?.includes('pwned')) {
    return 'Bu şifre daha önce internette sızdırılmış şifre listelerinde yer alıyor ve güvenli değil. Lütfen başka bir şifre seçin.';
  }
  return 'Bu şifre yeterince güçlü değil. Lütfen en az 8 karakterli, tahmin edilmesi zor bir şifre seçin.';
}
