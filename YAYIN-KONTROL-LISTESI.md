# Zile Aktar — Yayın (Production) Kontrol Listesi

Sitenin gerçek satışa hazır hale gelmesi için kalan tüm maddeler. Her madde bitince `[x]` koy.
**Kod tarafı bitti** — kalanlar dış hesap / iş / hukuk / içerik ve manuel test.

Canlı: `https://zile-aktar.vercel.app` (özel domain yok) · GitHub: `zileaktar/zile-aktar` (private)
Mimari + kod durumu: `devir-promptu.md`

---

## A. GERÇEK SATIŞI ENGELLEYEN (bitmeden para tahsil edilemez)

- [x] **İşletme kaydı / vergi levhası** — Suzan EŞAT gerçek kişi ticari işletmesi, VKN 3801213625, vergi levhası mevcut.
- [ ] **iyzico PRODUCTION onayı bekleniyor** — şu an SANDBOX. Başvuru + 3 belge `inceleme@iyzico.com` adresine gönderildi:
  - **1) Vergi levhası** ✅ gönderildi
  - **2) İmza beyannamesi** (noter onaylı) ✅ gönderildi
  - **3) Tarım ve Orman Bakanlığı Gıda İşletmesi Kayıt Belgesi** ✅ gönderildi (İlçe Tarım ve Orman Müdürlüğü'nden alınmış)
  - Not: şahıs işletmesi (vergi levhalı) iyzico "kurumsal üyelik" için uygundur, Ltd. kurmak gerekmez.
  - **Sıradaki:** iyzico değerlendirme → sözleşme → onay (3–10 iş günü). Onay gelince yap:
    - Vercel env: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` (prod), `IYZICO_BASE_URL=https://api.iyzipay.com`, `IYZICO_WEBHOOK_SECRET` (prod)
    - iyzico panelinde callback/notification URL'leri (şu an `zile-aktar.vercel.app`; domain alınırsa güncellenecek)
    - Sandbox → prod geçince kart akışını canlıda bir kez test et
- [ ] **Vercel Pro'ya geçiş** (~$20/ay + KDV) — Hobby planı ticari kullanıma kapalı. Canlıya geçmeden hemen önce yap (kredi her ay sıfırlanır).

## B. YASAL (TR e-ticaret mevzuatı)

- [x] Yasal metinler yayında: `/on-bilgilendirme-formu`, `/mesafeli-satis-sozlesmesi`, `/iptal-iade-kosullari` (+ cayma bildirim formu), `/teslimat-ve-kargo`, `/kvkk` (GA/Pixel + yurt dışı aktarım dahil), `/cerez-politikasi`, `/kullanim-kosullari`, `/sss`. Footer + checkout onay kutularında link. "TASLAK" uyarısı kaldırıldı; artık "Son güncelleme: {tarih}" gösteriliyor. İşletme bilgileri `legal.ts`'ten dolu.
- [x] **Gıda İşletmesi Kayıt Belgesi** — İlçe Tarım ve Orman Müdürlüğü'nden alındı, iyzico'ya iletildi.
- [ ] **Avukat / mali müşavir son kontrolü** (metinler yayında ama uzman gözünden geçmedi) — taksitli ödeme açıksa vade farkı bilgisi · VERBİS muafiyeti · KEP adresi eklensin mi.
- [x] **`src/lib/legal.ts` işletme bilgileri dolduruldu:** Unvan: Suzan EŞAT (gerçek kişi ticari işletme) · Zile V.D. · VKN 3801213625 · MERSİS 2246369545600001 · Ticaret Sicil 4076 · NACE 47.27.04 · Kargo: Aras Kargo · Çalışma saatleri: Pzt–Cmt 09:00–19:00.
- [x] Sağlık beyanı disclaimer + admin ürün formunda yasaklı ifade kontrolü.

## C. ALTYAPI / GÜVENLİK

- [x] **2FA:** Supabase + Vercel + GitHub — hepsi authenticator ile korumalı.
- [x] **`CRON_SECRET`** — güçlü rastgele değer, `.env.local` + Vercel'de.
- [x] Sır sızıntısı kontrolü — git geçmişinde/çalışan dizinde gerçek anahtar yok, `.gitignore` sıkı.
- [x] **PII / KVKK sızıntı sıkılaştırması (kod):** Sentry Replay `maskAllText:true` + `blockAllMedia:true` · `src/lib/mask.ts` (`redactPII` / `redactPIIString`) · sipariş/webhook/e-posta akışındaki tüm nesne loglayan `console.error` çağrıları maskeleme ile sarıldı · `src/lib/crypto/pii.ts` (AES-256-GCM `encryptPII`/`decryptPII` + HMAC-SHA256 `hashTCKN`) hazır.
- [x] **`PII_ENCRYPTION_KEY` + `PII_HMAC_PEPPER`** üretildi, `.env.local` + Vercel'de (Secret). **Bu iki değeri ASLA değiştirme.** Yapılacak: ilk şifreli/hash'li sütun eklendiğinde `env.mjs`'te `.optional()` kaldırılıp zorunlu yapılacak.
- [x] **OWASP iş mantığı denetimi:** IDOR/RLS · webhook/ödeme sahteciliği · XSS · rate limiting tarandı. Bulgular kapatıldı: yorum moderasyon atlatması (migration 0028: RLS + trigger) · `/siparis-alindi` HMAC imzalı token · KVKK export denetim kaydı service_role · `getClientIp` IP-spoof sertleştirme.
- [ ] **Özel domain** — ⚠️ **DURUM: hâlâ `zile-aktar.vercel.app` kullanılıyor, domain SATIN ALINMADI.**
  - Hosting Vercel'de kalıyor; sadece domain adı (ör. `zileaktar.com` / `.com.tr`) alınacak — bir domain sağlayıcıdan (Namecheap, GoDaddy, Turhost vb.) ~yıllık 200–500 TL.
  - **Karar bekleyen:** hangi domain adı? (`.com` mı `.com.tr` mi — `.com.tr` için vergi levhası/ticari belge gerekiyor, sende var.)
  - iyzico canlı başvurusu ŞU AN `zile-aktar.vercel.app` ile yapılıyor — domain sonradan alınırsa iyzico panelinde callback/notification URL'leri güncellenecek.
  - Domain alındıktan sonra sırayla:
    - Vercel → Settings → Domains → ekle → DNS kayıtlarını sağlayıcıya gir
    - Vercel env `NEXT_PUBLIC_APP_URL=https://<yenidomain>` (⚠️ değişince iyzico callback + CSRF/Origin kontrolü buna bağlı — birlikte güncellenmeli)
    - Supabase → Auth → URL Configuration (Site URL + Redirect URLs)
    - Cloudflare Turnstile → widget hostname listesine ekle
    - iyzico → callback/notification URL'leri yeni domaine çevir
    - Brevo → domaini ekle + SPF/DKIM DNS kayıtları (e-postalar spam'e düşmesin)
    - Google Search Console kaydı + `sitemap.xml` gönder
    - `_ga` çerez uyarısı özel domainde kendiliğinden düzelir (`vercel.app` public suffix olduğu için çıkıyordu)
- [ ] **Vercel Cron doğrula** — deploy sonrası Vercel → Cron sekmesi (`0 3 * * *`, bekleyen iyzico siparişlerini 24 saatte iptal eder).
- [x] **Havale/EFT IBAN** — `/admin/ayarlar`'dan girildi.
- [ ] Supabase parolası güçlü mü teyit.

## D. ANALYTICS / SEO

- [x] **Google Analytics 4** — kuruldu, çalışıyor (çerez izniyle koşullu). Ölçüm Kimliği `.env.local` + Vercel'de.
- [x] **Meta (Facebook) Pixel** — kuruldu, çalışıyor (çerez izniyle koşullu). Veri Seti Kodu `.env.local` + Vercel'de, PageView olayları "Tarayıcı" kaynağından doğrulandı.
- [ ] **Google Search Console** — domain alınınca kayıt + `sitemap.xml` gönder + doğrulama.
- [x] Dinamik `sitemap.xml` (tüm aktif ürünler + sayfalar), `robots.txt`, per-sayfa başlık/açıklama, `Store` + `Product` + `BreadcrumbList` + `FAQPage` şeması, breadcrumbs.
- [ ] `Store` şemasına `geo` (enlem/boylam) eklenebilir — opsiyonel.

## E. İÇERİK (mağaza sahibi)

- [ ] **Gerçek ürün fotoğrafları** — 198 ürün placeholder SVG. `/admin/urunler` → ürün düzenle → görsel yükle.
- [ ] **Ürün gramaj/fiyatları** — her ürün tek "STD" varyantla. 500g/1kg/2kg gibi seçenekleri `/admin/urunler`'den ekle (ekranda buton olarak görünür).
- [x] **Ürün açıklamaları** — 198 ürünün tamamı dolu (migration 0009 + 0021–0027, veritabanına uygulandı). Profesyonel format: Ürün Hakkında / Öne Çıkan Özellikleri / Kullanım Şekli / Saklama Koşulları / Önemli Uyarılar + mevzuat uyarısı.
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
