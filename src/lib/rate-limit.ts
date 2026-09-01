import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env.mjs';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN
});

/**
 * IP bazlı, kayan pencere (sliding window) hız sınırlayıcılar.
 * Vercel Edge Runtime uyumlu (Upstash REST API üzerinden, TCP bağlantısı gerektirmez).
 * Her hassas uç nokta kendi limitini tanımlar — checkout ve auth login gibi
 * kaba kuvvet/kart deneme saldırılarına açık uçlar daha sıkı sınırlanır.
 */
export const checkoutRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'ratelimit:checkout',
  analytics: true
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '5 m'),
  prefix: 'ratelimit:auth',
  analytics: true
});

export const webhookRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'ratelimit:webhook',
  analytics: true
});

export const generalApiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'ratelimit:api',
  analytics: true
});

/**
 * `.limit()` çağrısını Upstash'e erişilemediği durumlara (yanlış/placeholder
 * kimlik bilgileri, geçici ağ sorunu) karşı GÜVENLİ hale getirir. Daha önce
 * her route bu çağrıyı KENDİ try/catch'inin DIŞINDA yapıyordu — Upstash
 * ulaşılamaz olduğunda çağrı fırlattığı istisna hiçbir yerde yakalanmıyor,
 * Next.js route tamamen çöküyor ve istemciye boş bir gövde dönüyordu ("JSON.parse:
 * unexpected end of data" hatasının gerçek sebebi buydu). Burada "fail open"
 * (Upstash çalışmıyorsa isteğe izin ver) tercih edildi: hız sınırlamanın
 * kendisi ARIZALANDIĞINDA sitenin tamamen durması, saldırı riskinden daha
 * kötü bir sonuçtur — arıza Sentry'ye bildirilir, admin haberdar olur.
 */
export async function safeRateLimit(limiter: Ratelimit, identifier: string): Promise<{ success: boolean; reset: number }> {
  try {
    const { success, reset } = await limiter.limit(identifier);
    return { success, reset };
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'rate-limit-unavailable' } });
    // reset burada hiç kullanılmaz: success=true olduğundan çağıran taraftaki
    // "if (!success)" bloğu (Retry-After hesaplaması dahil) zaten çalışmaz.
    return { success: true, reset: Date.now() };
  }
}

/**
 * Vercel/proxy arkasında gerçek istemci IP'sini çıkarır.
 * x-forwarded-for ilk değeri spoofable olabileceğinden yalnızca
 * güvenilir proxy (Vercel Edge Network) arkasında çalıştığı varsayılır.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? '127.0.0.1';
}
