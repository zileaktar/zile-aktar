import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env.mjs';
import type { Database } from '@/lib/supabase/types';

// Analytics: Google Analytics (googletagmanager.com) + Meta Pixel (connect.facebook.net).
// Script'ler yalnızca kullanıcı çerez izni verince yüklenir (bkz. Analytics bileşeni),
// ama CSP kaynak izni her koşulda tanımlı olmalı.
const ANALYTICS_SCRIPT = 'https://www.googletagmanager.com https://connect.facebook.net';
// www.google.com: GA4 bazı ölçüm beacon'larını (özellikle dönüşüm/Google
// sinyalleri) buraya gönderir — yalnızca google-analytics.com yetmez.
const ANALYTICS_CONNECT =
  'https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.google.com https://connect.facebook.net https://www.facebook.com';

/**
 * Her istekte YENİ, rastgele bir CSP nonce'u üretir ve tam CSP başlığını
 * kurar. Nonce hem yanıt başlığına (`Content-Security-Policy`) hem isteğe
 * (`x-nonce` header'ı — Server Component'lerin `headers()` ile okuyabilmesi
 * için) yazılır.
 *
 * Next.js, kendi enjekte ettiği script'lere (hydration/RSC akışı) VE
 * `next/script` bileşenlerine (Analytics.tsx) bu nonce'u OTOMATİK uygular.
 * Elle yazılan `<script dangerouslySetInnerHTML>` etiketlerine (JSON-LD —
 * layout.tsx, urun/[slug]/page.tsx, sss/page.tsx, Breadcrumbs.tsx) ve
 * Turnstile'ın kendi script'ine (CaptchaField.tsx, `scriptOptions.nonce`)
 * nonce'un elle geçirilmesi gerekir — bu sayede script-src'deki
 * `'unsafe-inline'` kaldırılabilmiştir.
 *
 * `'strict-dynamic'`: nonce'lu bir script'in YÜKLEDİĞİ başka script'ler
 * (ör. gtag.js'in çağırdığı ek script'ler) host listesine bakılmaksızın
 * güvenilir sayılır. Bu deyimi ANLAMAYAN eski tarayıcılar host listesine
 * (aşağıdaki https://... adresleri) geri düşer — ikisi birlikte tutulur.
 */
function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://*.iyzico.com https://challenges.cloudflare.com ${ANALYTICS_SCRIPT}`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.iyzico.com https://challenges.cloudflare.com ${ANALYTICS_SCRIPT}`;

  // `next dev` Hızlı Yenileme (Fast Refresh) için bir WebSocket (ws://localhost:*)
  // kullanır — SADECE geliştirmede eklenir, production connect-src sıkı kalır.
  const connectSrc = isDev
    ? `connect-src 'self' ws://localhost:* http://localhost:* https://*.supabase.co https://*.iyzico.com https://*.sentry.io https://challenges.cloudflare.com ${ANALYTICS_CONNECT}`
    : `connect-src 'self' https://*.supabase.co https://*.iyzico.com https://*.sentry.io https://challenges.cloudflare.com ${ANALYTICS_CONNECT}`;

  return [
    "default-src 'self'",
    scriptSrc,
    // Sentry oturum kaydı (session replay), sıkıştırmayı bir blob: URL'den
    // yüklenen web worker'da yapar. worker-src tanımlı değilse tarayıcı
    // script-src'ye düşer ve blob: engellenir.
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
    connectSrc,
    // Ödeme akışı REDIRECT yöntemiyle çalışır: kullanıcı iyzico'nun kendi alan
    // adındaki güvenli sayfasına gider; CSP'de yalnızca 3DS dönüşü/istisnai
    // durumlar için *.iyzico.com bırakıldı.
    "frame-src https://*.iyzico.com https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
    "frame-ancestors 'none'"
  ].join('; ');
}

/**
 * Her istekte çalışır (Edge Runtime):
 *  1. CSP nonce'u üretir + güvenlik başlığını kurar.
 *  2. Supabase oturum çerezini yeniler (access token süresi dolmadan).
 *  3. /admin ve /hesabim altındaki rotaları kimlik doğrulama + rol kontrolüyle korur.
 * Gerçek veri erişimi yine RLS ile korunur — middleware yalnızca sayfa
 * seviyesinde erken yönlendirme yaparak kullanıcı deneyimini iyileştirir,
 * TEK güvenlik katmanı olarak GÜVENİLMEZ (bu yüzden RLS de zorunlu).
 */
export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = env.NODE_ENV === 'development';
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  // bkz. src/lib/supabase/server.ts — @supabase/ssr@0.5.2'nin kırık iç tip importu
  // yüzünden generic'siz oluşturup kendi Database tipimize cast ediyoruz.
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production' });
        });
      }
    }
  }) as unknown as SupabaseClient<Database>;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAccountRoute = pathname.startsWith('/hesabim');

  if ((isAdminRoute || isAccountRoute) && !user) {
    const loginUrl = new URL('/giris', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Statik dosyalar, Next.js dahili yolları ve OG görsel üretimi dışındaki
     * tüm sayfa isteklerinde çalış.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif)$).*)'
  ]
};
