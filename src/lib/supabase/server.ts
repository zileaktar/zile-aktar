import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createRawClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env.mjs';
import type { Database } from '@/lib/supabase/types';

/**
 * Server Component / Route Handler / Server Action içinde kullanılan Supabase istemcisi.
 * Kullanıcının oturum çerezini (HttpOnly) taşır; sorgular RLS politikalarına tabidir —
 * yani bir kullanıcı yalnızca kendi verisine (siparişleri, profili) erişebilir.
 *
 * NOT: `createServerClient<Database>(...)` generic'i KASITLI olarak kullanılmıyor.
 * Yüklü @supabase/ssr@0.5.2 (paketin en güncel sürümü), kendi tip tanımında artık var
 * olmayan bir @supabase/supabase-js iç yoluna (`dist/module/lib/types`) import atıyor —
 * supabase-js 2.x'in yeni `exports` haritası bu derin yolu tamamen kapatmış durumda.
 * Bu saf bir TİP seviyesi uyumsuzluk (çalışma zamanını etkilemez, `import type` derleme
 * anında silinir); ama generic'i olduğu gibi kullanırsak her `.from()` sorgusu `never`'a
 * düşüyor. Çözüm: client'ı generic'siz oluşturup, supabase-js'in KENDİ (bozulmamış)
 * `SupabaseClient` tipine açıkça cast ediyoruz — tip güvenliğini paketler arası kırık
 * jenerik zincirine değil, doğrudan bizim `Database` tanımımıza bağlıyoruz.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: env.NODE_ENV === 'production',
              sameSite: 'lax'
            });
          });
        } catch {
          // Server Component içinden çağrıldıysa cookie set edilemez (Next.js kısıtı);
          // middleware zaten oturumu yeniliyor olduğu için burada sessizce yok sayılır.
        }
      }
    }
  }) as unknown as SupabaseClient<Database>;
}

/**
 * Çerez OKUMAYAN, yalnızca "anon" anahtarla çalışan salt-okunur istemci.
 * `next/cache`'in `unstable_cache(...)` sarmalayıcısı içinde `cookies()`/`headers()`
 * çağrılmasına İZİN VERMEZ (Next.js bunu build hatası olarak fırlatır — önbellek,
 * kullanıcıdan bağımsız/paylaşılan bir sonuç saklar, bu yüzden istek bazlı verilere
 * dokunamaz). Kategoriler gibi herkese açık, kullanıcıdan bağımsız veriler
 * `unstable_cache` ile önbelleklenirken bu istemci kullanılır — RLS yine de
 * geçerlidir (`categories_public_read` politikası zaten `true`, yani anon dahil
 * herkes okuyabilir), sadece çerez taşımaz.
 */
export function createSupabaseAnonServerClient(): SupabaseClient<Database> {
  return createRawClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  }) as unknown as SupabaseClient<Database>;
}

/**
 * Yönetici (service_role) istemcisi — RLS'i TAMAMEN BYPASS EDER.
 * Yalnızca güvenilir sunucu-taraflı işlemlerde kullanılır: webhook işleme,
 * presigned URL üretimi, admin sayfaları/API uçları. ASLA client component'e
 * aktarılmaz, ASLA kullanıcı girdisiyle doğrudan filtre kurmadan sorgu çalıştırılmaz.
 *
 * `fetch` KASITLI olarak `cache: 'no-store'` ile sarmalanır: bu istemci çerez
 * taşımadığından Next.js App Router onun PostgREST isteklerini varsayılan olarak
 * Data Cache'e alır ve admin panelinde YENİ siparişler/güncel stok görünmezdi.
 * Admin verisi her zaman canlı olmalı.
 */
export function createSupabaseServiceRoleClient() {
  return createRawClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' })
    }
  });
}
