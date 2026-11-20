'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'kokten-aktar-cookie-consent-v1';
/** Footer'daki "Çerez Tercihleri" düğmesi bu olayı fırlatır → banner yeniden açılır. */
export const OPEN_COOKIE_PREFERENCES_EVENT = 'open-cookie-preferences';

type ConsentLevel = 'all' | 'essential';

function readLevel(): ConsentLevel | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const level = (JSON.parse(raw) as { level?: unknown }).level;
    return level === 'all' || level === 'essential' ? level : null;
  } catch {
    return null;
  }
}

/**
 * KVKK uyumlu çerez izni banner'ı. Tercih localStorage'da tutulur; "Yalnızca Zorunlu"
 * seçilirse GA/Pixel hiç yüklenmez (Analytics.tsx `cookie-consent-change` olayını dinler).
 * KVKK Çerez Rehberi: rıza, verildiği kadar kolay geri alınabilmeli → footer'daki
 * "Çerez Tercihleri" düğmesi banner'ı yeniden açar.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ConsentLevel | null>(null);

  useEffect(() => {
    const level = readLevel();
    setCurrent(level);
    if (!level) setVisible(true);

    function open() {
      setCurrent(readLevel());
      setVisible(true);
    }
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open);
  }, []);

  function choose(level: ConsentLevel) {
    const previous = readLevel();
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ level, at: new Date().toISOString() }));
    setVisible(false);
    if (previous === 'all' && level === 'essential') {
      // GA/Pixel script'leri sayfaya bir kez yüklendiyse JS ile tamamen kaldırılamaz;
      // rıza geri çekilince sayfayı yenileyerek hiç yüklenmemiş hale getiriyoruz.
      window.location.reload();
      return;
    }
    // Analytics bileşeni bunu dinler; "Tümünü Kabul Et" ile GA/Pixel anında yüklenir.
    window.dispatchEvent(new Event('cookie-consent-change'));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez tercihleri"
      className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-[100] bg-primary-dark text-cream p-4 sm:p-5"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-xs sm:text-sm text-cream/80 flex-1">
          Sitemizin çalışması için zorunlu çerezler kullanıyoruz. Onay verirseniz, site kullanımını ölçmek ve reklam
          performansını izlemek için analitik/pazarlama çerezleri (Google Analytics, Meta Pixel) de kullanılır.
          Ayrıntılar:{' '}
          <a href="/cerez-politikasi" className="underline text-accent-light">
            Çerez Politikası
          </a>{' '}
          ·{' '}
          <a href="/kvkk" className="underline text-accent-light">
            KVKK Aydınlatma Metni
          </a>
          {current && (
            <span className="block mt-1 text-cream/60">
              Şu anki tercihiniz: {current === 'all' ? 'Tümü kabul edildi' : 'Yalnızca zorunlu çerezler'}
            </span>
          )}
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => choose('essential')}
            // KVKK Çerez Rehberi: reddetme, kabul kadar kolay ve belirgin olmalı (eşit boyut/ağırlık).
            className="touch-target px-4 py-2 rounded-full bg-cream text-primary-dark text-xs sm:text-sm font-bold hover:bg-white"
          >
            Yalnızca Zorunlu
          </button>
          <button
            onClick={() => choose('all')}
            className="touch-target px-4 py-2 rounded-full bg-accent text-primary-dark text-xs sm:text-sm font-bold hover:bg-accent-dark"
          >
            Tümünü Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}

/** Footer'da kullanılır — banner'ı yeniden açar (rızayı geri çekme / değiştirme). */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}
      className={className}
    >
      Çerez Tercihleri
    </button>
  );
}
