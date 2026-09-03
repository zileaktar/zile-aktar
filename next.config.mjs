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
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ],
    formats: ['image/avif', 'image/webp']
  },
  async headers() {
    // Next.js'in geliştirme sunucusu (`next dev`), Hızlı Yenileme (Fast Refresh)
    // ve kaynak haritalama için paketlenmiş JS içinde `eval()` kullanır. Üretim
    // (`next build` + `next start`/Vercel) build'i bunu KULLANMAZ. Bu yüzden
    // 'unsafe-eval' SADECE geliştirmede eklenir — production'daki asıl CSP
    // sıkılığından ödün verilmez. Bu ayrım olmadan (eskiden olduğu gibi) `next dev`
    // üzerinde tüm istemci taraflı etkileşim (buton tıklamaları dahil) tarayıcı
    // tarafından sessizce engellenir.
    // challenges.cloudflare.com: Cloudflare Turnstile CAPTCHA (giriş/kayıt) hem script
    // hem iframe (frame-src) hem de doğrulama isteği (connect-src) için gereklidir.
    const isDev = process.env.NODE_ENV === 'development';

    // Ödeme akışı REDIRECT yöntemiyle çalışır: kullanıcı iyzico'nun kendi alan
    // adındaki güvenli sayfasına gider, kart oraya girilir, ödeme bitince siteye
    // döner. Bu yüzden iyzico varlıkları bizim sayfamıza YÜKLENMEZ; CSP'de yalnızca
    // 3DS dönüşü/istisnai durumlar için *.iyzico.com bırakıldı.
    // Analytics: Google Analytics (googletagmanager.com) + Meta Pixel (connect.facebook.net).
    // Script'ler yalnızca kullanıcı çerez izni verince yüklenir (bkz. Analytics bileşeni),
    // ama CSP kaynak izni her koşulda tanımlı olmalı.
    const analyticsScript = 'https://www.googletagmanager.com https://connect.facebook.net';
    const analyticsConnect =
      'https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com';

    const scriptSrc = isDev
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.iyzico.com https://challenges.cloudflare.com ${analyticsScript}`
      : `script-src 'self' 'unsafe-inline' https://*.iyzico.com https://challenges.cloudflare.com ${analyticsScript}`;

    // `next dev` Hızlı Yenileme (Fast Refresh) için bir WebSocket (ws://localhost:*)
    // kullanır — CSP connect-src'de 'self' her tarayıcıda ws: şemasını kapsamadığı
    // için bu SADECE geliştirmede açıkça eklenir. Production connect-src sıkı kalır.
    const connectSrc = isDev
      ? `connect-src 'self' ws://localhost:* http://localhost:* https://*.supabase.co https://*.iyzico.com https://*.sentry.io https://challenges.cloudflare.com ${analyticsConnect}`
      : `connect-src 'self' https://*.supabase.co https://*.iyzico.com https://*.sentry.io https://challenges.cloudflare.com ${analyticsConnect}`;

    return [
      {
        // Tüm rotalara uygulanan temel güvenlik başlıkları (defense in depth).
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              // Sentry oturum kaydı (session replay), sıkıştırmayı bir blob: URL'den
              // yüklenen web worker'da yapar. worker-src tanımlı değilse tarayıcı
              // script-src'ye düşer ve blob: engellenir.
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://*.supabase.co https://images.unsplash.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
              connectSrc,
              "frame-src https://*.iyzico.com https://challenges.cloudflare.com",
              "frame-ancestors 'none'"
            ].join('; ')
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
