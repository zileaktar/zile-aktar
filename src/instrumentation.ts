// Next.js, sunucu/edge runtime başlatılırken bu dosyayı otomatik çalıştırır
// (next.config.mjs içinde ek bir ayara gerek yoktur, Next.js 14+ built-in).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
