# Zile Aktar — Yayın (Production) Kontrol Listesi

Sitenin gerçek satışa hazır hale gelmesi için kalan tüm maddeler. Her madde bitince `[x]` koy.
**Kod tarafı bitti** — kalanlar dış hesap / iş / hukuk / içerik ve manuel test.

Canlı: `https://zile-aktar.vercel.app` (özel domain yok) · GitHub: `zileaktar/zile-aktar` (private)
Mimari + kod durumu: `devir-promptu.md`

---

## A. GERÇEK SATIŞI ENGELLEYEN (bitmeden para tahsil edilemez)

- [ ] **İşletme kaydı / vergi levhası** — şahıs şirketi yoksa mali müşavirle açılış. iyzico + yasal metinler bunu gerektirir.
- [ ] **iyzico PRODUCTION başvurusu** — şu an SANDBOX, gerçek kart tahsilatı yok.
  - Belgeler: vergi levhası, imza beyannamesi, kimlik, işletme adına banka hesabı belgesi. (Vergi levhası + banka + başvuru isimleri BİREBİR aynı olmalı.)
  - iyzico paneli → "Canlıya Geç" → belgeleri yükle → sözleşme → onay (3–10 iş günü)
  - Onay sonrası Vercel'de: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` (prod), `IYZICO_BASE_URL=https://api.iyzipay.com`, `IYZICO_WEBHOOK_SECRET` (prod webhook anahtarı)
  - iyzico panelinde callback/notification URL'lerini canlı domaine çevir
- [ ] **Vercel Pro'ya geçiş** (~$20/ay + KDV) — Hobby planı ticari kullanıma kapalı. Canlıya geçmeden hemen önce yap (kredi her ay sıfırlanır).

## B. YASAL (TR e-ticaret mevzuatı)

- [~] Yasal metin **TASLAKLARI** hazır: `/on-bilgilendirme-formu`, `/mesafeli-satis-sozlesmesi`, `/iptal-iade-kosullari`, `/teslimat-ve-kargo`, `/kvkk`, `/cerez-politikasi`, `/sss`. Footer + checkout onay kutularında link.
- [x] **`src/lib/legal.ts` işletme bilgileri dolduruldu:** Unvan: Suzan EŞAT (gerçek kişi ticari işletme) · Zile V.D. · VKN 3801213625 · MERSİS 2246369545600001 · Ticaret Sicil 4076 · NACE 47.27.04 · Kargo: Aras Kargo · Çalışma saatleri: Pzt–Cmt 09:00–19:00.
- [ ] **Avukat / mali müşavir onayı** — tüm yasal metinler kontrol ettirilmeli (cayma hakkı istisnaları, KVKK saklama süreleri, işletme bilgileri).
- [x] Sağlık beyanı disclaimer + admin ürün formunda yasaklı ifade kontrolü.

## C. ALTYAPI / GÜVENLİK

- [x] **2FA:** Supabase + Vercel + GitHub — hepsi authenticator ile korumalı.
- [x] **`CRON_SECRET`** — güçlü rastgele değer, `.env.local` + Vercel'de.
- [x] Sır sızıntısı kontrolü — git geçmişinde/çalışan dizinde gerçek anahtar yok, `.gitignore` sıkı.
- [ ] **Özel domain** (ör. `zileaktar.com`) — satın al (sadece domain, hosting Vercel'de). Sonra:
  - Vercel → Settings → Domains → ekle → DNS kayıtlarını gir
  - Vercel env `NEXT_PUBLIC_APP_URL=https://zileaktar.com`
  - Supabase → Auth → URL Configuration (Site URL + Redirect URLs)
  - Cloudflare Turnstile → widget hostname listesine ekle
  - iyzico → callback/notification URL
  - Brevo → domaini ekle + SPF/DKIM DNS kayıtları
  - `_ga` çerez uyarısı özel domainde kendiliğinden düzelir
- [ ] **Vercel Cron doğrula** — deploy sonrası Vercel → Cron sekmesi (`0 3 * * *`, bekleyen iyzico siparişlerini 24 saatte iptal eder).
- [x] **Havale/EFT IBAN** — `/admin/ayarlar`'dan girildi.
- [ ] Supabase parolası güçlü mü teyit.

## D. ANALYTICS / SEO

- [x] **Google Analytics 4** — kuruldu, çalışıyor (çerez izniyle koşullu). Ölçüm Kimliği `.env.local` + Vercel'de.
- [ ] **Meta (Facebook) Pixel** — kod hazır, `NEXT_PUBLIC_META_PIXEL_ID` bekliyor. FB hesabı "çok yeni" hatası → 1 saat+ sonra işletme hesabı aç, Pixel oluştur, kimliği `.env.local` + Vercel'e gir, Redeploy.
- [ ] **Google Search Console** — domain alınınca kayıt + `sitemap.xml` gönder + doğrulama.
- [x] Dinamik `sitemap.xml` (tüm aktif ürünler + sayfalar), `robots.txt`, per-sayfa başlık/açıklama, `Store` + `Product` + `BreadcrumbList` + `FAQPage` şeması, breadcrumbs.
- [ ] `Store` şemasına `geo` (enlem/boylam) eklenebilir — opsiyonel.

## E. İÇERİK (mağaza sahibi)

- [ ] **Gerçek ürün fotoğrafları** — 198 ürün placeholder SVG. `/admin/urunler` → ürün düzenle → görsel yükle.
- [ ] **Ürün gramaj/fiyatları** — her ürün tek "STD" varyantla. 500g/1kg/2kg gibi seçenekleri `/admin/urunler`'den ekle (ekranda buton olarak görünür).
- [ ] **Ürün açıklamaları** — ~187 ürün açıklamasız. İstersen Claude kategoriler halinde yazar.
- [ ] **Kampanya afişleri** — `/admin/afisler`'den görsel + başlık/buton yükle (yoksa sade başlık gösterilir).
- [ ] **Sosyal medya linkleri** — Instagram/Facebook hesap adreslerini ver, footer'a eklenir.
- [ ] Anasayfa hero görseli hâlâ Unsplash — afiş koyunca görünmüyor; afişsizken kendi görseli konabilir.
- [ ] Gerçek ekip/mağaza fotoğrafı (opsiyonel — "Hakkımızda" bölümü).

## F. MANUEL TEST (deploy sonrası, canlıda)

- [ ] **Tüm formlar** tek tek: kayıt → e-posta doğrulama → giriş → şifremi unuttum → şifre yenile → checkout (kart + havale) → sipariş sonrası e-postalar → ürün yorumu → admin sipariş durumu değiştir.
- [ ] **Kupon** testi: `/admin/kuponlar`'dan kod oluştur → ödeme sayfasında uygula → indirim doğru mu → sipariş + e-postada indirim satırı.
- [ ] **Kampanya** testi: bir ürüne "2 Alana 1 Bedava" ver → sepette otomatik tamamlama + kampanya indirimi doğru mu.
- [ ] **Tarayıcı uyumluluğu:** Chrome, Safari (iOS dahil), Firefox, Edge — ana akışlar.
- [x] Kırık link taraması — temiz (30 sayfa, 75+ link, 0 kırık).

## G. ÜCRETSİZ KATMAN LİMİTLERİ (şimdilik yeter)

- Supabase Free (500MB DB, 5GB egress/ay) → hacim artınca Pro (~$25/ay, PITR yedek)
- Upstash Free (10K komut/gün) · Sentry Free (5K hata/ay) · Brevo Free (300 e-posta/gün)

## H. BİTEN KOD İŞLERİ (referans)

Mimari + RLS + atomik `create_order` + güvenlik denetimi · Katalog (5 kategori / 198 ürün) ·
iyzico ödeme (sandbox) + Havale/EFT · Turnstile CAPTCHA · Ürün yorumları (moderasyonlu) ·
Hesap otomatik doldurma · Şifre sıfırlama + göster/gizle · Sentry · WhatsApp · GitHub + Vercel deploy ·
Brevo SMTP + sipariş/kargo/teslimat e-postaları · Canlı arama önerileri (typeahead) ·
Varyant indirimi (üstü çizili fiyat) · Ekranda gramaj butonları · Kampanya afişi carousel ·
İndirim kuponu sistemi (yüzde/sabit/ücretsiz kargo) · "X alana Y" kampanyası + sepette otomatik tamamlama ·
Sepet "kasa altı" önerileri · Ürün detayında "Benzer Ürünler" · GA4 · Favicon · Breadcrumbs ·
SSS sayfası · İletişim + harita sayfası
