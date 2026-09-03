'use client';

/**
 * Google Analytics 4 + Meta (Facebook) Pixel olay yardımcıları.
 * Script'ler yalnızca kullanıcı çerez banner'ında "Tümünü Kabul Et" dediğinde
 * yüklenir (bkz. src/components/analytics/Analytics.tsx). Bu fonksiyonlar
 * `window.gtag` / `window.fbq` yoksa sessizce hiçbir şey yapmaz.
 */

type AnyFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: AnyFn;
    fbq?: AnyFn;
    dataLayer?: unknown[];
  }
}

export const CONSENT_KEY = 'kokten-aktar-cookie-consent-v1';
export const CONSENT_EVENT = 'cookie-consent-change';

/** Kullanıcı tüm çerezleri (analitik/pazarlama dahil) kabul etti mi? */
export function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as { level?: string }).level === 'all';
  } catch {
    return false;
  }
}

/**
 * SPA (tek sayfa uygulaması) rota değişiminde sayfa görüntüleme.
 * GA4'ün "Gelişmiş Ölçüm" özelliği (varsayılan açık) tarayıcı geçmişi
 * olaylarını zaten yakaladığından burada GA'ya TEKRAR göndermeyiz (çift
 * sayım olmasın). Meta Pixel ise SPA gezinmelerini otomatik izlemez —
 * onu elle tetikleriz.
 */
export function trackPageView(): void {
  window.fbq?.('track', 'PageView');
}

export function trackAddToCart(p: { name: string; priceTl: number; quantity: number }): void {
  const value = Math.round(p.priceTl * p.quantity * 100) / 100;
  window.gtag?.('event', 'add_to_cart', {
    currency: 'TRY',
    value,
    items: [{ item_name: p.name, price: p.priceTl, quantity: p.quantity }]
  });
  window.fbq?.('track', 'AddToCart', { currency: 'TRY', value, content_name: p.name });
}

export function trackBeginCheckout(valueTl: number): void {
  const value = Math.round(valueTl * 100) / 100;
  window.gtag?.('event', 'begin_checkout', { currency: 'TRY', value });
  window.fbq?.('track', 'InitiateCheckout', { currency: 'TRY', value });
}

export function trackPurchase(p: { orderNumber: string; valueTl: number }): void {
  const value = Math.round(p.valueTl * 100) / 100;
  window.gtag?.('event', 'purchase', { transaction_id: p.orderNumber, currency: 'TRY', value });
  window.fbq?.('track', 'Purchase', { currency: 'TRY', value });
}
