# Kökten Aktar — Mimari

Next.js 14 (App Router, TypeScript strict) + Supabase (PostgreSQL, Auth, Storage, RLS) + iyzico (3D Secure) + Vercel.

## Teknoloji Yığını

| Katman | Teknoloji | Neden |
|---|---|---|
| Frontend | Next.js 14 App Router, React 18, TypeScript (strict) | Server Components ile SEO + hız, tek dilde uçtan uca tip güvenliği |
| Stil | Tailwind CSS | Var olan tasarım sistemiyle (renk paleti, tipografi) birebir eşleşme |
| Backend | Next.js Route Handlers + Server Actions | Ayrı bir backend servisi işletmeden tam API yüzeyi |
| Veritabanı | PostgreSQL (Supabase) | RLS, güçlü tip sistemi, ilişkisel bütünlük (FK/CHECK) |
| Auth | Supabase Auth (GoTrue) | Bcrypt hash'leme, HttpOnly/Secure/SameSite çerez tabanlı oturum, e-posta doğrulama hazır |
| Depolama | Supabase Storage | Presigned upload URL, public/private bucket politikaları |
| State (client) | Zustand (+ persist) | Sepet ve UI durumu — localStorage kalıcılığı |
| State (server) | TanStack Query | İleride client-taraflı veri çekme/mutasyon senaryoları için altyapı hazır |
| Ödeme | iyzico Checkout Form (3DS) | Türkiye pazarı standardı, PCI-DSS kapsamını daraltır |
| Rate Limiting | Upstash Redis (Ratelimit) | Vercel Edge uyumlu, TCP bağlantısı gerektirmez |
| Observability | Sentry | Client + server + edge hata izleme, session replay |
| Test | Vitest (unit) + Playwright (e2e) | İş mantığı + ana kullanıcı akışı kapsamı |
| Deployment | Vercel | Next.js native, otomatik SSL, kolay custom domain |

## Dizin Yapısı

```
web/
├─ legacy-static-demo/         # Önceki tek-dosyalık statik prototip (referans)
├─ supabase/
│  ├─ migrations/              # Sıralı SQL migration'lar (şema + RLS + RPC)
│  └─ seed.sql                 # Geliştirme/demo verisi
├─ src/
│  ├─ app/
│  │  ├─ page.tsx              # Anasayfa (SSR, kategori/arama filtreleme)
│  │  ├─ urun/[slug]/          # Ürün detayı (SEO metadata + JSON-LD)
│  │  ├─ checkout/             # Ödeme formu + kart önizleme simülasyonu
│  │  ├─ giris/, kayit/        # Supabase Auth
│  │  ├─ hesabim/              # Profil, sipariş geçmişi, KVKK veri talebi
│  │  ├─ admin/                # RBAC korumalı yönetim paneli
│  │  ├─ api/
│  │  │  ├─ checkout/          # Sunucu taraflı fiyat/stok doğrulama + sipariş
│  │  │  ├─ upload/presigned-url/
│  │  │  ├─ webhooks/iyzico/   # İmza doğrulama + idempotency
│  │  │  ├─ account/export|delete/  # KVKK
│  │  │  ├─ cron/expire-pending-orders/
│  │  │  └─ og/                # Dinamik OpenGraph görseli
│  │  ├─ sitemap.ts, robots.ts
│  │  └─ layout.tsx
│  ├─ components/               # UI bileşenleri (layout, cart, product, checkout, account, consent)
│  ├─ lib/
│  │  ├─ env.mjs                # Zod ile ortam değişkeni doğrulama (t3-env)
│  │  ├─ supabase/              # server/client/service-role istemcileri + types.ts
│  │  ├─ validations/           # Paylaşılan Zod şemaları (client + server)
│  │  ├─ iyzico.ts              # Ödeme istemcisi (imzalama + webhook doğrulama)
│  │  ├─ rate-limit.ts, csrf.ts, rbac.ts, pricing.ts, media.ts, format.ts
│  │  └─ data/products.ts       # Sorgu katmanı (cache + tam metin arama)
│  ├─ store/                    # Zustand: cart-store, ui-store
│  └─ middleware.ts             # Oturum yenileme + RBAC route guard
├─ tests/
│  ├─ unit/                     # Vitest
│  └─ e2e/                      # Playwright
├─ sentry.*.config.ts, src/instrumentation.ts
├─ .env.example
└─ vercel.json                  # Cron job tanımı
```

## Veritabanı Şeması (özet)

```
profiles (id -> auth.users, role: admin|moderator|user)
addresses (user_id -> profiles)
categories (slug unique)
products (category_id -> categories, slug unique, full-text search index)
product_variants (product_id -> products, sku unique, price_cents, stock)
carts / cart_items (user_id -> profiles)  — cihazlar arası sepet senkronu için hazır altyapı
orders (user_id -> profiles NULLABLE, order_number unique, status enum, shipping_address jsonb anlık görüntü)
order_items (order_id -> orders, product/variant anlık görüntü alanları)
webhook_events (provider, event_id UNIQUE)  — idempotency
data_requests (user_id -> profiles SET NULL, user_email_snapshot)  — KVKK denetim izi
```

Tüm parasal alanlar **kuruş cinsinden `integer`** (float yuvarlama hatası yok).
Tüm tablolarda RLS **açık**; erişim `is_staff()`/`is_admin()` SQL fonksiyonlarıyla rol bazlı kısıtlanır.
Sipariş oluşturma, `create_order(...)` adlı **atomik bir Postgres fonksiyonu** üzerinden yapılır (satır kilidi ile eşzamanlı stok yarışını önler) ve yalnızca `service_role` çağırabilir — istemci hiçbir zaman doğrudan `orders` tablosuna INSERT yapamaz.

## Güvenlik Katmanları (savunma derinliği)

1. **Middleware** (`src/middleware.ts`) — `/admin`, `/hesabim` için erken auth/rol yönlendirmesi.
2. **Route/Layout seviyesi** — her korumalı sayfa/route handler kendi `assertRole`/`redirect` kontrolünü tekrar yapar.
3. **RLS** — asıl veri erişim sınırı; üstteki iki katman atlatılsa bile veritabanı korur.
4. **Zod doğrulama** — istemciden gelen her gövde, hem client (UX) hem server (güvenlik sınırı) tarafında aynı şemayla doğrulanır.
5. **CSRF** — Server Actions için Next.js yerleşik Origin kontrolü; düz Route Handler'lar için `checkTrustedOrigin`.
6. **Rate limiting** — checkout/auth/webhook uçları IP bazlı sınırlanır (Upstash).
7. **Webhook imza doğrulama + idempotency** — iyzico bildirimleri HMAC-SHA256 ile doğrulanır, aynı olay iki kez işlenmez.
8. **Fiyat/stok güveni** — istemciden ASLA fiyat kabul edilmez; toplam her zaman `create_order` RPC'sinde DB'den hesaplanır.
9. **T.C. Kimlik No doğrulaması** (`src/lib/tc-kimlik-no.ts`) — kart ödemesinde iyzico'ya giden `identityNumber`, resmi
   checksum algoritmasıyla doğrulanır (hem client hem `/api/checkout` içinde ikinci kez); "11111111111" gibi sahte
   değerler reddedilir.

## Denetim Geçmişi

Bir öz-denetim (self-audit) sırasında bulunup düzeltilen gerçek bulgular:

- **JSON-LD XSS** — ürün detay sayfasındaki `dangerouslySetInnerHTML`, `JSON.stringify()`'ın kaçırmadığı `</script>`
  dizisine karşı `safeJsonLd()` (bkz. `src/lib/format.ts`) ile korunuyor.
- **Yanıltıcı CORS başlığı** — webhook rotasındaki işlevsiz `Access-Control-Allow-Origin` kaldırıldı (server-to-server
  isteklerde CORS zaten uygulanmaz; asıl koruma imza doğrulamasıdır).
- **iyzico 3DS callback rotasına rate limiting eklendi.**
- **CRON_SECRET karşılaştırması** `crypto.timingSafeEqual` ile sabit zamanlı hale getirildi.
- **Sahte T.C. Kimlik No** (`'11111111111'`) kaldırıldı, checkout formundan toplanan ve algoritmik olarak doğrulanan
  gerçek değerle değiştirildi (yukarıdaki madde 9).

## Bilinçli Kapsam Sınırları

Bu depo, gerçek bir production temeli olacak şekilde uçtan uca çalışır durumda kurgulanmıştır; ancak dürüstlük adına
neyin tam teşekküllü, neyin "gösterilen desenle genişletilmesi gereken" olduğu açıkça belirtilmiştir:

- **Tam teşekküllü:** şema/RLS/RPC, auth, checkout akışı (fiyat/stok/RLS/atomiklik), iyzico imzalama + webhook idempotency,
  presigned upload, KVKK export/delete, rate limiting, CSRF, Sentry, middleware RBAC, unit + e2e test iskeleti.
- **Desen gösterildi, genişletilmeli:** Admin panelindeki ürün OLUŞTURMA/DÜZENLEME formu (liste + presigned upload akışı
  hazır; form UI'ı `productInputSchema` şemasına bağlanarak birebir aynı desenle eklenir). Kategori yönetim ekranı de aynı şekilde.
- **Test edilmedi:** Bu kod, Node.js'in kurulu OLMADIĞI bir ortamda yazıldı — `npm install`/`next build`/`vitest`/`playwright`
  hiç çalıştırılamadı. Kodun kendisi (syntax, import yolları, tip tutarlılığı) gözden geçirilerek yazıldı, ama gerçek bir
  derleme/test geçişi YAPILMADI. İlk kurulumda `npm run typecheck && npm run build` çalıştırıp çıkan hataları düzeltmeyi
  planlayın.
