'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { PasswordInput } from '@/components/auth/PasswordInput';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // verifyOtp tek kullanımlık — React StrictMode'da efekt iki kez çalışırsa ikinci
  // çağrı "geçersiz" dönüp başarılı doğrulamayı ezmesin.
  const verifyStarted = useRef(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    // 1) Asıl yol — e-posta şablonundaki bağlantı `?token_hash=...&type=recovery` taşır
    //    (Supabase → Authentication → Emails → "Reset password" şablonu). Doğrulama
    //    burada, bağlantının AÇILDIĞI tarayıcıda yapılır: istek bilgisayardan, e-posta
    //    telefondan açılsa bile çalışır. (Varsayılan PKCE bağlantısı yalnızca isteğin
    //    yapıldığı tarayıcıda çalışıyordu — başka cihazda "geçersiz" diyordu.)
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    if (tokenHash && params.get('type') === 'recovery') {
      if (verifyStarted.current) return;
      verifyStarted.current = true;
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
        // Token'ı adres çubuğundan/geçmişten sil (paylaşılır, tarayıcı geçmişinde kalır).
        window.history.replaceState(null, '', window.location.pathname);
        setReady(error ? 'invalid' : 'ok');
      });
      return;
    }

    // 2) Varsayılan şablon + implicit akış (bkz. sifremi-unuttum): Supabase doğrulamadan
    //    sonra buraya `#access_token=...&refresh_token=...&type=recovery` ile yönlendirir.
    //    #hash sunucuya hiç gitmez; oturum bu tarayıcıda kurulur, hash hemen silinir.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get('error') || hash.get('error_code')) {
      window.history.replaceState(null, '', window.location.pathname);
      setReady('invalid');
      return;
    }
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (accessToken && refreshToken && hash.get('type') === 'recovery') {
      if (verifyStarted.current) return;
      verifyStarted.current = true;
      window.history.replaceState(null, '', window.location.pathname);
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        setReady(error ? 'invalid' : 'ok');
      });
      return;
    }

    // 3) Eski PKCE bağlantıları (?code=...): istemci URL'deki kodu kendisi yakalayıp
    //    "recovery" oturumu kurar — yalnızca isteğin yapıldığı tarayıcıda çalışır.

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady('ok');
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setReady(data.session ? 'ok' : 'invalid');
    });

    const t = setTimeout(() => {
      if (!cancelled) setReady((r) => (r === 'checking' ? 'invalid' : r));
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Şifre en az 8 karakter olmalı.');
    if (password !== confirm) return setError('Şifreler eşleşmiyor.');

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError('Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir — tekrar sıfırlama isteyin.');
      return;
    }
    setDone(true);
  }

  if (ready === 'checking') {
    return <div className="max-w-sm mx-auto px-4 py-24 text-center text-sm text-carbon/50">Bağlantı doğrulanıyor...</div>;
  }

  if (ready === 'invalid') {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="font-display font-bold text-xl text-primary mb-2">Bağlantı Geçersiz veya Süresi Dolmuş</h1>
        <p className="text-sm text-carbon/60">Şifre sıfırlama bağlantıları 1 saat geçerlidir. Lütfen yeni bir tane isteyin.</p>
        <Link href="/sifremi-unuttum" className="inline-block mt-6 text-primary font-semibold text-sm">
          Yeni sıfırlama bağlantısı iste
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-display font-bold text-xl text-primary mb-2">Şifreniz Güncellendi</h1>
        <p className="text-sm text-carbon/60 mb-6">Yeni şifrenizle giriş yapabilirsiniz.</p>
        <a
          href="/giris"
          className="touch-target inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full transition"
        >
          Giriş Yap
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display font-bold text-2xl text-primary mb-6 text-center">Yeni Şifre Belirle</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
        <PasswordInput value={password} onChange={setPassword} placeholder="Yeni şifre (en az 8 karakter)" autoComplete="new-password" />
        <PasswordInput value={confirm} onChange={setConfirm} placeholder="Yeni şifre (tekrar)" autoComplete="new-password" />
        <button
          disabled={loading}
          type="submit"
          className="touch-target w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-full transition"
        >
          {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>
    </div>
  );
}
