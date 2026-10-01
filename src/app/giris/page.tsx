'use client';

import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { createSupabaseBrowserClient, createSupabaseImplicitAuthClient } from '@/lib/supabase/client';
import { CaptchaField } from '@/components/auth/CaptchaField';
import { PasswordInput } from '@/components/auth/PasswordInput';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance>(null);
  // E-posta + şifre DOĞRU ama hesap doğrulanmamış → yeniden gönderme seçeneği.
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function resetCaptcha() {
    captchaRef.current?.reset();
    setCaptchaToken(null);
  }

  async function handleResend() {
    if (!captchaToken) return;
    setResendState('sending');
    // implicit: yeni bağlantı da başka cihazda açılsa çalışsın (bkz. kayit sayfası).
    const { error: resendError } = await createSupabaseImplicitAuthClient().auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { captchaToken, emailRedirectTo: `${window.location.origin}/hesap-dogrulandi` }
    });
    resetCaptcha();
    setResendState(resendError ? 'error' : 'sent');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnconfirmed(false);
    setResendState('idle');

    if (!captchaToken) {
      setError('Lütfen "insan olduğunuzu" doğrulama kutusunun tamamlanmasını bekleyin.');
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken }
    });

    setLoading(false);
    if (signInError) {
      resetCaptcha(); // token tek kullanımlık — yeni deneme için widget'ı sıfırla
      // "Doğrulanmamış e-posta" yalnızca e-posta VE şifre doğruysa döner — kayıtlı
      // e-postaları taramaya (enumeration) yaramaz; kullanıcıya gerçek nedeni söyleriz.
      if (signInError.code === 'email_not_confirmed') {
        setUnconfirmed(true);
        setError('E-posta adresinizi henüz doğrulamadınız. Size gönderdiğimiz e-postadaki bağlantıya tıklayın.');
        return;
      }
      // Supabase, "kullanıcı yok" ile "şifre yanlış" durumlarını aynı genel mesajla
      // döner — bu, hangi e-postaların kayıtlı olduğunun taranmasını (enumeration) engeller.
      setError('E-posta veya şifre hatalı.');
      return;
    }

    // TAM SAYFA yönlendirmesi (router.push değil): signInWithPassword çerezi
    // istemcide yazar; router.push hemen ardından çalışınca middleware'in
    // sunucu tarafı okuması çerezi henüz görmez ve kullanıcıyı /giris'e geri atar.
    // window.location ile tarayıcı isteği baştan yapar, taze çerezle.
    window.location.assign(searchParams.get('redirectTo') ?? '/hesabim');
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display font-bold text-2xl text-primary mb-6 text-center">Giriş Yap</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
        {unconfirmed && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm space-y-2">
            {resendState === 'sent' ? (
              <p>Yeni doğrulama e-postası gönderildi. Gelen kutunuzu (ve spam klasörünü) kontrol edin.</p>
            ) : (
              <>
                <p>E-posta gelmediyse veya bağlantının süresi dolduysa yenisini isteyin:</p>
                {resendState === 'error' && (
                  <p className="text-red-700">Gönderilemedi. Bir dakika bekleyip tekrar deneyin.</p>
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!captchaToken || resendState === 'sending'}
                  className="touch-target w-full rounded-full border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-800 disabled:opacity-60"
                >
                  {resendState === 'sending'
                    ? 'Gönderiliyor...'
                    : captchaToken
                      ? 'Doğrulama e-postasını tekrar gönder'
                      : 'Doğrulama kutusu tamamlanıyor...'}
                </button>
              </>
            )}
          </div>
        )}
        <input
          required
          type="email"
          placeholder="E-posta"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white border border-primary/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <PasswordInput value={password} onChange={setPassword} placeholder="Şifre" autoComplete="current-password" />
        <CaptchaField ref={captchaRef} onToken={setCaptchaToken} />
        <button
          disabled={loading || !captchaToken}
          type="submit"
          className="touch-target w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-full transition"
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
      <p className="text-center text-sm text-carbon/60 mt-4">
        <Link href="/sifremi-unuttum" className="text-primary font-semibold">
          Şifremi unuttum
        </Link>
      </p>
      <p className="text-center text-sm text-carbon/60 mt-2">
        Hesabınız yok mu?{' '}
        <Link href="/kayit" className="text-primary font-semibold">
          Kayıt Olun
        </Link>
      </p>
    </div>
  );
}

// `useSearchParams()` (redirectTo parametresi için) kullanan LoginForm, Next.js'in
// zorunlu kıldığı bir Suspense sınırı içine alınmalı — aksi halde bu sayfa build
// sırasında statik olarak üretilemez (bkz. src/app/layout.tsx'teki SiteHeader notu).
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
