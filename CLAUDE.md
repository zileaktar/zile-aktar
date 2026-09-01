# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje

"Zile Aktar" — aktar / yöresel & bitkisel ürünler e-ticaret sitesi. Next.js 14 (App Router, TS strict) + Supabase (Postgres/Auth/Storage/RLS) + iyzico (3D Secure) + Cloudflare Turnstile + Vercel (henüz deploy edilmedi).

**Her oturumun başında `devir-promptu.md`'yi oku** — projenin güncel durumu, yarım kalan işler ve ortam kısıtları orada tutulur. Mimari için `ARCHITECTURE.md`, deploy için `DEPLOYMENT.md`.

## Dil

Tüm kullanıcıya dönük metinler ve kod yorumları **Türkçe**. Değişken/fonksiyon adları İngilizce. Kullanıcı (mağaza sahibi) teknik değil — açıklamalar Türkçe ve adım adım.

## Ortam kısıtı (kritik)

Bu tool oturumu genellikle kullanıcının gerçek terminalinden **izoledir** — `npm`/`supabase`/`node` komutlarını Claude çalıştıramaz. Kod dosyalarını yaz/düzenle, ama `npm run build`, `npm run typecheck`, `supabase db push`, `npm install` gibi komutları **kullanıcıya tek tek ver, çıktıyı iste**. Değişiklikten sonra mutlaka `npm run build` ettir (typecheck + lint dahil).

`.env.local` iki yerde bulunabilir: gerçek olan `C:\Users\samet\projects\web\.env.local`. `D:\vscode\web` terk edilmiş eski kopyadır — kullanıcı yanlışlıkla onu düzenleyebilir; beklenmedik durumda hangi klasör olduğunu kontrol et.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (port 3000) |
| `npm run build` | Production derlemesi — **her değişiklikten sonra çalıştır** (tip + lint hataları burada çıkar) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`next lint`) |
| `npm run test` | Vitest birim testleri; tek dosya: `npm run test -- tests/unit/pricing.test.ts` |
| `npm run test:e2e` | Playwright (çalışan sunucu gerekir) |
| `supabase db push` | Bekleyen migration'ları remote'a uygular |
| `supabase migration list` | Local vs Remote migration durumu |

Kullanıcının portu 3000'de takılırsa: `npx kill-port 3000`. `NEXT_PUBLIC_APP_URL=http://localhost:3000` sabit — dev sunucusu 3001'e düşerse CSRF (Origin) kontrolü ve iyzico callback'i bozulur.

## Migration + tip workflow'u (dikkat)

- `supabase/migrations/*.sql` **elle yazılır, sıralıdır** (`0001`…`0013`). Yeni migration = bir sonraki numara.
- `src/lib/supabase/types.ts` **elle güncellenir** (pratikte `supabase gen types` çalıştırılmıyor). Bir DB sütunu eklerken:
  1. İlgili tablonun `Row` tipine ekle.
  2. **`Insert` tipinde `Omit<...>` listesine ekleyip yeni alanı opsiyonel (`?`) yap** — aksi halde `.insert()` çağıran her yerde build kırılır.
- Migration'lar idempotent yazılır (`add column if not exists`, `create table if not exists`, `drop policy if exists ... create policy`, enum için `do $$ ... exception when duplicate_object`).
- Kullanıcı `.env.local`'i düzenlerken yazım hatası yapabilir (ör. `IYZICO_SECRET_KE`); build `Invalid environment variables` verirse önce `.env.local`'i (C: dosyası) `grep` ile kontrol et.

## Mimari — büyük resim

### Para & sipariş
- **Tüm parasal alanlar kuruş cinsinden `integer`** (float yok). `1 TL = 100 kuruş`.
- İstemciden **asla fiyat/toplam kabul edilmez**. Sepet (Zustand, localStorage) yalnızca önizleme. Gerçek toplam `public.create_order(...)` Postgres fonksiyonunda `FOR UPDATE` satır kilidiyle DB'den hesaplanır; bu RPC yalnızca `service_role` çağırabilir, istemci `orders`'a doğrudan INSERT yapamaz (RLS'de INSERT politikası yok).
- Kargo eşiği (`15000`) ve ücreti (`3990`) hem `src/lib/pricing.ts` hem `create_order` içinde SABİT — **elle senkron tutulmalı**.

### Supabase istemci üçlüsü (`src/lib/supabase/server.ts`)
- `createSupabaseServerClient()` — kullanıcının çerezli oturumu, RLS'e tabi. Server Component / Route Handler / Server Action.
- `createSupabaseAnonServerClient()` — çerezsiz anon; `unstable_cache` içinde kullanılır (cookies() cache scope'ta yasak).
- `createSupabaseServiceRoleClient()` — RLS'i BYPASS eder. Yalnızca güvenilir sunucu işlemleri (webhook, presigned URL, admin sayfaları). **`fetch` kasıtlı `cache: 'no-store'` ile sarılı** — çerezsiz istemcinin PostgREST çağrıları aksi halde Next Data Cache'e takılıyor ve admin güncel veriyi görmüyor.
- Admin sayfaları (`/admin/**`) ayrıca `export const dynamic = 'force-dynamic'`; `next.config.mjs` `experimental.staleTimes.dynamic = 0`.

### Güvenlik (savunma derinliği — detay ARCHITECTURE.md)
`middleware.ts` (erken yönlendirme) → sayfa/route `assertRole` → **RLS** (asıl sınır, `is_staff()`/`is_admin()` SQL fonksiyonları). Zod şemaları `src/lib/validations/` altında **hem client hem server** tarafından import edilir. CSRF: Server Actions yerleşik; düz Route Handler'lar `checkTrustedOrigin()`. Rate limiting: Upstash `safeRateLimit()` ("fail-open" — Upstash erişilemezse isteğe izin verir, Sentry'ye bildirir).

### Ödeme (`src/lib/iyzico.ts`, `src/lib/payments.ts`)
- **İki yöntem:** kart (iyzico 3DS **redirect** — inline/popup değil) ve **havale/EFT** (banka hesabına ödeme, admin dekont görünce `/admin/siparisler`'den durumu elle `paid` yapar).
- Kart akışı: `/api/checkout` → `create_order` (pending) → `initializeCheckoutForm` → istemci `paymentPageUrl`'e yönlenir → iyzico 3DS → `/api/webhooks/iyzico/callback` (tarayıcı POST) → `confirmCheckoutPayment(token)`.
- `confirmCheckoutPayment` (payments.ts) **hem callback hem asenkron webhook tarafından çağrılır**: iyzico'dan `retrieveCheckoutFormResult` ile GERÇEK sonucu çeker, **tahsil edilen tutarı `orders.total_cents` ile kuruş kuruş karşılaştırır**, `mark_order_paid`/`mark_order_failed` çağırır. Sipariş kimliği `result.conversationId ?? result.basketId`.
- IYZWSv2 imza (resmi formül): `signature = HMAC_SHA256(secretKey, randomKey + uriPath + <ham JSON gövde>)` hex; auth string `apiKey:...&randomKey:...&signature:...` (iki nokta, eşittir değil) → base64. `randomKey` imzada ve `x-iyzi-rnd` header'ında AYNI olmalı. `iyzicoPost()` helper'ı bunu yönetir.
- Webhook imza (HPP formülü): `HMAC_SHA256(IYZICO_WEBHOOK_SECRET, secretKey + iyziEventType + iyziPaymentId + token + paymentConversationId + status)` hex.
- `mark_order_failed` idempotenttir (migration 0011) — çift çağrıda stok tekrar iade edilmez.
- Cron (`/api/cron/expire-pending-orders`) yalnızca `payment_provider='iyzico'` pending siparişleri 24 saat sonra iptal eder; havale siparişlerine dokunmaz.

### Sepet (Zustand)
`src/store/cart-store.ts` — `persist` + `skipHydration: true`. `CartHydrator` (providers.tsx) mount sonrası `persist.rehydrate()` çağırır → sunucu ve ilk client render'ı hep boş sepet. Sepet sayısı için **`useCartCount()`** hook'unu kullan (mount öncesi 0 döner, hydration mismatch'i önler). Sepet yalnızca `/siparis-alindi` sayfasında temizlenir (`ClearCartOnSuccess`), checkout→ödeme geçişinde DEĞİL.

### Katalog & kategoriler
- `categories.is_active` (migration 0012) — `getCategories()` sadece aktifleri döndürür. Pasif kategorilerin ürünleri de `is_active=false`.
- Ürün görselleri: `products.image_path` `/urunler/<slug>.svg` (public placeholder) veya `product-images/<dosya>` (Storage). `getProductImageUrl()` her ikisini çözer. **Claude binary PNG/JPEG üretemez** — yeni ürün için placeholder SVG yaz, kullanıcı gerçek fotoğrafı ekler. Ürün görseli aramaya ÇALIŞMA.
- Toplu katalog güncellemesi: `stok-tablosu.csv` (repo kökü) + üreteç script deseni (bkz. `devir-promptu.md`). Eşleşme slug ile; dosyada olmayan ürünler pasife alınır (silinmez — sipariş geçmişi FK'leri).

### Sağlık beyanı (mevzuat)
`HealthDisclaimer` bileşeni ürün detay + ödeme sayfasında zorunlu. `productInputSchema` (validations/product.ts) admin ürün açıklamasında "tedavi eder / iyileştirir / şifa" gibi tıbbi endikasyon ibarelerini REDDEDER.

### Ortam değişkenleri
`src/lib/env.mjs` (t3-env + Zod) build zamanında **tüm** env değişkenlerini doğrular — eksik/hatalıysa build patlar. `env.d.mts` elle yazılmış tip bildirimi (eşitle). `NEXT_PUBLIC_*` dışındaki hiçbir şey istemciye sızmaz.
