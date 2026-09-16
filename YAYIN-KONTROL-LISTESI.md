# Zile Aktar — Yayın (Production) Kontrol Listesi

Sitenin gerçek satışa hazır hale gelmesi için kalan tüm maddeler. Her madde bitince `[x]` koy.
**Kod tarafı bitti** — kalanlar dış hesap / iş / hukuk / içerik ve manuel test.

Canlı: `https://zileaktar.com` (özel domain bağlandı) · GitHub: `zileaktar/zile-aktar` (private)
Mimari + kod durumu: `devir-promptu.md`

---

## A. GERÇEK SATIŞI ENGELLEYEN (bitmeden para tahsil edilemez)

- [x] **İşletme kaydı / vergi levhası** — Suzan EŞAT gerçek kişi ticari işletmesi, VKN 3801213625, vergi levhası mevcut.
- [ ] **iyzico PRODUCTION onayı — YENİDEN başvuruluyor.** İlk başvuru (7 Eylül, belgeler `inceleme@iyzico.com`'a gönderildi) panelde eski/farklı bir e-postayla kayıtlı çıktığı için ilerlemedi; iyzico "Bize Ulaşın" üzerinden de düzeltilemedi (otomatik şablon yanıt döngüsü). **16 Eylül'den itibaren `merchant.iyzipay.com/auth/register`'da SIFIRDAN, Suzan EŞAT'ın kendi telefon numarası + `zileaktar@gmail.com` e-postasıyla yeni başvuru** açıldı:
  - Şirket türü: Şahıs Şirketi · İş modeli: "Çay, Kahve, Kakao ve Baharat Perakende Ticareti" · E-ticaret altyapısı: "Diğerleri" (özel/Next.js yazılım) · Ürün adresi: `https://zileaktar.com`
  - Yasal Şirket Yetkilisi: Suzan EŞAT (kendi hesabı, "Yasal Şirket Yetkilisiyim" seçildi)
  - **Şu an TAKILI KALDI:** kimlik (TC Kimlik ön/arka yüz) yükleme adımında iyzico sunucuları "Bağlantı zaman aşımına uğradı" hatası veriyor — **iyzico'nun kendi sunucu sorunu**, birkaç saat/gün sonra tekrar denenecek.
  - Not: şahıs işletmesi (vergi levhalı) iyzico "kurumsal üyelik" için uygundur, Ltd. kurmak gerekmez.
  - **Sıradaki:** iyzico sunucuları düzelince kimlik fotoğraflarını yükle → başvuruyu tamamla → değerlendirme → sözleşme → onay. Onay gelince yap:
    - Vercel env: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` (prod), `IYZICO_BASE_URL=https://api.iyzipay.com`, `IYZICO_WEBHOOK_SECRET` (prod)
    - iyzico panelinde callback/notification URL'leri → `https://zileaktar.com/...` (domain zaten hazır)
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
- [x] **Özel domain satın alındı ve bağlandı:** `zileaktar.com` (Vercel üzerinden, $11.25/yıl, 16 Eylül 2027'de otomatik yenileniyor). Yapılanlar:
  - ✅ Vercel projesine eklendi ("Valid Configuration")
  - ✅ Vercel env `NEXT_PUBLIC_APP_URL=https://zileaktar.com` (redeploy edildi, giriş test edildi, çalışıyor)
  - ✅ Supabase → Auth → URL Configuration (Site URL + Redirect URLs'e eklendi, eski `vercel.app` ve `localhost` silinmedi)
  - ✅ Cloudflare Turnstile → widget hostname listesine eklendi
  - ✅ `src/lib/legal.ts` `webAdresi` → `https://zileaktar.com`
  - [ ] Brevo → domaini ekle + SPF/DKIM DNS kayıtları (opsiyonel, e-posta teslim oranı için — acil değil)
  - [ ] Google Search Console kaydı + `sitemap.xml` gönder (aşağıda D'de)
  - [ ] iyzico canlı onayı gelince callback/notification URL'leri `zileaktar.com` ile güncellenecek (yukarıda A'da)
- [ ] **Vercel Cron doğrula** — deploy sonrası Vercel → Cron sekmesi (`0 3 * * *`, bekleyen iyzico siparişlerini 24 saatte iptal eder).
- [x] **Havale/EFT IBAN** — `/admin/ayarlar`'dan girildi.
- [ ] Supabase parolası güçlü mü teyit.

## D. ANALYTICS / SEO

- [x] **Google Analytics 4** — kuruldu, çalışıyor (çerez izniyle koşullu). Ölçüm Kimliği `.env.local` + Vercel'de.
- [x] **Meta (Facebook) Pixel** — kuruldu, çalışıyor (çerez izniyle koşullu). Veri Seti Kodu `.env.local` + Vercel'de, PageView olayları "Tarayıcı" kaynağından doğrulandı.
- [ ] **Google Search Console** — domain alınınca kayıt + `sitemap.xml` gönder + doğrulama.
- [x] Dinamik `sitemap.xml` (tüm aktif ürünler + sayfalar), `robots.txt`, per-sayfa başlık/açıklama, `Store` + `Product` + `BreadcrumbList` + `FAQPage` şeması, breadcrumbs.
- [ ] `Store` şemasına `geo` (enlem/boylam) — kod hazır (`src/lib/legal.ts` `haritaLinki`/`enlem`/`boylam`); Google İşletme Profili'nden koordinat girilince otomatik devreye girer.
- [ ] **Google İşletme Profili ("Zile Lokman Aktar")** — doğrulanmış profil var. Yapılacak: profile web sitesi (`https://zileaktar.com`) + birincil kategori "Aktar" + çalışma saatleri girilecek; sonra Haritalar "Paylaş" linki + koordinat alınıp `legal.ts`'e yazılacak (site ↔ profil bağlantısı + "Google'da Yorum Yap" butonu).
- [x] **iyzico "kolai" alışveriş asistanı ürün akışı** — `https://zileaktar.com/urun-feed.xml` (Google Merchant Center uyumlu RSS/XML, 199 ürün satırı). kolai ayarlarına XML linki + Günlük güncelleme aralığı olarak girildi. Aynı link ileride Google Merchant Center için de kullanılabilir.

## E. İÇERİK (mağaza sahibi)

- [ ] **Gerçek ürün fotoğrafları** — 198 ürün placeholder SVG. `/admin/urunler` → ürün düzenle → ana görsel + "Diğer Görseller (galeri)" bölümünden ek fotoğraflar (müşteri detay sayfasında kaydırır).
- [ ] **Ürün gramaj/fiyatları** — her ürün tek "STD" varyantla. 500g/1kg/2kg gibi seçenekleri `/admin/urunler`'den ekle (ekranda buton olarak görünür).
- [x] **Ürün açıklamaları** — 198 ürünün tamamı dolu (migration 0009 + 0021–0027, veritabanına uygulandı). Profesyonel format: Ürün Hakkında / Öne Çıkan Özellikleri / Kullanım Şekli / Saklama Koşulları / Önemli Uyarılar + mevzuat uyarısı.
- [ ] **Kampanya afişleri** — `/admin/afisler`'den görsel + başlık/buton yükle (yoksa sade başlık gösterilir).
- [ ] **Sosyal medya linkleri** — Instagram/Facebook hesap adreslerini ver, footer'a eklenir.
- [ ] Anasayfa hero — afiş yokken CSS gradyan başlık gösteriliyor (Unsplash kaldırıldı). İstenirse afişsiz durum için kendi görseli konabilir.
- [ ] `/hakkimizda` sayfası yayında (metin `legal.ts`'ten). İstenirse gerçek mağaza/ekip fotoğrafı eklenebilir (opsiyonel).

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
SSS sayfası · İletişim + harita sayfası · Hakkımızda sayfası · Çoklu adres yönetimi (Hesabım → Adreslerim, migration 0029) ·
Müşteri sipariş detay sayfası · Ürün galerisi / çoklu fotoğraf (migration 0030) · Admin ürün listesi arama/filtre ·
2026 denetim düzeltmeleri (kullanılmayan paket temizliği, ProductCard server component, erişilebilirlik/odak yönetimi,
HSTS + admin noindex) · Özel domain bağlama (zileaktar.com) · kolai/Google Merchant ürün XML akışı
