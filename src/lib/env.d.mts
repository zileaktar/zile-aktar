// env.mjs, .mjs (plain JS) olduğu için TypeScript'in tip çıkarımı yapabilmesi için
// elle yazılmış tip bildirimi. createEnv() gerçek şemayı zaten çalışma zamanında uygular;
// bu dosya yalnızca editör/derleyici tarafında tip güvenliği sağlar.
export declare const env: {
  readonly NODE_ENV: 'development' | 'test' | 'production';
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly SUPABASE_STORAGE_SIGNED_URL_TTL: number;
  readonly IYZICO_API_KEY: string;
  readonly IYZICO_SECRET_KEY: string;
  readonly IYZICO_BASE_URL: string;
  readonly IYZICO_WEBHOOK_SECRET: string;
  readonly UPSTASH_REDIS_REST_URL: string;
  readonly UPSTASH_REDIS_REST_TOKEN: string;
  readonly SENTRY_ORG: string;
  readonly SENTRY_PROJECT: string;
  readonly SENTRY_AUTH_TOKEN: string | undefined;
  readonly CRON_SECRET: string;
  readonly KVKK_DATA_EXPORT_FROM_EMAIL: string;
  readonly BREVO_API_KEY: string | undefined;
  readonly ORDER_NOTIFY_EMAIL: string | undefined;
  readonly NEXT_PUBLIC_APP_URL: string;
  readonly NEXT_PUBLIC_SUPABASE_URL: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  readonly NEXT_PUBLIC_SENTRY_DSN: string | undefined;
  readonly NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
  readonly NEXT_PUBLIC_GA_MEASUREMENT_ID: string | undefined;
  readonly NEXT_PUBLIC_META_PIXEL_ID: string | undefined;
};
