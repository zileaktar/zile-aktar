import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env.mjs';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

let warnedMissingSecret = false;

/**
 * Cloudflare Turnstile ("robot değilim") token'ını sunucuda doğrular.
 *
 * Giriş/kayıt token'larını Supabase kendisi doğruluyor; ödeme sayfası (/api/checkout)
 * Supabase Auth'tan geçmediği için burada Cloudflare'e biz soruyoruz. Token tek
 * kullanımlıktır ve ~5 dakika geçerlidir.
 *
 * - `TURNSTILE_SECRET_KEY` tanımlı değilse kontrol ATLANIR (Sentry'ye bir kez uyarı) —
 *   anahtar Vercel'e eklenene kadar ödeme akışı durmasın diye.
 * - Anahtar tanımlıysa "fail-closed": Cloudflare'e ulaşılamazsa da istek reddedilir.
 */
export async function verifyTurnstileToken(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      Sentry.captureMessage('TURNSTILE_SECRET_KEY tanımlı değil — ödeme sayfasında robot kontrolü devre dışı', {
        level: 'warning'
      });
    }
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== '127.0.0.1') body.set('remoteip', ip);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    Sentry.captureException(err);
    return false;
  }
}
