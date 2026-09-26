import * as Sentry from '@sentry/nextjs';
import { scrubSecrets } from '@/lib/sentry-scrub';

// bkz. sentry.client.config.ts — exactOptionalPropertyTypes altında dsn'i
// yalnızca tanımlıysa nesneye ekliyoruz.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  ...(dsn ? { dsn } : {}),
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
  // Webhook/checkout gövdelerinde e-posta/telefon gibi kişisel veri geçebileceğinden
  // varsayılan PII gönderimini kapatıyoruz; yalnızca hata mesajı ve stack trace gider.
  sendDefaultPii: false,
  // Dışarı giden isteklerin adreslerinde gizli anahtar olabilir (Telegram bot
  // anahtarı adresin içinde) — Sentry'ye gitmeden önce maskelenir.
  beforeSend: (event) => scrubSecrets(event),
  beforeSendTransaction: (event) => scrubSecrets(event),
  beforeSendSpan: (span) => scrubSecrets(span),
  beforeBreadcrumb: (breadcrumb) => scrubSecrets(breadcrumb)
});
