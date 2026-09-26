/**
 * Sentry'ye giden olaylardan GİZLİ ANAHTARLARI temizler.
 *
 * Telegram Bot API, bot anahtarını istek ADRESİNİN İÇİNDE ister
 * (https://api.telegram.org/bot<ANAHTAR>/sendMessage). Sentry'nin performans
 * izleme (tracesSampleRate) ve iz kayıtları (breadcrumb) sunucunun dışarıya
 * yaptığı isteklerin tam adresini kaydeder — maskelenmezse bot anahtarı
 * Sentry panelinde düz metin olarak görünürdü. Bu modül sentry.server/edge
 * yapılandırmalarındaki before* kancalarında tüm string değerleri tarar.
 *
 * `server-only` DEĞİL: Sentry yapılandırma dosyalarından (edge dahil) import edilir.
 */

// Telegram bot anahtarı biçimi: <sayısal bot id>:<35 karakterlik anahtar>
const TELEGRAM_BOT_TOKEN_RE = /bot\d+:[A-Za-z0-9_-]+/g;

export function scrubSecretString(value: string): string {
  return value.replace(TELEGRAM_BOT_TOKEN_RE, 'bot[GIZLENDI]');
}

/** Nesne ağacındaki tüm string değerleri maskeler (yerinde değil, kopyalayarak). */
export function scrubSecrets<T>(input: T, depth = 0): T {
  if (depth > 8) return input;
  if (typeof input === 'string') return scrubSecretString(input) as T;
  if (Array.isArray(input)) return input.map((item) => scrubSecrets(item, depth + 1)) as T;
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      out[key] = scrubSecrets(value, depth + 1);
    }
    return out as T;
  }
  return input;
}
