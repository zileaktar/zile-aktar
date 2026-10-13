import { getAvailableForms, getProducts } from '@/lib/data/products';
import { getFavoritesContext } from '@/lib/data/favorites';
import { ProductCard } from '@/components/product/ProductCard';
import { PRODUCT_FORMS, PRODUCT_FORM_LABELS } from '@/lib/validations/product';

/**
 * Ürün ızgarası + form filtresi + sayfalama. Anasayfa (`/`, `?kategori=`/`?q=`)
 * ve kategori sayfaları (`/kategori/[slug]`) ortak kullanır.
 *
 * `basePath`: filtre/sayfa linklerinin gideceği yol. Kategori sayfasında
 * `/kategori/<slug>` — böylece kullanıcı (ve Google) aynı kategori adresinde kalır;
 * anasayfada `/` ve kategori/arama sorgu parametre olarak taşınır.
 */
export async function ProductListing({
  title,
  basePath,
  categorySlug,
  searchQuery,
  form,
  page
}: {
  title: string;
  basePath: string;
  categorySlug?: string | undefined;
  searchQuery?: string | undefined;
  form?: string | undefined;
  page: number;
}) {
  const activeForm = form && (PRODUCT_FORMS as readonly string[]).includes(form) ? form : undefined;
  const [availableForms, { products, totalCount, totalPages }, { loggedIn, favoriteIds }] = await Promise.all([
    getAvailableForms(),
    getProducts({ categorySlug, searchQuery, form: activeForm, page }),
    getFavoritesContext()
  ]);
  const formChips = PRODUCT_FORMS.filter((f) => availableForms.includes(f));
  const keepCategoryInQuery = basePath === '/';

  function buildHref(overrides: { form?: string | null; sayfa?: number }) {
    const params = new URLSearchParams();
    if (keepCategoryInQuery && categorySlug) params.set('kategori', categorySlug);
    if (searchQuery) params.set('q', searchQuery);
    const nextForm = overrides.form === undefined ? activeForm : overrides.form;
    if (nextForm) params.set('form', nextForm);
    const nextPage = overrides.sayfa ?? 1;
    if (nextPage > 1) params.set('sayfa', String(nextPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}#urunler` : `${basePath}#urunler`;
  }
  const pageHref = (targetPage: number) => buildHref({ sayfa: targetPage });

  return (
    <>
      <div className="flex items-end justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary">{title}</h2>
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
            <ProductCard key={product.id} product={product} isFavorited={favoriteIds.has(product.id)} loggedIn={loggedIn} />
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
    </>
  );
}
