import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories } from '@/lib/data/products';
import { getCategorySeo } from '@/lib/category-seo';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductListing } from '@/components/product/ProductListing';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ form?: string; sayfa?: string }>;
}

async function findCategory(slug: string) {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { form, sayfa } = await searchParams;
  const category = await findCategory(slug);
  if (!category) return { title: 'Kategori Bulunamadı' };
  const seo = getCategorySeo(category.slug, category.name);
  const page = Math.max(1, Number.parseInt(sayfa ?? '1', 10) || 1);
  return {
    title: page > 1 ? `${seo.title} – Sayfa ${page}` : seo.title,
    description: seo.description,
    // Form filtresi yalnızca görünümü daraltır — Google'a asıl kategori sayfası gösterilir.
    alternates: { canonical: page > 1 && !form ? `/kategori/${category.slug}?sayfa=${page}` : `/kategori/${category.slug}` },
    openGraph: { title: seo.title, description: seo.description, url: `/kategori/${category.slug}` }
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { form, sayfa } = await searchParams;
  const category = await findCategory(slug);
  if (!category) notFound();
  const seo = getCategorySeo(category.slug, category.name);
  const page = Math.max(1, Number.parseInt(sayfa ?? '1', 10) || 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Breadcrumbs items={[{ name: 'Anasayfa', href: '/' }, { name: category.name }]} />
      <header className="mb-8 max-w-3xl">
        <h1 className="font-display font-bold text-2xl sm:text-4xl text-primary mb-3">{category.name}</h1>
        <p className="text-sm sm:text-base text-carbon/70 leading-relaxed">{seo.intro}</p>
      </header>
      <section id="urunler" aria-label={category.name}>
        <ProductListing
          title={`${category.name} Çeşitleri`}
          basePath={`/kategori/${category.slug}`}
          categorySlug={category.slug}
          form={form}
          page={page}
        />
      </section>
    </div>
  );
}
