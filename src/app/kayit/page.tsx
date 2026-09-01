'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { CaptchaField } from '@/components/auth/CaptchaField';
import { PasswordInput } from '@/components/auth/PasswordInput';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance>(null);

  const passwordsFilled = password.length > 0 && confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;

  function resetCaptcha() {
    captchaRef.current?.reset();
    setCaptchaToken(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (!passwordsMatch) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    if (!captchaToken) {
      setError('Lütfen "insan olduğunuzu" doğrulama kutusunun tamamlanmasını bekleyin.');
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    // Supabase Auth şifreyi Bcrypt ile hash'ler ve DB'de asla düz metin tutmaz.
    // profiles satırı, on_auth_user_created trigger'ı ile otomatik oluşturulur (bkz. migration 0001).
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, marketing_consent: marketingConsent }, captchaToken }
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message.includes('already registered') ? 'Bu e-posta zaten kayıtlı.' : 'Kayıt oluşturulamadı.');
      resetCaptcha(); // token tek kullanımlık — yeni deneme için widget'ı sıfırla
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="font-display font-bold text-xl text-primary mb-2">E-postanızı Kontrol Edin</h1>
        <p className="text-sm text-carbon/60">Hesabınızı doğrulamak için gönderdiğimiz bağlantıya tıklayın.</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display font-bold text-2xl text-primary mb-6 text-center">Hesap Oluştur</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
        <input
          required
          placeholder="Ad Soyad"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-white border border-primary/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <input
          required
          type="email"
          placeholder="E-posta"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white border border-primary/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />

        <PasswordInput value={password} onChange={setPassword} placeholder="Şifre (en az 8 karakter)" autoComplete="new-password" />
        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Şifre (Tekrar)"
          autoComplete="new-password"
          className={passwordsFilled && !passwordsMatch ? '!border-red-300 focus:!ring-red-300' : ''}
        />
        {passwordsFilled && !passwordsMatch && <p className="text-xs text-red-600 -mt-2">Şifreler eşleşmiyor.</p>}
        {passwordsFilled && passwordsMatch && (
          <p className="text-xs text-green-600 -mt-2 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Şifreler eşleşiyor
          </p>
        )}

        <label className="flex items-start gap-2 text-xs text-carbon/60 cursor-pointer">
          <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-0.5 accent-primary" />
          Kampanya ve fırsatlardan e-posta ile haberdar olmak istiyorum.
        </label>
        <CaptchaField ref={captchaRef} onToken={setCaptchaToken} />
        <button
          disabled={loading || !passwordsMatch || !passwordsFilled || !captchaToken}
          type="submit"
          className="touch-target w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-full transition"
        >
          {loading ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
        </button>
      </form>
      <p className="text-center text-sm text-carbon/60 mt-6">
        Zaten hesabınız var mı?{' '}
        <Link href="/giris" className="text-primary font-semibold">
          Giriş Yapın
        </Link>
      </p>
    </div>
  );
}
