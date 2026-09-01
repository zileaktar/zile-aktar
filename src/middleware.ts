import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env.mjs';
import type { Database } from '@/lib/supabase/types';

/**
 * Her istekte çalışır (Edge Runtime):
 *  1. Supabase oturum çerezini yeniler (access token süresi dolmadan).
 *  2. /admin ve /hesabim altındaki rotaları kimlik doğrulama + rol kontrolüyle korur.
 * Gerçek veri erişimi yine RLS ile korunur — middleware yalnızca sayfa
 * seviyesinde erken yönlendirme yaparak kullanıcı deneyimini iyileştirir,
 * TEK güvenlik katmanı olarak GÜVENİLMEZ (bu yüzden RLS de zorunlu).
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

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
