import { withSentryConfig } from '@sentry/nextjs';

// env.mjs, uygulama build edilmeden önce tüm ortam değişkenlerini doğrular.
// Eksik/hatalı bir değişken varsa build burada patlar (production'da sessizce yanlış çalışmaz).
await import('./src/lib/env.mjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // İstemci tarafı Router Cache: dinamik sayfalar (admin paneli, sipariş listeleri)
    // her gezinmede yeniden çekilsin — aksi halde admin, birkaç dakika önce ziyaret
    // ettiği "Siparişler" sayfasının eski (yeni siparişleri içermeyen) halini görür.
    staleTimes: { dynamic: 0, static: 180 }
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/**' }],
    formats: ['image/avif', 'image/webp']
  },
  async headers() {
    // Content-Security-Policy artık BURADA değil, src/middleware.ts'te kuruluyor:
    // nonce her istekte değiştiği için (script-src'deki 'unsafe-inline' onun
    // yerine kaldırıldı), next.config.mjs'nin build-time sabit headers() API'si
    // buna uygun değil — middleware her isteği ayrı ayrı işleyebiliyor.
    return [
      {
        // Tüm rotalara uygulanan temel güvenlik başlıkları (defense in depth).
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS: tarayıcı bu siteyi 2 yıl boyunca YALNIZCA HTTPS üzerinden açar.
          // Yalnız HTTPS yanıtlarında etkilidir (tarayıcı HTTP'de gelen HSTS'i yok
          // sayar) — bu yüzden localhost/dev'i etkilemez. `preload` ile HSTS
          // preload listesine başvurulabilir (özel domain alınınca).
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
      // NOT: /api/webhooks/* rotalarına kasıtlı olarak Access-Control-Allow-Origin
      // eklenmedi. iyzico bu uca TARAYICIDAN değil sunucudan sunucuya POST atar;
      // CORS başlıkları yalnızca TARAYICININ cross-origin bir fetch() yanıtını
      // OKUMASINI kısıtlar/izin verir — sunucu-sunucu isteklerini hiçbir şekilde
      // etkilemez veya kısıtlamaz. Buraya bir Access-Control-Allow-Origin eklemek
      // gerçek bir erişim kontrolü sağlamadan "güvenli görünme" yanılsaması yaratır;
      // asıl koruma src/lib/iyzico.ts#verifyIyzicoWebhookSignature() imza
      // doğrulamasıdır (bkz. src/app/api/webhooks/iyzico/route.ts).
    ];
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // v7'deki hideSourceMaps kaldırıldı; @sentry/nextjs v8 zaten sourceMappingURL'siz
  // ("gizli") bundle üretir. Kaynak harita yönetimi tamamen SENTRY_AUTH_TOKEN'a bağlı:
  //  - Token VARSA: haritalar Sentry'ye yüklenir (okunaklı stack trace) ve build
  //    çıktısından silinir (deleteSourcemapsAfterUpload) — kullanıcıya sızmaz.
  //  - Token YOKSA: harita hiç üretilmez (disable) — yüklenmeyecek haritayı üretip
  //    servis etmenin anlamı yok; Sentry zaten minified gösterir.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  disableLogger: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true
  }
});
