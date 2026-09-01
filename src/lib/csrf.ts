import 'server-only';
import { env } from '@/lib/env.mjs';

/**
 * CSRF koruması — "double submit" yerine Origin/Referer doğrulama deseni.
 * Next.js Server Actions'ta bu kontrol framework tarafından otomatik yapılır;
 * bu yardımcı, state değiştiren düz Route Handler'lar (POST /api/checkout,
 * /api/account/delete vb.) için aynı korumayı elle uygular. Cookie'ler
 * SameSite=lax olduğundan farklı-origin form/script istekleri zaten
 * kimlik bilgisi taşımaz; bu kontrol ek bir savunma katmanıdır.
 */
export function checkTrustedOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin');
  // Tarayıcı dışı istemciler (sunucudan sunucuya, mobil app) origin göndermeyebilir;
  // bu uç noktalar zaten ayrı bir API anahtarı/servis kimliğiyle korunmalıdır.
  if (!origin) return null;

  const allowed = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  if (origin !== allowed) {
    return new Response(JSON.stringify({ error: 'Geçersiz istek kaynağı (CSRF).' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}
