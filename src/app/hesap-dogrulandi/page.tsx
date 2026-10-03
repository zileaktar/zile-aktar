'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Kayıt doğrulama e-postasındaki bağlantının döndüğü sayfa (kayit → emailRedirectTo).
 *
 * E-posta doğrulaması Supabase sunucusunda, bağlantıya tıklandığı anda yapılır;
 * buraya yalnızca SONUÇ gelir: başarıda `#access_token=...`, geçersiz/süresi dolmuş
 * bağlantıda `#error=...&error_code=...`.
 *
 * GÜVENLİK: hash'teki oturum bilgisiyle OTOMATİK GİRİŞ YAPILMAZ. Yapılsaydı,
 * saldırgan kendi hesabının bilgisini taşıyan bir bağlantıyı müşteriye gönderip onu
 * farkında olmadan saldırganın hesabında oturum açtırabilirdi (login CSRF) — müşteri
 * sonra adres/sipariş girerse bilgileri saldırgana giderdi. Kullanıcı kendi
 * şifresiyle giriş yapar. Hash (token içerir) adres çubuğundan hemen silinir.
 */
export default function EmailVerifiedPage() {
  const [state, setState] = useState<'checking' | 'verified' | 'invalid'>('checking');

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);
    setState(hash.get('error') || hash.get('error_code') ? 'invalid' : 'verified');
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
      <p className="text-sm text-carbon/60 mb-6">Hesabınız etkinleştirildi. E-posta ve şifrenizle giriş yapabilirsiniz.</p>
      <Link
        href="/giris"
        className="touch-target inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full transition"
      >
        Giriş Yap
      </Link>
    </div>
  );
}
