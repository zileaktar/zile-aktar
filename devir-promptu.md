# Zile Aktar Projesi — Devir Notu (Yeni Claude Oturumu İçin)

Aşağıdaki metni yeni açtığın Claude Code oturumuna ilk mesaj olarak yapıştır.

---

Sen, "Zile Aktar" adlı bir aktar/yöresel ürünler e-ticaret sitesi üzerinde çalışan önceki bir Claude Code oturumunun devamısın. Proje uzun oturumlarda inşa edildi, aşağıdaki bilgileri bilerek devam et.

## 1. ÖNEMLİ — Ortam Bilgisi (önce bunu oku)

- **Gerçek, aktif proje klasörü: `C:\Users\samet\projects\web`**. Terminalde HER ZAMAN önce bu klasöre `cd` yapıldığından emin ol.
- `D:\vscode\web` adında **eski, terk edilmiş bir kopya** var (harici SSD'nin exFAT formatlı olması Next.js build'ini bozduğu için projeyi C:'ye taşımıştık). Kullanıcı zaman zaman VS Code'da yanlışlıkla bu eski klasördeki dosyaları açıyor (özellikle `.env.local`). **Bu oturumda gerçekten oldu:** kullanıcı `.env.local`'i düzenledi ama değişiklik C: dosyasına yansımadı çünkü D: kopyasını düzenlemişti. Bir dosya değişikliği beklenmedik görünüyorsa önce doğru klasörde mi diye bak; gerekirse Edit aracıyla C: dosyasını doğrudan düzelt.
- Bu ortamda (Claude'un araç oturumu) **Node.js/npm/supabase komutlarını SEN çalıştıramazsın**. Kod dosyalarını sen yazıp düzenlersin ama `npm run dev/build/typecheck`, `supabase db push`, `npm install` gibi komutları HER ZAMAN kullanıcıya verip çalıştırt, çıktıyı yapıştırmasını iste. Tek seferde tek komut.
- Kullanıcı teknik değil, Türkçe konuşuyor. Tüm yanıtları Türkçe ver. Büyük görevleri parçalara böl, her parçadan sonra build/test ettirip sonucu bekle.
- Supabase/Cloudflare/iyzico/Vercel panellerinin arayüzü değişir — emin olmadığın UI adımlarını önce web araması/fetch ile doğrula, sonra kullanıcıya ilet.

## 2. Teknoloji Yığını

Next.js 14 (App Router, TS strict) + Supabase (Postgres/Auth/Storage/RLS) + iyzico (3D Secure ödeme, SANDBOX) + Cloudflare Turnstile (CAPTCHA) + Sentry (hata izleme) + Upstash Redis (rate limiting) + Brevo (transactional e-posta) + Vercel. **Migration 0001–0019.**

Supabase proje referansı: `gabdklnlojfbdaxtgmtg`.

**CANLI:** `https://zile-aktar.vercel.app` (özel domain yok). GitHub: private repo `zileaktar/zile-aktar`. Her `git push` → Vercel otomatik deploy. Vercel hâlâ Hobby planı (ticari kullanım için Pro şart — kullanıcı tarafı iş). Ayrıntılı kalan-işler listesi: `YAYIN-KONTROL-LISTESI.md`.

## 3. Tamamlanmış Olanlar (güvenle üzerine inşa et)

- **Mimari:** şema + RLS politikaları (migration `0001`–`0013`), atomik sipariş RPC'si (`create_order`), KVKK export/delete, CSRF (Origin kontrolü), güvenlik başlıkları (CSP dahil), Sentry, Upstash `safeRateLimit` ("fail-open").
- **Ürün kataloğu — migration `0012` ile TAMAMEN YENİLENDİ:** mağaza sahibinin gerçek stok tablosuna (`stok-tablosu.csv`, repo kökünde) göre **5 aktif kategori** (yag/baharat/cay/kozmetik/sirke), **198 ürün**. Eski 10 kategori + 108 ürünün dosyada olmayanları PASİFE alındı (silinmedi, `is_active=false`, stok 0). `categories.is_active` sütunu eklendi; `getCategories()` sadece aktifleri döndürür. Her ürüne tek varyant (`<SLUG>-STD`), fiyat/stok/etiket CSV'den. 11 baharatın (karabiber, sumak, isot, kimyon, zerdeçal, karanfil, mahlep, nane, kekik, zencefil, yenibahar) zengin açıklaması (0009) korundu. Görseller placeholder SVG (`public/urunler/*.svg`) — Claude binary üretemez, gerçek fotoğrafları kullanıcı ekler, görsel aramaya ÇALIŞMA.
- **Admin paneli:** `/admin` (özet), `/admin/urunler` (CRUD + presigned-URL görsel yükleme), `/admin/siparisler` (liste) + **`/admin/siparisler/[id]` (sipariş detayı: teslimat adresi, iletişim, ürünler, ödeme referansı — bu oturumda eklendi)**, `/admin/ayarlar` (site logosu yükleme — bu oturumda uçtan uca test edildi, ÇALIŞIYOR).
- Admin kullanıcısı: **zileaktar@gmail.com**, `profiles.role = 'admin'`.
- Marka adı "Zile Aktar", gerçek iletişim bilgileri footer'da.
- **Ürün açıklamaları:** yalnızca "Baharatlar ve Tatlandırıcılar" kategorisindeki 24 ürün için zengin açıklama var (`0009`). Kullanıcı diğer kategoriler için açıklama İSTEMEDİ ("önemli işlere geçelim" dedi) — istemedikçe yazma.

### Bu oturumda yapılan büyük değişiklikler

- **Kapıda ödeme TAMAMEN KALDIRILDI.** Tek ödeme yöntemi kredi/banka kartı (iyzico 3DS). `checkoutRequestSchema.paymentMethod` artık `z.literal('card')`. `COD_SURCHARGE_CENTS` silindi.
- **Güvenlik/performans denetimi** yapıldı, bulgular `migration 0011_production_hardening.sql` ile düzeltildi:
  - `mark_order_failed` idempotent yapıldı (çift çağrıda stok şişmesi engellendi).
  - `create_order` artık pasif (`is_active=false`) ürünleri reddediyor.
  - Eksik index'ler eklendi (`orders(status,created_at)`, `orders(user_id,created_at)`, `order_items(product_id)`, `order_items(variant_id)`).
  - `profiles_update_own` RLS politikası: moderator artık kendi profilini güncelleyebiliyor (rol yükseltmeden — `public.my_role()` helper'ı).
- **iyzico ödeme akışı yeniden yazıldı ve sandbox'ta uçtan uca test edildi (ÇALIŞIYOR):**
  - `src/lib/iyzico.ts` — IYZWSv2 imza algoritması resmi dokümana göre baştan yazıldı (eski hali yanlıştı: düz JSON string yerine flatten, `apiKey=` yerine `apiKey:`, `x-iyzi-rnd` header'ı imzadakinden farklıydı). Ortak `iyzicoPost()` helper'ı eklendi.
  - `initializeCheckoutForm` payload'ında `buyer.registrationAddress` ve `buyer.gsmNumber` alan adları düzeltildi.
  - `src/lib/payments.ts` (YENİ) — `confirmCheckoutPayment(token)`: retrieve + tutar doğrulaması (kuruş kuruş) + sipariş işaretleme. Callback ve webhook AYNI bu fonksiyonu kullanıyor. Sipariş kimliği `conversationId ?? basketId`.
  - `verifyIyzicoWebhookSignature` — resmi HPP formülüne göre yeniden yazıldı (`secretKey+iyziEventType+iyziPaymentId+token+paymentConversationId+status`, HMAC-SHA256 hex). Webhook route yeni payload şemasıyla güncellendi, idempotency `iyziReferenceCode` üzerinden.
- **Cloudflare Turnstile CAPTCHA** eklendi: `/giris` ve `/kayit` sayfalarında. `src/components/auth/CaptchaField.tsx`, paket `@marsidev/react-turnstile`. Env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Supabase panelinde CAPTCHA etkinleştirildi (Turnstile + secret key). CSP'ye `challenges.cloudflare.com` eklendi. **Test edildi, çalışıyor.**
- **Çıkış (logout) hatası düzeltildi:** httpOnly oturum çerezleri tarayıcı JS'i tarafından silinemediği için çıkış artık sunucu tarafı Server Action ile (`src/lib/actions/auth.ts`, `LogoutButton` bir `<form action=...>`).
- **Hata sayfaları eklendi:** `src/app/error.tsx`, `global-error.tsx`, `not-found.tsx` (Sentry entegre). `next build` "global-error" uyarısı gitti.
- `/api/account/export` `GET` → `POST` + Origin kontrolü (yan etkili GET kapatıldı).
- CSP: geliştirmede `ws://localhost:*` eklendi (HMR için); production sıkı kaldı.
- **Sepet rozeti hydration hatası** düzeltildi: `useCartCount()` hook'u (mount öncesi 0 döner), `SiteHeader` + `BottomNav`. Sepet artık checkout→ödeme geçişinde DEĞİL, `/siparis-alindi`'de temizlenir (`ClearCartOnSuccess`).
- **Admin veri tazeliği:** `/admin`, `/admin/siparisler`, `/admin/siparisler/[id]`, `/admin/urunler`, `/admin/ayarlar` → `export const dynamic = 'force-dynamic'`; service_role istemcisi `cache: 'no-store'` fetch ile sarmalandı; `next.config` `experimental.staleTimes = { dynamic: 0 }`. (Aksi halde admin yeni siparişleri/stoğu görmüyordu.)
- **Ödeme deneyimi:** iyzico **redirect** yöntemi kullanılıyor (popup/inline değil — 3DS'in her cihaz/bankada güvenilir çalışması için). Checkout sayfasındaki sahte kart alanları + `CardPreview` silindi.
- **migration `0013`:** ürün alanları (`form` enum, `origin`, `storage_info`, `allergen_info`, `shelf_life_note`) · varyant (`lot_no`, `expiry_date`) · `orders.billing_address` · `site_settings` banka bilgisi (havale) · **`reviews` tablosu** (moderasyonlu, RLS: onaylı herkese açık, kullanıcı kendi bekleyenini görür/düzeltir, staff onaylar). Bu alanlar için ADMIN FORM UI'si HENÜZ YOK (şema hazır, giriş elle/ileride).
- **Havale/EFT ödeme eklendi:** checkout'ta Kart / Havale seçimi. Havale → `create_order` (`payment_provider='havale'`, `pending`) → `/siparis-alindi?odeme=havale` banka IBAN + "açıklamaya sipariş no yaz" gösterir. Admin dekont görünce `/admin/siparisler`'den durumu 'paid' yapar. Cron artık yalnızca `payment_provider='iyzico'` siparişleri otomatik iptal eder. Banka bilgisi `/admin/ayarlar` → "Havale/EFT Banka Bilgisi" formundan girilir (IBAN doğrulaması: `^TR\d{24}$`). **Kullanıcı henüz IBAN girmedi — havale seçilirse "banka bilgileri tanımlı değil" uyarısı çıkar.**
- **Sağlık beyanı:** `HealthDisclaimer` bileşeni ürün detay + ödeme sayfasında. Admin ürün formunda `productInputSchema` "tedavi eder / iyileştirir / şifa" gibi ibareleri REDDEDER.
- `next build` bu oturumun sonunda **tamamen temiz** (28 sayfa).

## 4. YARIM KALAN / DOĞRULANMAMIŞ İŞLER (buradan devam et)

- **Upstash rate limiting KAPALI:** `.env.local`'de `UPSTASH_REDIS_REST_TOKEN=placeholder-upstash-token`. `safeRateLimit` "fail-open" olduğu için uygulama çalışıyor ama rate limiting hiç devrede değil. Kullanıcının Upstash panelinden gerçek REST token'ı alıp `.env.local`'e (C: dosyası!) girmesi ve dev sunucusunu yeniden başlatması gerekiyor. URL zaten girili: `https://thorough-sunbeam-210768.upstash.io`.
- **iyzico Sandbox anahtarları `.env.local`'de GİRİLİ ve çalışıyor** (`IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com`). `IYZICO_WEBHOOK_SECRET` şimdilik Secret Key ile aynı değere ayarlandı.
- **iyzico webhook bildirim URL'i AYARLANMADI** (Aşama 4): iyzico panelinde Settings → Company Settings → Merchant Notifications'a canlı HTTPS URL girilmeli — ancak deploy sonrası yapılabilir (iyzico localhost'a bildirim gönderemez). Webhook imza özelliği ayrıca `integration@iyzico.com` üzerinden etkinleştiriliyor. Webhook kodu yazıldı ama CANLI test edilmedi; deploy sonrası sandbox'ta doğrula.
- **Prod iyzico hesabı** henüz yok — sandbox'tan prod'a geçişte API Key/Secret Key ve `IYZICO_BASE_URL=https://api.iyzipay.com` güncellenecek.
- **Havale IBAN'ı girilmedi:** `/admin/ayarlar` → "Havale/EFT Banka Bilgisi" formundan hesap sahibi + banka + IBAN girilmeli. Girilene kadar havale ödeme "banka bilgileri tanımlı değil" der.
- **0013 UI — kısmen yapıldı:**
  - ✅ Ürün alanları (`form`/`origin`/`storage_info`/`allergen_info`/`shelf_life_note`) `ProductForm`'a ("Ürün Detay Bilgileri" kartı) + ürün detay sayfasına ("Ürün Bilgileri" bloğu) eklendi. `productInputSchema` + `parseProductFormData` + `productColumns()` helper.
  - ✅ **Yorumlar** (migration `0014` `reviews.author_name` snapshot eklendi): ürün sayfasında yıldız/liste/form (`ProductReviews.tsx`, `src/lib/data/reviews.ts`, `src/app/urun/[slug]/actions.ts`), Schema.org `aggregateRating`. Admin `/admin/yorumlar` (moderasyon: onayla/reddet/sil). Yorumlar `pending` başlar.
  - ✅ **Form filtreleme:** anasayfada çip filtresi (`?form=toz`), `getProducts({ form })`, `getAvailableForms()` (yalnızca atanmış formlar için çip). `PRODUCT_FORMS`/`PRODUCT_FORM_LABELS` (`validations/product.ts`).
  - ✅ **Varyant bazında `lot_no` + `expiry_date`:** `ProductForm` varyant kartlarına eklendi (`variantExtras()` helper, `duzenle` sorgusu güncel). Ürün detayında seçili varyant STT/parti gösteriliyor.
  - ✅ **Fatura adresi:** checkout'ta "fatura adresim farklı" checkbox → ikinci adres formu (`billingAddressSchema`). `/api/checkout` `create_order` sonrası `orders.billing_address` yazıyor. Admin sipariş detayında gösteriliyor.
  - **0013/0014 UI TAMAMLANDI.** Kalan admin UI eksiği yok.
- **Hesap otomatik doldurma + kaydetme:** `/checkout` artık server component (`page.tsx`) + `CheckoutForm.tsx` (client). `getCheckoutPrefill()` (`src/lib/data/account.ts`) giriş yapmış kullanıcının ad/e-posta/telefon/adresini profil → `addresses` → son sipariş sırasıyla doldurur. `/api/checkout` başarılı siparişten sonra telefonu `profiles`'a, adresi `addresses`'e (tek varsayılan adres: delete+insert) kaydeder. `/hesabim` sayfası artık ad/telefon düzenleme formu (`ProfileForm` + `src/app/hesabim/actions.ts` `updateProfileAction`) + kayıtlı adres gösterimi içeriyor. `addresses` tablosu ilk kez fiilen kullanılıyor (tek adres modeli; çoklu adres UI'si ileride).

### Bu oturumda (deploy sonrası) yapılanlar

- ~~Sentry~~ ✅ `zileaktar` org / `zile-aktar` proje (EU). 4 env hem `.env.local` hem Vercel'de. Test edildi. `next.config.mjs`: token varsa source map Sentry'ye yüklenip silinir, yoksa üretilmez. Session replay açık (`replaysSessionSampleRate: 0.05`) — CSP'ye `worker-src 'self' blob:` eklendi (sıkıştırma worker'ı).
- ~~WhatsApp/telefon~~ ✅ `+90 551 173 00 94` — `WhatsAppButton.tsx` + footer.
- ~~Deploy~~ ✅ GitHub (private) + Vercel — `zile-aktar.vercel.app` canlı. Tüm env Vercel'de. Turnstile hostname'e Vercel domaini eklendi.
- ~~Brevo custom SMTP~~ ✅ Supabase Auth e-postaları (kayıt doğrulama + şifre sıfırlama) Brevo SMTP relay ile gidiyor (`smtp-relay.brevo.com:587`, gönderen `zileaktar@gmail.com`). Supabase'in yerleşik e-posta limiti aşıldığı için kuruldu.
- **Sipariş e-postaları** ✅ `src/lib/email.ts` (Brevo REST API, `BREVO_API_KEY` + `ORDER_NOTIFY_EMAIL` env). (a) Sipariş oluşunca müşteriye onay + yöneticiye bildirim (`sendOrderPlacedEmail`, kart onayı pending→paid geçişinde / havale siparişi oluşunca). (b) **Kargo/teslimat** (migration 0015: `orders.shipping_carrier/tracking_number/shipped_at`): `/admin/siparisler/[id]` "Kargo Bilgisi" formundan kargo firması+takip no ile, VEYA `/admin/siparisler` liste menüsünden durum "Kargoya Verildi"/"Teslim Edildi" yapınca müşteriye e-posta (`sendOrderShippedEmail` / `sendOrderDeliveredEmail`; aynı duruma tekrar çekilirse tekrar göndermez).
- **Şifre sıfırlama** ✅ `/sifremi-unuttum` (CAPTCHA'lı, `resetPasswordForEmail`) + `/sifre-yenile` (`onAuthStateChange` + `getSession()` ile recovery oturumu). `/giris`'te "Şifremi unuttum" linki. Ortak `PasswordInput` bileşeni (göz aç/kapa) giriş + kayıt + sıfırlamada.
- **Giriş sonrası yönlendirme** ✅ `router.push`+`refresh` yerine `window.location.assign()` (çerez yarış durumu — giriş sonrası parola ekranında takılıp kalma düzeltmesi).
- **Yasal metin TASLAKLARI** ✅ `/on-bilgilendirme-formu`, `/mesafeli-satis-sozlesmesi`, `/iptal-iade-kosullari`, `/teslimat-ve-kargo`, `/kvkk`, `/cerez-politikasi` — hepsi `src/components/legal/LegalPage.tsx` (⚠️ TASLAK uyarısı) + `src/lib/legal.ts` (`LEGAL` sabiti). **`src/lib/legal.ts` içinde `[...]` yer tutucular DOLDURULMADI** (ticari unvan, vergi dairesi/no, MERSİS, ticaret sicil no, kargo firması) — kullanıcı tarafı iş. Avukat onayı da gerekli.
- **Schema.org** ✅ `Store` yapısal verisi (`layout.tsx`, `safeJsonLd`), ürün sayfasında `Product` + `aggregateRating`.
- `package.json` engines → `"node": "22.x"` (Vercel otomatik major yükseltme uyarısı).
- **Arama:** SiteHeader'daki `<input>` → `SearchBox.tsx` (canlı typeahead açılır liste, `/api/search` ucu, `quickSearchProducts` — ad+açıklamada `ilike` kısmi eşleşme). Ana arama (`getProducts`) da tam-metin yerine `ilike` kullanıyor (yarım kelime eşleşsin).
- **İndirim (migration 0016):** `product_variants.compare_at_price_cents` = indirimsiz/eski fiyat (NULL = indirim yok). Ödeme hesabı sadece `price_cents` kullanır. Admin ürün formunda varyant başına "İndirimsiz fiyat" kutusu; ürün kart/detayında üstü çizili eski fiyat + "%X İNDİRİM" rozeti.
- **Gramaj seçimi:** ürün kart + detayında `<select>` yerine ekranda tıklanabilir varyant butonları (kart: tek varyantsa gizli). Varyant verisini (500g/1kg/2kg + fiyat) mağaza sahibi admin panelinden girer.
- **Kampanya afişleri (migration 0017):** `campaign_banners` tablosu (RLS: aktifleri herkes, hepsini staff). Anasayfada hero'nun YERİNE `CampaignCarousel.tsx` (kaydırmalı, ok+nokta, 6sn otomatik); afiş yoksa sade tanıtım başlığı. Yönetim: `/admin/afisler` (`BannerManager.tsx` + `afisler/actions.ts`). Görseller `product-images` bucket'ında `banners/` klasörü (`presignedUploadRequestSchema` folder enum'a `banners` eklendi). Görselleri mağaza sahibi yükler.
- **İndirim kodu / kupon (migration 0018):** `coupons` tablosu (RLS: SADECE staff okur — indirim oranı/limit müşteriye kapalı). Türler: `percent` / `fixed` (kuruş) / `free_shipping`. Alanlar: `min_cart_cents`, `max_uses` + `used_count`, `per_user_once`, `expires_at`, `is_active`. **Doğrulama + hesap TAMAMEN `create_order` içinde** (yeni `p_coupon_code` parametresi; dönüşe `discount_cents` eklendi — dönüş tipi değiştiği için fonksiyon önce DROP edildi). `mark_order_failed` sipariş iptalinde `used_count`'u geri düşürür (stok gibi). Ödeme sayfası önizlemesi için SALT-OKUNUR `preview_coupon(code, subtotal, user_id, email)` SQL fonksiyonu (hata fırlatmaz, veri döner) → `/api/coupon` ucu (ara toplamı DB fiyatlarından hesaplar). `CheckoutForm` sipariş özetinde kod kutusu + indirim satırı. `orders.coupon_code` + `orders.discount_cents` sütunları; admin sipariş detayı + sipariş e-postası indirim satırını gösterir. Yönetim: `/admin/kuponlar` (`CouponManager.tsx` + `kuponlar/actions.ts`). iyzico'da `price`=ara toplam (basketItems toplamı), `paidPrice`=indirimli toplam — iyzico bu farkı "satıcı indirimi" olarak kabul eder, kod değişmedi.
- **Ürün kampanyası "X alana Y" / BOGO (migration 0019):** `products.deal_buy_qty` / `deal_get_qty` / `deal_get_percent` (üçü birlikte null = kampanya yok). SATIR BAZLI: aynı varyanttan her (buy+get) adette get_qty adet, satır fiyatının %percent'i kadar iner. `create_order` içinde hesaplanır (yine DROP + yeniden yaratıldı; dönüşe `deal_discount_cents` eklendi). Kuponla birlikte uygulanır — kampanya + kupon toplamı ara toplamı geçemez (kupon kırpılır). `orders.deal_discount_cents` sütunu. Önizleme: `src/lib/pricing.ts` `lineDealDiscountCents()` (SQL ile aynı formül) — sepet öğesine `deal` alanı eklendi (`cart-store.ts`), `ProductCard`/`ProductDetailClient` eklerken doldurur + rozet gösterir (`dealBadgeText`). `CheckoutForm` özetinde "Kampanya indirimi" satırı. Admin: `ProductForm` "Kampanya" kartı (hazır şablon butonları: 1 Alana 1 Bedava / 2 Al 1 Öde / 1 Alana 2. %50). Admin sipariş detayı + e-posta indirim satırını gösterir. `/api/checkout`: indirimler sonrası tutar 0 ise kart ödemesi engellenir (havale önerilir).

## 5. Kullanıcı tarafı — YAYINI ENGELLEYEN işler (kod değil)

Tam liste `YAYIN-KONTROL-LISTESI.md`'de. Özet:

- **iyzico PRODUCTION hesabı** — şu an sandbox, gerçek tahsilat yok. İşletme başvurusu + sözleşme + onay (haftalar). Onaylanınca Vercel'de `IYZICO_API_KEY`/`IYZICO_SECRET_KEY`/`IYZICO_BASE_URL` güncellenir.
- **Vercel Pro** (~20 USD/ay) — Hobby ticari kullanıma kapalı.
- **Özel domain** — satın al + Vercel/Supabase/Turnstile/iyzico/Brevo'da URL güncellemeleri (checklist C bölümü).
- **`src/lib/legal.ts` `[...]` alanları** + avukat onayı.
- **Havale IBAN'ı** — `/admin/ayarlar` → "Havale/EFT Banka Bilgisi". Girilene kadar havale "banka bilgileri tanımlı değil" der.
- **Gerçek ürün fotoğrafları** — 198 ürün placeholder SVG, admin panelden yüklenir.
- **Vercel + Supabase 2FA.**

- **L1 (opsiyonel):** CSP'de `script-src 'unsafe-inline'` var; nonce tabanlı CSP'ye geçiş ayrı bir oturumda yapılabilir, yayın engeli değil.
- **Opsiyonel kod işleri:** ~187 ürün için zengin açıklama (kullanıcı istemedikçe yazma); çoklu adres yönetimi UI'si (`/hesabim`); anasayfa hero görseli hâlâ Unsplash (telif).

## 6. Sohbet Tarzı Notları

- Kullanıcı bazen birden fazla konuyu karıştırıyor — nazikçe düzelt, suçlama.
- Büyük görevleri tek seferde bitirmeye çalışma; parçalara böl, her parçadan sonra `npm run build` / test ettir, sonucu bekle.
- Gerçek olmayan/tahmini bilgi verme; panel UI adımlarını önce web'den doğrula.
- İkili dosya üretemezsin — placeholder görseller SVG.

---

Şimdi kullanıcıya "nereden devam edelim" diye sor. Muhtemel sıra: Upstash token → Sentry hesabı → WhatsApp numarası → yasal metin taslakları → deploy.
