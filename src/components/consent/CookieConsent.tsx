'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'kokten-aktar-cookie-consent-v1';

/**
 * KVKK/GDPR uyumlu çerez izni banner'ı. Tercih yalnızca localStorage'da tutulur;
 * "Yalnızca Zorunlu" seçilirse analytics/pazarlama script'leri (varsa) yüklenmez
 * — bu proje şablonunda analytics entegrasyonu yoktur, bayrak ileride eklenecek
 * script'leri koşullu yüklemek için `localStorage.getItem(CONSENT_KEY)` okunarak kullanılabilir.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept(level: 'all' | 'essential') {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ level, at: new Date().toISOString() }));
    // Analytics bileşeni bunu dinler; "Tümünü Kabul Et" ile GA/Pixel anında yüklenir.
    window.dispatchEvent(new Event('cookie-consent-change'));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-[100] bg-primary-dark text-cream p-4 sm:p-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-xs sm:text-sm text-cream/80 flex-1">
          Sitemizde deneyiminizi geliştirmek için çerezler kullanıyoruz. Detaylar için{' '}
          <a href="/kvkk" className="underline text-accent-light">
            KVKK Aydınlatma Metni
          </a>
          &apos;ni inceleyebilirsiniz.
        </p>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => accept('essential')} className="touch-target px-4 py-2 rounded-full border border-cream/30 text-xs sm:text-sm font-semibold hover:bg-white/10">
            Yalnızca Zorunlu
          </button>
          <button onClick={() => accept('all')} className="touch-target px-4 py-2 rounded-full bg-accent text-primary-dark text-xs sm:text-sm font-bold hover:bg-accent-dark">
            Tümünü Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
