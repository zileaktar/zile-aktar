# Deployment Rehberi — Vercel + Supabase + iyzico

## 0. Ön Koşul (Bu Depo İçin Önemli Not)

Bu proje, Node.js'in **kurulu olmadığı** bir geliştirme ortamında yazıldı. İlk adım olarak kendi makinenizde/CI'da:

```bash
node -v   # >= 20.0.0 olmalı
npm install
npm run typecheck
npm run build
```

komutlarını çalıştırıp çıkan derleme hatalarını (varsa) düzeltin. Kod, doğru olacak şekilde elle yazıldı ancak hiç
derlenmedi — bağımlılık sürüm uyuşmazlığı gibi küçük sürtünmeler normaldir.

## 1. Supabase Projesi Kurulumu

1. [supabase.com](https://supabase.com) üzerinde yeni proje oluşturun (bölge: `eu-central-1` — Türkiye'ye en yakın, düşük gecikme).
2. Supabase CLI'ı kurun ve projeye bağlayın:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <PROJECT_REF>
   ```
3. Migration'ları uygulayın (sırayla `supabase/migrations/` altındaki tüm dosyalar):
   ```bash
   supabase db push
   ```
4. (Opsiyonel, sadece geliştirme/demo için) Seed verisini yükleyin. Yerelde Docker ile çalışıyorsanız `supabase db reset`
   migration'ları uygulayıp `supabase/seed.sql`'i otomatik çalıştırır. Uzak (linked) bir projeye seed atmak için CLI
   sürümünüze göre komut adı değişebileceğinden en güvenilir yol, `supabase/seed.sql` dosyasının içeriğini Supabase
   Dashboard → SQL Editor'e yapıştırıp çalıştırmaktır.
5. Proje Ayarları → API sekmesinden `URL`, `anon key`, `service_role key` değerlerini alın → `.env.local`.
6. Storage sekmesinde `product-images` bucket'ının oluştuğunu doğrulayın (migration 0003 ile otomatik gelir).
7. İlk admin kullanıcısını oluşturun: Authentication → Users → "Add user" ile bir hesap açın, sonra SQL Editor'de:
   ```sql
   update public.profiles set role = 'admin' where id = '<yeni-kullanicinin-uuid-si>';
   ```
8. **E-posta şablonları:** Authentication → Email Templates altında Türkçeleştirin (varsayılan İngilizce gelir).
9. **Auth ayarları:** Authentication → URL Configuration → Site URL'i production domaininize (`https://www.koktenaktar.com.tr`) ayarlayın; aksi halde doğrulama e-postalarındaki bağlantılar yanlış adrese gider.

## 2. Upstash Redis (Rate Limiting)

1. [upstash.com](https://upstash.com) üzerinde ücretsiz bir Redis veritabanı oluşturun (bölge: Vercel fonksiyonlarınıza en yakın bölge, örn. `eu-west-1`).
2. REST URL ve REST Token değerlerini `.env.local`'e ekleyin.

## 3. iyzico Hesabı

1. [iyzico.com](https://www.iyzico.com) üzerinden üye iş yeri başvurusu yapın (onay süreci birkaç gün sürebilir).
2. Test/Sandbox için [sandbox-merchant.iyzipay.com](https://sandbox-merchant.iyzipay.com) üzerinden test API anahtarları alın.
3. `.env.local`:
   - Test: `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com`
   - Canlı: `IYZICO_BASE_URL=https://api.iyzipay.com` (gerçek API anahtarlarıyla)
4. **Webhook imza sırrı:** iyzico panelinden webhook bildirim URL'nizi (`https://www.koktenaktar.com.tr/api/webhooks/iyzico`) tanımlayın ve panelin verdiği imza doğrulama sırrını `IYZICO_WEBHOOK_SECRET`'e yazın.
5. **ÖNEMLİ:** `src/lib/iyzico.ts` içindeki imzalama algoritmasını sandbox ortamında uçtan uca (gerçek bir test kartıyla) doğrulamadan canlıya almayın — dosyanın başındaki uyarıyı okuyun.

## 4. Sentry

1. [sentry.io](https://sentry.io) üzerinde bir "Next.js" projesi oluşturun.
2. DSN'i `NEXT_PUBLIC_SENTRY_DSN`'e, org/project slug'larını `SENTRY_ORG`/`SENTRY_PROJECT`'e yazın.
3. Source map yükleme için bir Auth Token oluşturup `SENTRY_AUTH_TOKEN`'a ekleyin (yalnızca Vercel build ortamında gerekir, tarayıcıya gitmez).

## 5. Vercel'e Deploy

1. GitHub reposunu Vercel'e bağlayın (Vercel Dashboard → Add New → Project → repo seçin).
2. Framework Preset: **Next.js** (otomatik algılanır).
3. Environment Variables sekmesinde `.env.example`'daki TÜM değişkenleri girin (Production + Preview ortamları için ayrı ayrı; sandbox iyzico anahtarlarını Preview'a, gerçek anahtarları yalnızca Production'a koyun).
4. Deploy'u başlatın. İlk deploy sonrası Vercel size `*.vercel.app` bir önizleme adresi verir.
5. **Cron Job:** `vercel.json` içinde tanımlı `/api/cron/expire-pending-orders` işi otomatik olarak Vercel Cron'a kaydolur (Vercel Pro plan veya üzeri gerektirir; Hobby planda cron sıklığı günde 1'e sınırlıdır — zaten `0 3 * * *` olarak ayarlı).

## 6. Özel Alan Adı (Custom Domain) ve DNS

1. Vercel Dashboard → Project → Settings → Domains → alan adınızı girin (örn. `koktenaktar.com.tr` ve `www.koktenaktar.com.tr`).
2. Vercel size aşağıdakine benzer DNS kayıtları önerecektir — bunları alan adını satın aldığınız sağlayıcının (Natro, GoDaddy, Cloudflare vb.) DNS yönetim panelinden ekleyin:

   | Tip | Ad/Host | Değer | Not |
   |---|---|---|---|
   | A | `@` (kök alan adı) | `76.76.21.21` | Vercel'in güncel IP'sini deploy ekranından teyit edin, değişebilir |
   | CNAME | `www` | `cname.vercel-dns.com` | `www` alt alan adı için |
   | TXT | `_vercel` | Vercel'in verdiği doğrulama string'i | Yalnızca ilk doğrulama sırasında istenir |

3. DNS yayılması genellikle birkaç dakika, bazen 24-48 saat sürebilir (`dig koktenaktar.com.tr` ile kontrol edebilirsiniz).
4. **SSL/TLS:** Vercel, doğru DNS kayıtları algılandıktan sonra Let's Encrypt üzerinden **otomatik** olarak SSL sertifikası oluşturur ve yeniler — manuel bir işlem gerekmez. "Domains" ekranında sertifika durumunun "Valid Configuration" olduğunu doğrulayın.
5. Supabase Auth "Site URL" ve "Redirect URLs" ayarlarını yeni domain'e güncellemeyi unutmayın (adım 1.9).
6. iyzico panelindeki webhook/callback URL'lerini de yeni domain'e güncelleyin.

## 7. Deploy Sonrası Kontrol Listesi

- [ ] `npm run build` hatasız tamamlanıyor
- [ ] Sandbox iyzico ile uçtan uca test siparişi (kart: iyzico'nun sağladığı test kart numaralarıyla) başarılı
- [ ] Kapıda ödeme akışı sipariş oluşturuyor ve stok düşüyor
- [ ] `/api/webhooks/iyzico` sahte bir imzayla 401 dönüyor (imza doğrulama çalışıyor)
- [ ] Admin kullanıcı olmayan biri `/admin`'e gidince `/` sayfasına yönlendiriliyor
- [ ] `/hesabim/veri-talebi` üzerinden veri indirme ve hesap silme çalışıyor
- [ ] Sentry'de test hatası (`throw new Error('test')` içeren geçici bir route ile) görünüyor
- [ ] Lighthouse/PageSpeed mobilde 90+ performans skoru
