'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Kayıt doğrulama e-postasındaki bağlantının döndüğü sayfa (kayit → emailRedirectTo).
 *
 * Kayıt implicit akışla yapılır (bkz. createSupabaseImplicitAuthClient): Supabase
 * e-postayı doğruladıktan sonra buraya `#access_token=...&refresh_token=...&type=signup`
 * ile yönlendirir → oturum BU tarayıcıda kurulur (bağlantı başka cihazda açılsa da).
 * Bağlantı geçersiz/süresi dolmuşsa Supabase `#error=...&error_code=...` ile döner.
 * Eskiden bağlantı ana sayfaya dönüyor, sonuç (başarı/hata) hiç gösterilmiyordu.
 */
export default function EmailVerifiedPage() {
  const [state, setState] = useState<'checking' | 'signed_in' | 'verified' | 'invalid'>('checking');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode çift çalıştırmasına karşı
    started.current = true;

    const supabase = createSupabaseBrowserClient();
    const hash = new URLSearchParams(window.location.hash.slice(1));
    // Token/hata bilgisini adres çubuğundan ve tarayıcı geçmişinden sil.
    window.history.replaceState(null, '', window.location.pathname);

    if (hash.get('error') || hash.get('error_code')) {
      setState('invalid');
      return;
    }

    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        // Oturum kurulamasa bile e-posta doğrulaması Supabase tarafında yapılmıştır.
        setState(error ? 'verified' : 'signed_in');
      });
      return;
    }

    // Hash yok (eski tip bağlantı): doğrulama Supabase'de yapıldı, giriş gerekiyor.
    setState('verified');
  }, []);

  if (state === 'checking') {
    return <div className="max-w-sm mx-auto px-4 py-24 text-center text-sm text-carbon/50">Doğrulanıyor...</div>;
  }

  if (state === 'invalid') {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="font-display font-bold text-xl text-primary mb-2">Bağlantı Geçersiz veya Süresi Dolmuş</h1>
        <p className="text-sm text-carbon/60">
          Doğrulama bağlantıları tek kullanımlıktır ve belirli bir süre geçerlidir. Giriş sayfasında e-posta ve şifrenizi
          girin; hesabınız henüz doğrulanmadıysa size yeni bir doğrulama e-postası gönderebilirsiniz.
        </p>
        <Link href="/giris" className="inline-block mt-6 text-primary font-semibold text-sm">
          Giriş sayfasına git
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="font-display font-bold text-xl text-primary mb-2">E-postanız Doğrulandı</h1>
      <p className="text-sm text-carbon/60 mb-6">
        {state === 'signed_in'
          ? 'Hesabınız etkinleştirildi ve giriş yaptınız. Alışverişe başlayabilirsiniz.'
          : 'Hesabınız etkinleştirildi. E-posta ve şifrenizle giriş yapabilirsiniz.'}
      </p>
      {/* Tam sayfa geçiş: yeni oturum çerezi sunucu tarafında da okunabilsin. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href={state === 'signed_in' ? '/hesabim' : '/giris'}
        className="touch-target inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full transition"
      >
        {state === 'signed_in' ? 'Hesabıma Git' : 'Giriş Yap'}
      </a>
    </div>
  );
}
