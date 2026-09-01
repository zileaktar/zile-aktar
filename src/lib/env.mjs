// Ortam değişkeni doğrulama katmanı (t3-env + Zod).
// Bu dosya build zamanında (next.config.mjs) VE çalışma zamanında import edilir.
// Herhangi bir değişken eksik/yanlış formatta ise process burada çöker —
// "gizli anahtar undefined geldi, uygulama sessizce yanlış çalıştı" senaryosu engellenir.
// server{} altındaki hiçbir alan tarayıcıya sızmaz; sadece NEXT_PUBLIC_* client'a gider.

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY eksik veya hatalı'),
    SUPABASE_STORAGE_SIGNED_URL_TTL: z.coerce.number().int().positive().default(120),

    IYZICO_API_KEY: z.string().min(1),
    IYZICO_SECRET_KEY: z.string().min(1),
    IYZICO_BASE_URL: z.string().url(),
    IYZICO_WEBHOOK_SECRET: z.string().min(1),

    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    SENTRY_ORG: z.string().min(1),
    SENTRY_PROJECT: z.string().min(1),
    SENTRY_AUTH_TOKEN: z.string().optional(),

    CRON_SECRET: z.string().min(16, 'CRON_SECRET en az 16 karakter olmalı'),
    KVKK_DATA_EXPORT_FROM_EMAIL: z.string().email()
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    // Cloudflare Turnstile site anahtarı (herkese açık). Supabase Auth'ta CAPTCHA
    // koruması açık olduğundan giriş/kayıt bu token olmadan çalışmaz.
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1)
  },
  // Next.js edge/server runtime'da process.env her zaman otomatik "spread" edilmez;
  // bu yüzden her alan burada açıkça eşleniyor.
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_SIGNED_URL_TTL: process.env.SUPABASE_STORAGE_SIGNED_URL_TTL,
    IYZICO_API_KEY: process.env.IYZICO_API_KEY,
    IYZICO_SECRET_KEY: process.env.IYZICO_SECRET_KEY,
    IYZICO_BASE_URL: process.env.IYZICO_BASE_URL,
    IYZICO_WEBHOOK_SECRET: process.env.IYZICO_WEBHOOK_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    KVKK_DATA_EXPORT_FROM_EMAIL: process.env.KVKK_DATA_EXPORT_FROM_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  },
  emptyStringAsUndefined: true
});
