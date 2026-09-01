import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductBySlug } from '@/lib/data/products';
import { getProductReviews, getReviewContext } from '@/lib/data/reviews';
import { getProductImageUrl } from '@/lib/media';
import { safeJsonLd, getPlainExcerpt } from '@/lib/format';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { RichProductDescription } from '@/components/product/RichProductDescription';
import { HealthDisclaimer } from '@/components/product/HealthDisclaimer';
import { ProductReviews } from '@/components/product/ProductReviews';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Ürün Bulunamadı' };

  return {
    title: product.name,
    description: product.description ? getPlainExcerpt(product.description) : `${product.name} — Zile Aktar'da %100 doğal ürün.`,
    openGraph: { images: [{ url: `/api/og?title=${encodeURIComponent(product.name)}` }] },
    alternates: { canonical: `/urun/${product.slug}` }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const imageUrl = getProductImageUrl(product.image_path);
  const [{ reviews, count: reviewCount, average: reviewAverage }, reviewContext] = await Promise.all([
    getProductReviews(product.id),
    getReviewContext(product.id)
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: getPlainExcerpt(product.description),
    image: imageUrl,
    ...(reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewAverage.toFixed(1),
        reviewCount
      }
    }),
    offers: product.product_variants.map((v) => ({
      '@type': 'Offer',
      price: (v.price_cents / 100).toFixed(2),
      priceCurrency: 'TRY',
      availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      sku: v.sku
    }))
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
          <Image src={imageUrl} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
        </div>
        <ProductDetailClient product={product} />
      </div>

      {product.description && (
        <div className="max-w-3xl mt-12 pt-10 border-t border-primary/10">
          <RichProductDescription text={product.description} />
        </div>
      )}

      {(product.origin || product.allergen_info || product.shelf_life_note || product.storage_info) && (
        <div className="max-w-3xl mt-10">
          <h3 className="font-display font-bold text-primary text-base mb-3">Ürün Bilgileri</h3>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {product.origin && (
              <div className="flex justify-between gap-3 border-b border-primary/5 py-1.5">
                <dt className="text-carbon/50">Menşe / Yöre</dt>
                <dd className="font-medium text-right">{product.origin}</dd>
              </div>
            )}
            {product.shelf_life_note && (
              <div className="flex justify-between gap-3 border-b border-primary/5 py-1.5">
                <dt className="text-carbon/50">Raf Ömrü</dt>
                <dd className="font-medium text-right">{product.shelf_life_note}</dd>
              </div>
            )}
            {product.storage_info && (
              <div className="flex justify-between gap-3 border-b border-primary/5 py-1.5 sm:col-span-2">
                <dt className="text-carbon/50 shrink-0">Saklama</dt>
                <dd className="font-medium text-right">{product.storage_info}</dd>
              </div>
            )}
            {product.allergen_info && (
              <div className="flex justify-between gap-3 border-b border-accent/30 py-1.5 sm:col-span-2 text-primary-dark">
                <dt className="shrink-0">⚠️ Alerjen</dt>
                <dd className="font-semibold text-right">{product.allergen_info}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <ProductReviews
        productId={product.id}
        slug={product.slug}
        reviews={reviews}
        count={reviewCount}
        average={reviewAverage}
        context={reviewContext}
      />

      <div className="max-w-3xl mt-10">
        <HealthDisclaimer />
      </div>
    </div>
  );
}
