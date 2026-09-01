'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { CaptchaField } from '@/components/auth/CaptchaField';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!captchaToken) {
      setError('Lütfen doğrulama kutusunun tamamlanmasını bekleyin.');
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      captchaToken,
      redirectTo: `${window.location.origin}/sifre-yenile`
    });
    setLoading(false);

    // E-posta taramasını (enumeration) engellemek için hata olsa da aynı mesajı gösteriyoruz —
    // yalnızca gerçek bir sunucu/doğrulama hatasında kullanıcıyı uyarıyoruz.
    if (resetError && /captcha|rate|too many/i.test(resetError.message)) {
      setError('Doğrulama başarısız veya çok fazla deneme. Lütfen biraz sonra tekrar deneyin.');
      captchaRef.current?.reset();
      setCaptchaToken(null);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="font-display font-bold text-xl text-primary mb-2">E-postanızı Kontrol Edin</h1>
        <p className="text-sm text-carbon/60">
          Bu e-posta bir hesaba kayıtlıysa, şifre sıfırlama bağlantısı gönderdik. Bağlantı 1 saat geçerlidir.
        </p>
        <Link href="/giris" className="inline-block mt-6 text-primary font-semibold text-sm">
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display font-bold text-2xl text-primary mb-2 text-center">Şifremi Unuttum</h1>
      <p className="text-sm text-carbon/55 text-center mb-6">
        Hesabınızın e-posta adresini girin, sıfırlama bağlantısı gönderelim.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
        <input
          required
          type="email"
          placeholder="E-posta"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white border border-primary/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <CaptchaField ref={captchaRef} onToken={setCaptchaToken} />
        <button
          disabled={loading || !captchaToken}
          type="submit"
          className="touch-target w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-full transition"
        >
          {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
        </button>
      </form>
      <p className="text-center text-sm text-carbon/60 mt-6">
        <Link href="/giris" className="text-primary font-semibold">
          Giriş sayfasına dön
        </Link>
      </p>
    </div>
  );
}
