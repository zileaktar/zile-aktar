import * as Sentry from '@sentry/nextjs';

// Next.js, sunucu/edge runtime başlatılırken bu dosyayı otomatik çalıştırır.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Server Component / route / Server Action içindeki yakalanmamış hatalar
// (Next.js 15 `onRequestError` kancası) Sentry'ye gider.
export const onRequestError = Sentry.captureRequestError;
