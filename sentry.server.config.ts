import * as Sentry from '@sentry/nextjs';

// bkz. sentry.client.config.ts — exactOptionalPropertyTypes altında dsn'i
// yalnızca tanımlıysa nesneye ekliyoruz.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  ...(dsn ? { dsn } : {}),
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
  // Webhook/checkout gövdelerinde e-posta/telefon gibi kişisel veri geçebileceğinden
  // varsayılan PII gönderimini kapatıyoruz; yalnızca hata mesajı ve stack trace gider.
  sendDefaultPii: false
});
