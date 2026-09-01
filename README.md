# Kökten Aktar

Aktar ve yöresel ürünler için Next.js 14 + Supabase + iyzico ile kurulmuş production-ready e-ticaret uygulaması.

Mimari detaylar için [ARCHITECTURE.md](./ARCHITECTURE.md), canlıya alma adımları için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyalarına bakın.

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env.local   # değerleri doldurun (bkz. DEPLOYMENT.md adım 1-4)
supabase link --project-ref <PROJECT_REF>
supabase db push             # şema + RLS + RPC migration'larını uygular
# (opsiyonel) demo verisi: supabase/seed.sql içeriğini Dashboard > SQL Editor'e yapıştırıp çalıştırın
npm run dev
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production derlemesi |
| `npm run typecheck` | TypeScript strict tip kontrolü |
| `npm run lint` | ESLint |
| `npm run test` | Vitest birim testleri |
| `npm run test:e2e` | Playwright uçtan uca testleri (çalışan bir sunucu gerektirir) |

## Önemli Not

Bu depo, Node.js'in kurulu olmadığı bir ortamda yazıldı — yukarıdaki komutlar hiçbiri henüz çalıştırılmadı. İlk kurulumda
`npm run typecheck && npm run build` ile başlayın. Kapsam sınırları ve nelerin tam teşekküllü olduğu için
[ARCHITECTURE.md → "Bilinçli Kapsam Sınırları"](./ARCHITECTURE.md#bilinçli-kapsam-sınırları) bölümüne bakın.

Önceki tek-dosyalık statik prototip [legacy-static-demo/index.html](./legacy-static-demo/index.html) altında referans
olarak saklanmaktadır.
