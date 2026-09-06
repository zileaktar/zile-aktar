# Zile Aktar — Yayın (Production) Kontrol Listesi

Sitenin gerçek satışa hazır hale gelmesi için kalan tüm maddeler. Her madde bitince `[x]` koy.
**Kod tarafı bitti** — kalanlar dış hesap / iş / hukuk / içerik ve manuel test.

Canlı: `https://zile-aktar.vercel.app` (özel domain yok) · GitHub: `zileaktar/zile-aktar` (private)
Mimari + kod durumu: `devir-promptu.md`

---

## A. GERÇEK SATIŞI ENGELLEYEN (bitmeden para tahsil edilemez)

- [ ] **İşletme kaydı / vergi levhası** — şahıs şirketi yoksa mali müşavirle açılış. iyzico + yasal metinler bunu gerektirir.
- [ ] **iyzico PRODUCTION başvurusu** — şu an SANDBOX, gerçek kart tahsilatı yok. Başvuru yapıldı; iyzico inceleme ekibi 3 belge istedi (14.09.2026 e-postası):
  - **1) Vergi levhası** — var (VKN 3801213625). `inceleme@iyzico.com` adresine e-posta ile gönderilecek.
  - **2) İmza sirküleri / imza beyannamesi** — şahıs işletmesinde noterden alınan "imza beyannamesi" geçerli. `inceleme@iyzico.com`'a gönderilecek.
  - **3) Tarım ve Orman Bakanlığı "Gıda İşletmesi Kayıt Belgesi"** — gıda (baharat/çay/sirke vb.) sattığımız için ZORUNLU. Henüz yok → alınacak (bkz. B bölümü). iyzico bu belge olmadan canlıya geçirmiyor.
  - Not: iyzico "kurumsal üyelik" istiyor; şahıs işletmesi (vergi levhalı) kurumsal üyelik için uygundur, yeni bir şirket (Ltd.) kurmak GEREKMEZ.
  - Belgeler mail atıldıktan sonra: sözleşme → onay (3–10 iş günü)
  - Onay sonrası Vercel'de: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` (prod), `IYZICO_BASE_URL=https://api.iyzipay.com`, `IYZICO_WEBHOOK_SECRET` (prod webhook anahtarı)
  - iyzico panelinde callback/notification URL'lerini canlı domaine çevir
- [ ] **Vercel Pro'ya geçiş** (~$20/ay + KDV) — Hobby planı ticari kullanıma kapalı. Canlıya geçmeden hemen önce yap (kredi her ay sıfırlanır).

## B. YASAL (TR e-ticaret mevzuatı)

- [x] Yasal metinler yayında: `/on-bilgilendirme-formu`, `/mesafeli-satis-sozlesmesi`, `/iptal-iade-kosullari` (+ cayma bildirim formu), `/teslimat-ve-kargo`, `/kvkk` (GA/Pixel + yurt dışı aktarım dahil), `/cerez-politikasi`, `/kullanim-kosullari`, `/sss`. Footer + checkout onay kutularında link. "TASLAK" uyarısı kaldırıldı; artık "Son güncelleme: {tarih}" gösteriliyor. İşletme bilgileri `legal.ts`'ten dolu.
- [ ] **Gıda İşletmesi Kayıt Belgesi** (Tarım ve Orman Bakanlığı) — online gıda satışı için ZORUNLU; iyzico da bunu istiyor.
  - Nereye: Zile İlçe Tarım ve Orman Müdürlüğü (işletme adresinin bağlı olduğu ilçe).
  - Gerekli belgeler (tipik): vergi levhası, faaliyet/oda kayıt belgesi, işletme adresi için kira kontratı veya tapu, kimlik fotokopisi, işletme krokisi. (Depo/paketleme yeri olmadan, ev adresi + "aracısız internet satışı" olarak da kayıt yapılabiliyor — müdürlüğe sorulmalı.)
  - Süre: genelde 3–7 iş günü. Ücret: Bakanlık döner sermaye tarifesi (düşük).
  - **En pratik yol:** mali müşavire "gıda işletme kayıt belgesi çıkarır mısınız" demek — genelde bu işi onlar yapıyor.
- [ ] **Avukat / mali müşavir son kontrolü** (metinler yayında ama uzman gözünden geçmedi) — taksitli ödeme açıksa vade farkı bilgisi · VERBİS muafiyeti · KEP adresi eklensin mi.
- [x] **`src/lib/legal.ts` işletme bilgileri dolduruldu:** Unvan: Suzan EŞAT (gerçek kişi ticari işletme) · Zile V.D. · VKN 3801213625 · MERSİS 2246369545600001 · Ticaret Sicil 4076 · NACE 47.27.04 · Kargo: Aras Kargo · Çalışma saatleri: Pzt–Cmt 09:00–19:00.
- [x] Sağlık beyanı disclaimer + admin ürün formunda yasaklı ifade kontrolü.

## C. ALTYAPI / GÜVENLİK

- [x] **2FA:** Supabase + Vercel + GitHub — hepsi authenticator ile korumalı.
- [x] **`CRON_SECRET`** — güçlü rastgele değer, `.env.local` + Vercel'de.
- [x] Sır sızıntısı kontrolü — git geçmişinde/çalışan dizinde gerçek anahtar yok, `.gitignore` sıkı.
- [x] **PII / KVKK sızıntı sıkılaştırması (kod):** Sentry Replay `maskAllText:true` + `blockAllMedia:true` · `src/lib/mask.ts` (`redactPII` / `redactPIIString`) · sipariş/webhook/e-posta akışındaki tüm nesne loglayan `console.error` çağrıları maskeleme ile sarıldı · `src/lib/crypto/pii.ts` (AES-256-GCM `encryptPII`/`decryptPII` + HMAC-SHA256 `hashTCKN`) hazır.
- [ ] **`PII_ENCRYPTION_KEY` + `PII_HMAC_PEPPER` üret ve ekle** (`.env.example`'da komutlar var) — şifreli/hash'li sütun kullanılmaya başlanınca `.env.local` + Vercel'e ekle, `env.mjs`'te `.optional()`'ı kaldır. **Bu iki değeri ASLA değiştirme** (eski veriler okunamaz hale gelir).
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
- [x] **Meta (Facebook) Pixel** — kuruldu, çalışıyor (çerez izniyle koşullu). Veri Seti Kodu `.env.local` + Vercel'de, PageView olayları "Tarayıcı" kaynağından doğrulandı.
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
