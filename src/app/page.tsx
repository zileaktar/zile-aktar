import type { Metadata } from 'next';
import { getCategories, getProducts, getAvailableForms } from '@/lib/data/products';
import { getActiveCampaignBanners } from '@/lib/data/banners';
import { ProductCard } from '@/components/product/ProductCard';
import { CampaignCarousel } from '@/components/home/CampaignCarousel';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { PRODUCT_FORMS, PRODUCT_FORM_LABELS } from '@/lib/validations/product';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Anasayfa',
  description: 'Hakiki bal, soğuk sıkım yağlar, taze baharatlar ve şifalı bitki çayları — %100 doğal ve yöresel ürünler.'
};

// Ürün/stok verisi sık değişebileceğinden bu sayfa her istekte sunucuda render edilir
// (Next.js Full Route Cache devre dışı); kategori listesi ise ayrıca 5dk önbelleklenir.
export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ kategori?: string; q?: string; form?: string; sayfa?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { kategori, q, form, sayfa } = await searchParams;
  const activeForm = form && (PRODUCT_FORMS as readonly string[]).includes(form) ? form : undefined;
  const page = Math.max(1, Number.parseInt(sayfa ?? '1', 10) || 1);
  const [categories, availableForms, banners, { products, totalCount, totalPages }] = await Promise.all([
    getCategories(),
    getAvailableForms(),
    getActiveCampaignBanners(),
    getProducts({ categorySlug: kategori, searchQuery: q, form: activeForm, page })
  ]);
  const formChips = PRODUCT_FORMS.filter((f) => availableForms.includes(f));

  const activeCategoryName = q?.trim()
    ? `"${q.trim()}" için sonuçlar`
    : kategori && kategori !== 'all'
      ? categories.find((c) => c.slug === kategori)?.name
      : 'Tüm Ürünler';

  function buildHref(overrides: { form?: string | null; sayfa?: number }) {
    const params = new URLSearchParams();
    if (kategori) params.set('kategori', kategori);
    if (q) params.set('q', q);
    const nextForm = overrides.form === undefined ? activeForm : overrides.form;
    if (nextForm) params.set('form', nextForm);
    const nextPage = overrides.sayfa ?? 1;
    if (nextPage > 1) params.set('sayfa', String(nextPage));
    const qs = params.toString();
    return qs ? `/?${qs}#urunler` : '/#urunler';
  }
  const pageHref = (targetPage: number) => buildHref({ sayfa: targetPage });

  return (
    <>
      {/* KAMPANYA AFİŞLERİ — admin panelinden (/admin/afisler) yönetilir.
          Afiş yoksa sade bir tanıtım başlığı gösterilir. */}
      {banners.length > 0 ? (
        <CampaignCarousel banners={banners} />
      ) : (
        <section className="bg-gradient-to-r from-primary-dark to-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="max-w-xl">
              <span className="inline-block bg-accent/90 text-primary-dark text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-5">
                🌿 1998&apos;den Beri Aktarlık Geleneği
              </span>
              <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight mb-5">
                Doğadan Gelen <span className="text-accent-light">Şifa</span> & Yöresel Lezzetler
              </h1>
              <p className="text-cream/85 text-base sm:text-lg mb-8 max-w-md">
                Hiçbir katkı maddesi içermeyen, doğrudan üreticiden sofranıza gelen hakiki bal, soğuk sıkım yağlar ve
                şifalı bitkiler.
              </p>
              <a
                href="#urunler"
                className="touch-target inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-primary-dark font-bold px-7 py-3.5 rounded-full transition shadow-lg"
              >
                Şimdi Keşfet
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ÖNE ÇIKAN ÖZELLİKLER */}
      <section className="bg-white border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: '🚚', title: 'Kargo Bedava', sub: `${LEGAL.ucretsizKargoEsigiTl}₺ üzeri siparişte` },
            { icon: '🌿', title: '%100 Taze & Doğal', sub: 'Katkı maddesiz' },
            { icon: '🔒', title: 'Güvenli 3D Ödeme', sub: 'iyzico ile SSL korumalı' },
            { icon: '🏺', title: 'Geleneksel Üretim', sub: 'Yöresel ustalardan' }
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                {f.icon}
              </div>
              <div>
                <div className="font-semibold text-sm sm:text-base leading-tight">{f.title}</div>
                <div className="text-xs text-carbon/55">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ÜRÜNLER */}
      <main id="urunler" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {(q?.trim() || (kategori && kategori !== 'all')) && (
          <Breadcrumbs
            items={[
              { name: 'Anasayfa', href: '/' },
              { name: activeCategoryName ?? 'Ürünler' }
            ]}
          />
        )}
        <div className="flex items-end justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary">{activeCategoryName}</h2>
            <p className="text-sm text-carbon/55 mt-1">{totalCount} ürün bulundu</p>
          </div>
        </div>

        {/* FORM FİLTRESİ — yalnızca ürünlere atanmış formlar için gösterilir */}
        {formChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
            <a
              href={buildHref({ form: null })}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                !activeForm ? 'bg-primary text-white border-primary' : 'bg-white text-carbon/60 border-primary/15 hover:border-primary/30'
              }`}
            >
              Tüm Formlar
            </a>
            {formChips.map((f) => (
              <a
                key={f}
                href={buildHref({ form: activeForm === f ? null : f })}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  activeForm === f ? 'bg-primary text-white border-primary' : 'bg-white text-carbon/60 border-primary/15 hover:border-primary/30'
                }`}
              >
                {PRODUCT_FORM_LABELS[f]}
              </a>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold text-lg text-primary">Aradığınız ürün bulunamadı</p>
            <p className="text-carbon/50 text-sm mt-1">Farklı bir kelime veya kategori deneyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Sayfalar">
            <a
              href={pageHref(Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              className={`touch-target px-4 py-2 rounded-full text-sm font-semibold border ${
                page <= 1 ? 'pointer-events-none opacity-40 border-primary/10' : 'border-primary/20 text-primary hover:bg-primary/5'
              }`}
            >
              ← Önceki
            </a>
            <span className="text-sm text-carbon/60 px-2">
              Sayfa {page} / {totalPages}
            </span>
            <a
              href={pageHref(Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
              className={`touch-target px-4 py-2 rounded-full text-sm font-semibold border ${
                page >= totalPages ? 'pointer-events-none opacity-40 border-primary/10' : 'border-primary/20 text-primary hover:bg-primary/5'
              }`}
            >
              Sonraki →
            </a>
          </nav>
        )}
      </main>
    </>
  );
}
