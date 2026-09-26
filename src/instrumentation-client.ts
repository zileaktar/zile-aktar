import * as Sentry from '@sentry/nextjs';

// Tarayıcı tarafı Sentry kurulumu. Next.js 15.3+ bu dosyayı otomatik yükler
// (eski `sentry.client.config.ts`'in yerini aldı).
//
// `dsn` alanı Sentry'nin tipinde `dsn?: string` (opsiyonel ama `string | undefined`
// değil) olarak tanımlı; tsconfig'teki `exactOptionalPropertyTypes: true` altında
// `process.env.NEXT_PUBLIC_SENTRY_DSN` (string | undefined) değerini doğrudan
// atamak derleme hatası verir. Bu yüzden anahtar, değer tanımlıysa eklenir,
// tanımlı değilse nesneye hiç girmez.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  ...(dsn ? { dsn } : {}),
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  // KVKK/GDPR: oturum kayıtlarında düz metin (ad, adres, telefon vb.) ve medya
  // sızıntısını önlemek için tüm metinler maskelenir ve medya bloklanır.
  integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
  environment: process.env.NODE_ENV,
  // Kart bilgisi VakıfBank'ın kendi ödeme sayfasında girilir, bu tarayıcı
  // oturumuna hiç girmez; yine de tedbiren form input değerleri breadcrumb'lara alınmaz.
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'ui.input') return null;
    return breadcrumb;
  }
});

// Sayfa geçişlerinin performans izlemesi (App Router).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
