# Zile Aktar — Yayın (Production) Kontrol Listesi

Bu dosya, sitenin gerçek satışa hazır hale gelmesi için kalan tüm maddeleri tutar.
Her madde bitince başına `[x]` koy. Kod tarafı büyük ölçüde bitti; kalanlar çoğunlukla
**dış hesap / iş / hukuk** işleri.

Canlı adres: `https://zile-aktar.vercel.app` (henüz özel domain yok)

---

## A. GERÇEK SATIŞI ENGELLEYEN (bunlar bitmeden para tahsil edilemez)

- [ ] **iyzico PRODUCTION hesabı** — şu an SANDBOX. Gerçek kart tahsilatı yok.
  - iyzico'ya işletme başvurusu (şahıs şirketi / vergi levhası / imza sirküleri vb.), sözleşme, onay süreci (günler-haftalar).
  - Onaylanınca Vercel'de şu 3 env güncellenir: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL=https://api.iyzipay.com` (sandbox → prod).
  - Prod callback URL'i iyzico panelinde: `https://<canlı-domain>/api/webhooks/iyzico/callback`
- [ ] **iyzico webhook imzası** — `integration@iyzico.com`'a aktivasyon e-postası atıldı, yanıt bekleniyor. Notification URL girildi: `https://zile-aktar.vercel.app/api/webhooks/iyzico`. (Yayın engeli DEĞİL — ödeme onayı 3DS callback ile zaten yapılıyor; webhook ek güvenlik ağı.)
- [ ] **Vercel Pro'ya geçiş** — Hobby planı ticari kullanıma kapalı (Vercel sözleşmesi). ~20 USD/ay. Deploy'dan önce şart.

## B. YASAL OLARAK ZORUNLU (TR e-ticaret mevzuatı)

- [ ] **Mesafeli Satış Sözleşmesi** (`/mesafeli-satis-sozlesmesi`) — şu an ŞABLON, avukat onayı gerekli.
- [ ] **KVKK Aydınlatma Metni** (`/kvkk`) — şu an ŞABLON, avukat onayı gerekli.
- [ ] **Ön Bilgilendirme Formu** — henüz YOK. Mesafeli sözleşmelerde zorunlu.
- [ ] **İptal / İade / Cayma Hakkı koşulları** sayfası — henüz YOK (14 gün cayma hakkı vb.).
- [ ] **Teslimat & Kargo koşulları** sayfası — henüz YOK.
- [ ] **Çerez Politikası** — `CookieConsent` bileşeni var ama ayrı bir politika sayfası yok.
- [ ] **Sağlık beyanı disclaimer'ı** — ✅ eklendi (`HealthDisclaimer`), admin ürün formunda yasaklı ifade kontrolü var. Yine de ürün açıklamaları mevzuata göre gözden geçirilmeli.
- [ ] İşletme bilgileri (unvan, adres, vergi no, MERSİS, ticaret sicil) footer'da / sözleşmelerde eksiksiz olmalı.

## C. ALTYAPI — YAYIN ÖNCESİ

- [ ] **Özel domain** (ör. `zileaktar.com`) — satın al (hosting.com.tr, sadece domain — hosting Vercel'de). Sonra:
  - Vercel → proje → Settings → Domains → domaini ekle → verilen DNS kayıtlarını domain sağlayıcıya gir
  - Vercel env: `NEXT_PUBLIC_APP_URL=https://zileaktar.com`
  - Supabase → Auth → URL Configuration → Site URL + Redirect URLs güncelle
  - Cloudflare Turnstile → widget hostname listesine yeni domain ekle
  - iyzico → callback/notification URL'lerini yeni domaine çevir
  - Brevo → domaini ekle + SPF/DKIM DNS kayıtları (e-posta teslim edilebilirliği artar; şu an `@gmail.com` gönderen ile çalışıyor ama domain auth daha iyi)
- [ ] **`CRON_SECRET`** — `.env.local` + Vercel'de hâlâ `placeholder-cron-secret-16chars-min`. Rastgele güçlü bir değerle değiştir (Vercel Cron bu header ile `/api/cron/expire-pending-orders`'a istek atıyor). Örn. `openssl rand -hex 24` çıktısı.
- [ ] **Vercel 2FA** — hesabı authenticator app ile koru (canlı mağazayı yönetiyor).
- [ ] **Supabase 2FA** + parola güçlü mü kontrol.
- [ ] **Vercel Cron çalışıyor mu** doğrula — `vercel.json`'da `0 3 * * *` tanımlı, Hobby'de 1 günlük cron limiti içinde. Pro'da sorun yok. Deploy sonrası Vercel → proje → Cron sekmesinden kontrol.
- [ ] **Havale/EFT IBAN** — `/admin/ayarlar` → "Havale/EFT Banka Bilgisi" formundan hesap sahibi + banka + IBAN gir. Girilene kadar havale ödeme "banka bilgileri tanımlı değil" der.

## D. ÜCRETSİZ KATMAN LİMİTLERİ (şimdilik yeter, büyüyünce yükselt)

- [ ] **Supabase Free** — 500MB DB, 5GB egress/ay, 7 günlük yedek. Sipariş hacmi artınca **Pro (~25 USD/ay)** — Point-in-Time Recovery yedekleri sipariş verisi için önemli.
- [ ] **Upstash Free** — 10.000 komut/gün. Rate limiting istek başına birkaç komut. Küçük mağaza için yeterli.
- [ ] **Sentry Free** — 5.000 hata/ay. Yeterli.
- [ ] **Brevo Free** — 300 e-posta/gün. Sipariş onayı + şifre sıfırlama için yeterli; büyürse yükselt.

## E. İÇERİK / UX

- [ ] **Gerçek ürün fotoğrafları** — 198 ürünün hepsi placeholder SVG. Mağaza sahibi `/admin/urunler` → ürün düzenle → görsel yükle ile ekler. (Claude görsel üretemez / aramaz.)
- [ ] **Ürün açıklamaları** — sadece 11 baharatın zengin açıklaması var (migration 0009 + 0012'de korundu). Kalan ~187 ürün açıklamasız. İstenirse aynı formatta yazılabilir.
- [ ] **Sipariş onay / kargo bilgisi e-postası** — şu an uygulama sipariş e-postası GÖNDERMİYOR (sadece "gönderilecektir" yazısı var). Brevo transactional API veya Supabase Edge Function ile eklenebilir. Müşteri güveni için önemli.
- [ ] Ana sayfa hero görseli hâlâ Unsplash'tan — telif açısından değiştirilebilir.
- [ ] `Organization` / `Store` Schema.org yapısal verisi (SEO) — telefon/adres artık var, eklenebilir.

## F. BİTENLER (referans)

- [x] Kod mimarisi, RLS, atomik sipariş RPC'si, güvenlik denetimi (migration 0011)
- [x] Katalog: 5 kategori / 198 ürün (migration 0012)
- [x] iyzico ödeme akışı (sandbox'ta uçtan uca test edildi) + Havale/EFT
- [x] Cloudflare Turnstile CAPTCHA (giriş/kayıt/şifre sıfırlama)
- [x] Ürün yorumları (moderasyonlu) + form filtreleme + STT/lot alanları + fatura adresi
- [x] Hesap otomatik doldurma + kaydetme, profil düzenleme
- [x] Şifre sıfırlama akışı (`/sifremi-unuttum` + `/sifre-yenile`)
- [x] Sentry (hata izleme) — test edildi
- [x] WhatsApp/telefon: `+90 551 173 00 94`
- [x] GitHub (private) + Vercel deploy — `zile-aktar.vercel.app` canlı
- [x] Brevo custom SMTP — canlı kayıt/doğrulama e-postası çalışıyor
