'use client';

// Tarayıcıda çalışan Supabase istemcisi. Yalnızca "anon" anahtarı kullanır;
// tüm veri erişimi PostgreSQL Row Level Security (RLS) politikaları ile sınırlanır,
// bu yüzden anon key'in herkese açık olması güvenlik açığı değildir.
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env.mjs';
import type { Database } from '@/lib/supabase/types';

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
