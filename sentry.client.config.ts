import * as Sentry from '@sentry/nextjs';

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
  integrations: [Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false })],
  environment: process.env.NODE_ENV,
  // Kart formu iframe'i iyzico'nun kendi domain'inde olduğundan hassas veri
  // (kart no, CVV) bu tarayıcı oturumuna hiç girmez; yine de tedbiren
  // olası form input değerlerini breadcrumb'lardan filtreliyoruz.
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'ui.input') return null;
    return breadcrumb;
  }
});
