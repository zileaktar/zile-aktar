# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje

"Zile Aktar" — aktar / yöresel & bitkisel ürünler e-ticaret sitesi. Next.js 15.5 (App Router, TS strict, React 19) + Supabase (Postgres/Auth/Storage/RLS) + VakıfBank Sanal POS (3D Secure, Güvenli Ortak Ödeme) + Cloudflare Turnstile + Vercel Pro (canlı: `https://zileaktar.com`).

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

Kullanıcının portu 3000'de takılırsa: `npx kill-port 3000`. `NEXT_PUBLIC_APP_URL=http://localhost:3000` sabit — dev sunucusu 3001'e düşerse CSRF (Origin) kontrolü bozulur.

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
- Kargo eşiği (`70000` = 700 TL) ve ücreti (`3990`) hem `src/lib/pricing.ts` hem `create_order`/`preview_coupon` içinde SABİT — **elle senkron tutulmalı**. Değiştirirken üçünü birden güncelleyen yeni bir migration yaz (bkz. `0020_free_shipping_threshold.sql`).

### Supabase istemci üçlüsü (`src/lib/supabase/server.ts`)
- `createSupabaseServerClient()` — kullanıcının çerezli oturumu, RLS'e tabi. Server Component / Route Handler / Server Action.
- `createSupabaseAnonServerClient()` — çerezsiz anon; `unstable_cache` içinde kullanılır (cookies() cache scope'ta yasak).
- `createSupabaseServiceRoleClient()` — RLS'i BYPASS eder. Yalnızca güvenilir sunucu işlemleri (webhook, presigned URL, admin sayfaları). **`fetch` kasıtlı `cache: 'no-store'` ile sarılı** — çerezsiz istemcinin PostgREST çağrıları aksi halde Next Data Cache'e takılıyor ve admin güncel veriyi görmüyor.
- Admin sayfaları (`/admin/**`) ayrıca `export const dynamic = 'force-dynamic'`; `next.config.mjs` `experimental.staleTimes.dynamic = 0`.

### Güvenlik (savunma derinliği — detay ARCHITECTURE.md)
`middleware.ts` (erken yönlendirme) → sayfa/route `assertRole` → **RLS** (asıl sınır, `is_staff()`/`is_admin()` SQL fonksiyonları). Zod şemaları `src/lib/validations/` altında **hem client hem server** tarafından import edilir. CSRF: Server Actions yerleşik; düz Route Handler'lar `checkTrustedOrigin()`. Rate limiting: Upstash `safeRateLimit()` ("fail-open" — Upstash erişilemezse isteğe izin verir, Sentry'ye bildirir).

### Ödeme (`src/lib/vakifbank.ts`, `src/lib/payments.ts`) — VakıfBank Sanal POS
- **iyzico tamamen kaldırıldı** (Eylül 2026). Aktif sağlayıcı: VakıfBank "Güvenli Ortak Ödeme" (CommonPayment) — kart bilgisi bizim sunucumuza HİÇ gelmez, müşteri VakıfBank'ın barındırdığı sayfada girer. "Standart API" (kartı bizim formdan iletmek) bilinçli olarak KULLANILMIYOR (PCI-DSS yükü).
- **İki yöntem:** kart (VakıfBank 3DS, tam sayfa **redirect**) ve **havale/EFT** (admin dekont görünce `/admin/siparisler`'den durumu elle `paid` yapar). `payment_provider` = `'vakifbank'` | `'havale'` (eski siparişlerde `'iyzico'` kalabilir).
- Kart akışı: `/api/checkout` → `create_order` (pending) → `createCommonPaymentToken` (CreateTokenCPY) → `orders.payment_conversation_id` = PaymentToken → istemci `CommonPaymentUrl?PTKN=` adresine yönlenir → banka `SuccessUrl`/`FailUrl` = `/api/webhooks/vakifbank/return?order=&e=&t=` → `confirmVakifbankPayment(orderId)`.
- Dönüş URL'i: `order-token.ts` `signPaymentReturn(orderId, expiresAt)` — HMAC, süre (`e`, 2 saat) imzanın içinde. Banka URL'e kendi `Rc/Message/...` parametrelerini de ekler ama kod bunlara GÜVENMEZ.
- `confirmVakifbankPayment`: GetVposTransaction ile GERÇEK sonucu sorgular. `Rc` yoksa (`not_final`) stoğa dokunmaz. Başarı = `Rc==='0000' && AuthResultCode==='0000'` + tutar `orders.total_cents` ile kuruş kuruş eşleşmeli. `mark_order_paid` **boolean döner** (migration 0035): false ise sipariş durumu yeniden okunur; zaten `paid` ise e-posta tekrar gitmez, değilse Sentry `fatal` ("para çekildi, sipariş kapalı").
- `mark_order_failed` idempotenttir (migration 0011).
- Cron (`/api/cron/expire-pending-orders`) `payment_provider='vakifbank'` pending siparişleri 1 saat sonra (cron 15 dakikada bir çalışır, 20. dakikada tek hatırlatma e-postası), **iptal etmeden önce bankaya sorarak** kapatır (ödenmişse kurtarır; banka sorgusu hata verirse iptali erteler). Havale siparişlerine dokunmaz.
- **Yerelde tam ödeme akışı TEST EDİLEMEZ:** VakıfBank güvenlik duvarı `SuccessUrl`'de `localhost` görünce isteği HTML "Request Rejected" ile reddeder. Test `zileaktar.com` üzerinde yapılır. Test kartı: `5521010140829928` / `12/29` / CVV `691`, 3D kodu `123456` (her kartın kendi SKT+CVV çifti var).
- **Kart iadesi şu an VakıfBank PANELİNDEN yapılır** (`src/lib/refund-config.ts` `CARD_REFUND_VIA_BANK_API = false`): banka `Vposreq` (apigw) için önceden bildirilmiş sabit sunucu IP'si istiyor (6011 "Geçersiz iş yeri IP adresi"), Vercel'in sabit IP'si yok (Static IPs 100 $/ay — mağaza istemedi). Sitedeki düğme yalnız siparişi `refunded` kapatır (`refund_ref='vakifbank-panel'`), stok + müşteri e-postası. Ödeme alma/doğrulama (commonPayment) IP şartı OLMADAN çalışıyor.
- **İptal/iade** (migration 0037, `src/lib/order-cancel.ts`): yalnız admin + AAL2, sipariş detayındaki kart. (API modu açıksa) kartlıda önce `Cancel`, olmazsa tam tutar `Refund`; `refund_started_at` kilidi çift iadeyi engeller; `close_order_with_restock` RPC durumu kapatır + (istenirse) stoğu ekler. Liste sayfasındaki durum menüsünde iptal/iade YOK (stok/para hareketi atlanıyordu).
- Env: `VAKIFBANK_MERCHANT_NUMBER/TERMINAL_NUMBER/PASSWORD/API_BASE_URL/VPOS_BASE_URL/PAYMENT_PAGE_URL`. İptal/iade (`Vposreq`) canlıda FARKLI sunucuda (`apigw.vakifbank.com.tr`) → `VPOS_BASE_URL`.

### Admin iki adımlı doğrulama (MFA/TOTP)
- `/admin/**` AAL2 (Supabase TOTP) ister: middleware + admin layout + her admin aksiyonunda `assertAal2` (`src/lib/admin-auth.ts`) + RLS'te `is_staff()`/`is_admin()` `aal2` şartı (migration 0036). Kurulum/doğrulama: `/admin/mfa` (sunucu aksiyonları — oturum çerezleri HttpOnly olduğundan tarayıcı istemcisi kullanılamaz). Yeni bir admin aksiyonu yazarken `assertRole`'den hemen sonra `await assertAal2(supabase)` EKLE.

### Formlar (React 19)
`useActionState` ile çalışan formlarda düz `<form action>` yerine **`<ActionForm>`** (`src/components/ui/ActionForm.tsx`) kullan — React 19 `action` prop'lu formu işlem sonrası otomatik sıfırlar (doğrulama hatasında kullanıcının yazdıkları silinir). Gönder düğmesinde `useFormStatus` yerine `useActionFormPending()`.

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
