# Zile Aktar — Yayın (Production) Kontrol Listesi

Sitenin gerçek satışa hazır hale gelmesi için kalan tüm maddeler. Her madde bitince `[x]` koy.
**Kod tarafı bitti** — kalanlar dış hesap / iş / hukuk / içerik ve manuel test.

Canlı: `https://zileaktar.com` (özel domain bağlandı) · GitHub: `zileaktar/zile-aktar` (private)
Mimari + kod durumu: `devir-promptu.md`

---

## A. GERÇEK SATIŞI ENGELLEYEN (bitmeden para tahsil edilemez)

- [x] **İşletme kaydı / vergi levhası** — Suzan EŞAT gerçek kişi ticari işletmesi, VKN 3801213625, vergi levhası mevcut.
- [x] **Ödeme sağlayıcısı: iyzico → VakıfBank Sanal POS.** iyzico'dan vazgeçildi. VakıfBank (Zile Şubesi) üye işyeri tanımlarını yaptı, Sanal POS hazır (25 Eylül). "Güvenli Ortak Ödeme" (CommonPayment) entegrasyonu yazıldı ve **test ortamında uçtan uca doğrulandı** (sipariş KA-260925-185985 → Ödendi).
- [ ] **VakıfBank CANLI bilgilere geçiş** — şu an Vercel'de dokümandaki PAYLAŞIMLI TEST bilgileri var. Yapılacak:
  - `sanalpos.vakifbank.com.tr`'ye gir (kullanıcı adı/şifre SMS ile geldi) → Üye İşyeri İşlemleri → **Üye İşyeri Yetkileri** (Üye İşyeri No + API şifresi) ve **Terminal Listesi** (Terminal No).
  - Vercel env: `VAKIFBANK_MERCHANT_NUMBER`, `VAKIFBANK_TERMINAL_NUMBER`, `VAKIFBANK_PASSWORD` → gerçek değerler; `VAKIFBANK_API_BASE_URL=https://inbound.apigateway.vakifbank.com.tr:8443`; `VAKIFBANK_PAYMENT_PAGE_URL=https://guvenliodeme.vakifbank.com.tr`. Redeploy.
  - Canlıda küçük tutarlı gerçek bir kartla 1 test siparişi → admin'de "Ödendi" → aynı gün panelden iptal.
  - ~~iyzico kodu silinecek~~ ✅ silindi (26 Eylül).
- [x] **Vercel Pro'ya geçildi** (25 Eylül, $20/ay) — Image Optimization limiti aşılıp site "paused" olunca. Spend Management: $200 bütçe, otomatik durdurma KAPALI (sadece e-posta uyarısı).

## B. YASAL (TR e-ticaret mevzuatı)

- [x] Yasal metinler yayında: `/on-bilgilendirme-formu`, `/mesafeli-satis-sozlesmesi`, `/iptal-iade-kosullari` (+ cayma bildirim formu), `/teslimat-ve-kargo`, `/kvkk` (GA/Pixel + yurt dışı aktarım dahil), `/cerez-politikasi`, `/kullanim-kosullari`, `/sss`. Footer + checkout onay kutularında link. "TASLAK" uyarısı kaldırıldı; artık "Son güncelleme: {tarih}" gösteriliyor. İşletme bilgileri `legal.ts`'ten dolu.
- [x] **Gıda İşletmesi Kayıt Belgesi** — İlçe Tarım ve Orman Müdürlüğü'nden alındı, iyzico'ya iletildi.
- [ ] **Avukat / mali müşavir son kontrolü** (metinler yayında ama uzman gözünden geçmedi) — taksitli ödeme açıksa vade farkı bilgisi · VERBİS muafiyeti · KEP adresi eklensin mi.
- [x] **`src/lib/legal.ts` işletme bilgileri dolduruldu:** Unvan: Suzan EŞAT (gerçek kişi ticari işletme) · Zile V.D. · VKN 3801213625 · MERSİS 2246369545600001 · Ticaret Sicil 4076 · NACE 47.27.04 · Kargo: Aras Kargo · Çalışma saatleri: Pzt–Cmt 09:00–19:00.
- [x] Sağlık beyanı disclaimer + admin ürün formunda yasaklı ifade kontrolü.
- [x] **Mevzuat uyum turu (20 Kasım 2026, kod):** iade kargo 1 Ocak 2026 kuralına uyarlandı (belirtilen taşıyıcı Aras Kargo ile iade ÜCRETSİZ — ÖBF/MSS/iade/SSS/ürün şeması) · uyuşmazlıkta dava öncesi arabuluculuk ibaresi · KVKK yurt dışı aktarım paragrafı 2024 m.9'a göre · ödeme sayfasında ÖBF ve MSS ayrı teyit, KVKK onay kutusu kaldırılıp bilgilendirme notu yapıldı · footer'da satıcı kimlik bilgileri + "Çerez Tercihleri" (rızayı geri çekme) · üyelikte Kullanım Koşulları/KVKK bağlantısı + ticari ileti onay metni.
- [ ] **Aras Kargo anlaşmalı iade (müşteri iade kodu)** — Aras Kargo Zile şubesinden "anlaşmalı müşteri + iade kodu" tanımlatılacak. Sitede artık "Aras ile iade ücretsiz" yazıyor; kod yoksa müşterinin ödediği iade ücreti mağazaca karşılanmalı.
- [ ] **ETBİS kaydı** — e-Devlet → "Elektronik Ticaret Bilgi Sistemi (ETBİS)" → zileaktar.com kaydı (faaliyete başlamadan önce zorunlu). Karekod uygulaması Eylül 2025'te kaldırıldı — sitede göstermek zorunlu değil; Bakanlık bir doğrulama bağlantısı verirse `legal.ts` → `etbisDogrulamaLinki`.
- [x] **Mevzuat uyum turu 2 (20 Kasım 2026, kod):** siparişe özel ÖBF + MSS (ödeme sayfasında önizleme, sipariş anında `order_legal_documents` arşivi — migration 0044, değiştirilemez, 10 yıl silinemez — ve müşteriye ayrı e-posta) · satış şalteri `CHECKOUT_ENABLED` (false = yalnız admin sipariş verebilir) · `legal.ts` KEP/ETBİS alanları (boşsa görünmez).
- [ ] **`supabase db push`** — migration 0044 canlıya uygulanmadan yeni kod sipariş ALAMAZ (arşiv yazılamazsa sipariş iptal edilir). Önce db push, sonra deploy.
- [ ] **KVKK yurt dışı aktarım standart sözleşmeleri** — Supabase, Vercel, Brevo, Cloudflare, Sentry, Upstash, Google, Meta. Kurul'un standart sözleşmesi imzalanıp **imzadan sonra 5 iş günü içinde** Kurum'a bildirilmeli. KVKK metni bu güvenceye dayanıyor — avukatla yürütülecek.
- [ ] **VERBİS** — 50'den az çalışan + bilanço eşiği altında (2025/1572 Kurul kararı) ve ana faaliyet özel nitelikli veri işleme değil → muaf. Mali müşavirle teyit. Muafiyet aydınlatma/güvenlik yükümlülüklerini kaldırmaz.
- [ ] **İYS (İleti Yönetim Sistemi)** — üyelikte pazarlama onayı toplanıyor. Pazarlama e-postası/SMS/WhatsApp kampanyası GÖNDERİLMEDEN önce iys.org.tr'ye kayıt + toplanan onayların İYS'ye yüklenmesi gerekir. Sipariş/kargo e-postaları kapsam dışı.
- [ ] **Meslek odası** — kayıtlı oda (muhtemelen Zile TSO) `legal.ts` `meslekOdasi` alanına yazılınca footer + KVKK + ÖBF'de görünür.
- [ ] **e-Arşiv / e-Fatura** — internetten satışta e-Arşiv fatura zorunluluk eşiği mali müşavirle kontrol edilecek.
- [x] **Mevzuat uyum turu 3 (20 Kasım 2026, kod):** son 30 gün kuralı (migration 0045 — fiyat geçmişi + üstü çizili fiyat DB'de otomatik son 30 günün en düşüğüne eşitlenir) · birim fiyat (1 kg / 1 lt, `src/lib/unit-price.ts`) · ürün sayfasında Net Miktar + Satıcı + KDV satırı.
- [ ] **`supabase db push`** — migration 0045.
- [ ] **Ürün bilgisi doldurma (admin, ürün ürün):** menşe, saklama koşulu, alerjen, raf ömrü alanları; birden fazla bileşenli ürünlerde (karışım çay/baharat, kozmetik) içindekiler listesi açıklamaya yazılmalı.

## C. ALTYAPI / GÜVENLİK

- [x] **2FA:** Supabase + Vercel + GitHub — hepsi authenticator ile korumalı.
- [x] **`CRON_SECRET`** — güçlü rastgele değer, `.env.local` + Vercel'de.
- [x] **Vercel gizli değişkenleri "Secret" tipine çevrildi** (26 Eylül) — `VAKIFBANK_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, `BREVO_API_KEY`, `SENTRY_AUTH_TOKEN`, PII anahtarları.
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
  - [x] Brevo alan adı doğrulaması (29 Eylül) — Vercel DNS: `brevo-code` TXT (@), `brevo1/brevo2._domainkey` CNAME, `_dmarc` TXT (p=none). Gönderen artık `siparis@zileaktar.com` (`LEGAL.gonderenEposta`), yanıtlar `zileaktar@gmail.com`'a.
  - [ ] Google Search Console kaydı + `sitemap.xml` gönder (aşağıda D'de)
  - ~~iyzico callback URL'leri~~ — iyzico kullanılmıyor (VakıfBank dönüş adresi kodda `NEXT_PUBLIC_APP_URL`'den üretilir).
- [ ] **Vercel Cron doğrula** — deploy sonrası Vercel → Cron sekmesi (`*/15 * * * *`, ödenmemiş kart siparişlerini 1 saatte iptal eder).
- [x] **Havale/EFT IBAN** — `/admin/ayarlar`'dan girildi.
- [ ] Supabase parolası güçlü mü teyit.

## D. ANALYTICS / SEO

- [x] **Google Analytics 4** — kuruldu, çalışıyor (çerez izniyle koşullu). Ölçüm Kimliği `.env.local` + Vercel'de.
- [x] **Meta (Facebook) Pixel** — kuruldu, çalışıyor (çerez izniyle koşullu). Veri Seti Kodu `.env.local` + Vercel'de, PageView olayları "Tarayıcı" kaynağından doğrulandı.
- [x] **Google Search Console** (26 Eylül) — Domain mülkü `zileaktar.com` (Vercel DNS TXT ile doğrulandı), `sitemap.xml` gönderildi → Başarılı, 209 sayfa.
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
