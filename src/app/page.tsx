import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { getCategories } from '@/lib/data/products';
import { getActiveCampaignBanners } from '@/lib/data/banners';
import { CampaignCarousel } from '@/components/home/CampaignCarousel';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductListing } from '@/components/product/ProductListing';
import { LEGAL } from '@/lib/legal';

const HOME_TITLE = "Zile Aktar | Tokat Zile'den Baharat, Doğal Yağ, Bitki ve Yöresel Ürünler";
const HOME_DESCRIPTION =
  "Tokat Zile'deki aktarımızdan pul biber, isot, sumak, çörek otu yağı, ıhlamur, defne sabunu, doğal sirkeler ve yüzlerce ürün. Güvenli 3D ödeme, hızlı kargo.";

/**
 * Arama motoru ayarları:
 * - Filtresiz anasayfa → canonical `/`.
 * - `?kategori=x` → `/kategori/x`'e kalıcı yönlendirilir (sayfada); canonical da oraya işaret eder.
 * - `?q=` arama sonuçları → indekslenmez (sonsuz sayıda ince sayfa olmasın), linkler izlenir.
 */
export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const { kategori, q } = await searchParams;
  if (q?.trim()) {
    return { title: `"${q.trim()}" arama sonuçları`, robots: { index: false, follow: true } };
  }
  if (kategori && kategori !== 'all') {
    return { alternates: { canonical: `/kategori/${encodeURIComponent(kategori)}` } };
  }
  return {
    title: { absolute: HOME_TITLE },
    description: HOME_DESCRIPTION,
    alternates: { canonical: '/' }
  };
}

// Ürün/stok verisi sık değişebileceğinden bu sayfa her istekte sunucuda render edilir
// (Next.js Full Route Cache devre dışı); kategori listesi ise ayrıca 5dk önbelleklenir.
export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ kategori?: string; q?: string; form?: string; sayfa?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { kategori, q, form, sayfa } = await searchParams;
  // Eski kategori adresi (/?kategori=x — eski afişler, Google'daki eski kayıtlar)
  // kalıcı olarak kategori sayfasına taşınır. Arama (?q=) kategori içinde kalabilir.
  if (kategori && kategori !== 'all' && !q?.trim()) {
    const rest = new URLSearchParams();
    if (form) rest.set('form', form);
    if (sayfa) rest.set('sayfa', sayfa);
    const qs = rest.toString();
    permanentRedirect(`/kategori/${encodeURIComponent(kategori)}${qs ? `?${qs}` : ''}`);
  }
  const page = Math.max(1, Number.parseInt(sayfa ?? '1', 10) || 1);
  const [categories, banners] = await Promise.all([getCategories(), getActiveCampaignBanners()]);

  const activeCategoryName = q?.trim()
    ? `"${q.trim()}" için sonuçlar`
    : kategori && kategori !== 'all'
      ? categories.find((c) => c.slug === kategori)?.name
      : 'Tüm Ürünler';

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
              {/* Sayfanın tek h1'i aşağıdaki tanıtım bölümünde — bu yalnızca görsel başlık. */}
              <p className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight mb-5">
                Doğadan Gelen <span className="text-accent-light">Şifa</span> & Yöresel Lezzetler
              </p>
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
            { icon: '🔒', title: 'Güvenli 3D Ödeme', sub: 'VakıfBank ile SSL korumalı' },
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

      {/* TANITIM — filtresiz anasayfada. Google sitenin ne sattığını ve nerede
          olduğunu bu başlık + metinden anlar; kategori linkleri kategori
          sayfalarını (/kategori/...) Google'a tanıtır. */}
      {!q?.trim() && !(kategori && kategori !== 'all') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12">
          <h1 className="font-display font-bold text-xl sm:text-2xl text-primary mb-2">
            Tokat Zile&apos;den Aktar Ürünleri: Baharat, Doğal Yağ, Kurutulmuş Bitki ve Sabun
          </h1>
          <p className="text-sm sm:text-base text-carbon/70 max-w-3xl leading-relaxed mb-4">
            {LEGAL.markaAdi}, Tokat&apos;ın Zile ilçesindeki aktar dükkânının internet mağazasıdır. Pul biber, isot ve sumaktan
            çörek otu yağına, ıhlamurdan defne sabunu ve doğal sirkelere kadar yüzlerce ürünü güvenli ödeme ile sipariş
            edebilir, Türkiye&apos;nin her yerine kargoyla teslim alabilirsiniz.
          </p>
          <nav aria-label="Kategori sayfaları" className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/kategori/${c.slug}`}
                className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-white hover:bg-primary/5"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </section>
      )}

      {/* ÜRÜNLER — landmark <main> layout.tsx'te; burada tekrarı geçersiz olurdu. */}
      <section id="urunler" aria-label="Ürünler" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {(q?.trim() || (kategori && kategori !== 'all')) && (
          <Breadcrumbs
            items={[
              { name: 'Anasayfa', href: '/' },
              { name: activeCategoryName ?? 'Ürünler' }
            ]}
          />
        )}
        <ProductListing
          title={activeCategoryName ?? 'Ürünler'}
          basePath="/"
          categorySlug={kategori}
          searchQuery={q}
          form={form}
          page={page}
        />
      </section>
    </>
  );
}
