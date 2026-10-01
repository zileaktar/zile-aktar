'use client';

// Tarayıcıda çalışan Supabase istemcisi. Yalnızca "anon" anahtarı kullanır;
// tüm veri erişimi PostgreSQL Row Level Security (RLS) politikaları ile sınırlanır,
// bu yüzden anon key'in herkese açık olması güvenlik açığı değildir.
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env.mjs';
import type { Database } from '@/lib/supabase/types';

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * YALNIZCA şifre sıfırlama İSTEĞİ için ("Şifremi unuttum"). @supabase/ssr istemcisi
 * PKCE kullanır: e-postadaki bağlantı yalnızca isteğin yapıldığı tarayıcıda çalışır
 * (bilgisayardan isteyip telefondan açan müşteri "geçersiz bağlantı" görüyordu).
 * "implicit" akışta Supabase, doğrulama sonrası oturumu bağlantının #hash kısmında
 * gönderir — hangi cihazda açılırsa açılsın /sifre-yenile sayfası oturumu kurar.
 * Oturum saklamaz; yalnızca isteği gönderir.
 */
export function createSupabaseImplicitAuthClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
