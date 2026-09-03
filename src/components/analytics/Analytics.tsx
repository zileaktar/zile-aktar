'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { env } from '@/lib/env.mjs';
import { CONSENT_EVENT, hasAnalyticsConsent, trackPageView } from '@/lib/analytics';

const GA_ID = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const PIXEL_ID = env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Google Analytics 4 + Meta Pixel yükleyici.
 * - Script'ler YALNIZCA kullanıcı çerez banner'ında "Tümünü Kabul Et" dediğinde yüklenir (KVKK).
 * - Çerez tercihi değişince (CONSENT_EVENT) anında tepki verir, sayfa yenilemeye gerek yok.
 * - SPA gezinmelerinde (rota değişimi) manuel sayfa görüntüleme olayı gönderir.
 * - Hiç ölçüm kimliği tanımlı değilse tamamen pasiftir.
 */
export function Analytics() {
  const [consented, setConsented] = useState(false);
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    setConsented(hasAnalyticsConsent());
    const onChange = () => setConsented(hasAnalyticsConsent());
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  // SPA rota değişiminde Meta Pixel sayfa görüntüleme (GA4 bunu Gelişmiş Ölçüm
  // ile kendi yakalar). İlk yükleme fbq init tarafından raporlandığından atlanır.
  useEffect(() => {
    if (!consented) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    trackPageView();
  }, [pathname, consented]);

  if (!consented) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
// cookie_domain:'none' -> çerez tam ana bilgisayar adına yazılır. *.vercel.app
// "public suffix" listesinde olduğundan tarayıcı .vercel.app kapsamlı çerezi
// reddediyor; özel domain'e geçince bu satır zararsızca çalışmaya devam eder.
gtag('config', '${GA_ID}', { cookie_domain: 'none' });`}
          </Script>
        </>
      )}

      {PIXEL_ID && (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  );
}
