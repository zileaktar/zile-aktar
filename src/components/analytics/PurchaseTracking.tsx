'use client';

import { useEffect, useRef } from 'react';
import { hasAnalyticsConsent, trackPurchase } from '@/lib/analytics';

/**
 * Sipariş onay sayfasında bir kez "purchase" olayı gönderir (GA4 + Meta Pixel).
 * Tutar sunucudan (DB'den) geldiğinden istemci manipülasyonuna kapalıdır.
 * Aynı sipariş için tekrar tetiklenmesin diye sessionStorage'a işaret bırakılır.
 */
export function PurchaseTracking({ orderNumber, valueTl }: { orderNumber: string; valueTl: number }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !orderNumber || !hasAnalyticsConsent()) return;
    done.current = true;
    try {
      const key = `purchase-tracked-${orderNumber}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* sessionStorage yoksa yine de bir kez gönder */
    }
    trackPurchase({ orderNumber, valueTl });
  }, [orderNumber, valueTl]);

  return null;
}
