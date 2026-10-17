import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getProductBySlug, getRelatedProducts, getRecentSalesCount } from '@/lib/data/products';
import { getFavoritesContext } from '@/lib/data/favorites';
import { getProductReviews, getReviewContext } from '@/lib/data/reviews';
import { ProductCard } from '@/components/product/ProductCard';
import { getProductImageUrls } from '@/lib/media';
import { safeJsonLd, getPlainExcerpt } from '@/lib/format';
import { env } from '@/lib/env.mjs';
import { LEGAL } from '@/lib/legal';
import { getShippingConfig } from '@/lib/data/shipping';
import { calcShippingCents } from '@/lib/shipping';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { ProductGallery } from '@/components/product/ProductGallery';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { RichProductDescription } from '@/components/product/RichProductDescription';
import { HealthDisclaimer } from '@/components/product/HealthDisclaimer';
import { ProductReviews } from '@/components/product/ProductReviews';
import { RecentlyViewedTracker } from '@/components/product/RecentlyViewedTracker';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Ürün Bulunamadı' };

  // "Menşe / Yöre" (admin formu) doluysa başlık ve açıklamaya girer — ör. "Zile acı biber"
  // aramasında yöre adının sayfa başlığında geçmesi eşleşmeyi güçlendirir.
  const origin = product.origin?.trim() || null;
  const excerpt = product.description
    ? getPlainExcerpt(product.description)
    : `${product.name} Zile Aktar'da. Tokat Zile'deki aktarımızdan güvenli ödeme ve hızlı kargo ile kapınıza.`;

  return {
    // Ör. "Zehir Acı Pulbiber – Baharatlar | Zile Aktar"; menşe varsa
    // "Zehir Acı Pulbiber (Zile, Tokat) – Baharatlar | Zile Aktar".
    title: origin ? `${product.name} (${origin}) – ${product.categories.name}` : `${product.name} – ${product.categories.name}`,
    description: origin ? `${origin} yöresi. ${excerpt}` : excerpt,
    openGraph: { images: [{ url: `/api/og?title=${encodeURIComponent(product.name)}` }] },
    alternates: { canonical: `/urun/${product.slug}` }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const imageUrls = getProductImageUrls(product.image_path, product.image_paths ?? []);
  const [{ reviews, count: reviewCount, average: reviewAverage }, reviewContext, related, recentSalesCount, { loggedIn, favoriteIds }] =
    await Promise.all([
      getProductReviews(product.id),
      getReviewContext(product.id),
      getRelatedProducts(product.categories.slug, product.id, 4),
      getRecentSalesCount(product.id),
      getFavoritesContext()
    ]);
  const [requestHeaders, shippingConfig] = await Promise.all([headers(), getShippingConfig()]);
  const nonce = requestHeaders.get('x-nonce') ?? '';

  // Google "Satıcı girişleri" için kargo + iade bilgisi (teslimat ve iade sayfalarıyla AYNI kaynak:
  // LEGAL + admin kargo ayarları). Tek adet alındığındaki kargo ücreti (ağırlığa göre).
  const [handlingMin = 1, handlingMax = 5] = LEGAL.teslimatSuresiIsGunu.split(/[–-]/).map((n) => Number.parseInt(n.trim(), 10));
  const returnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'TR',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: LEGAL.caymaSuresiGun,
    returnMethod: 'https://schema.org/ReturnByMail',
    // Cayma (vazgeçme) iadesinde kargo alıcıya ait — bkz. /iptal-iade-kosullari.
    returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility'
  };
  const shippingFor = (priceCents: number, weightGrams: number | null) => ({
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: (
        calcShippingCents(shippingConfig, priceCents, weightGrams ?? shippingConfig.defaultItemGrams) / 100
      ).toFixed(2),
      currency: 'TRY'
    },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'TR' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: handlingMin, maxValue: handlingMax, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 4, unitCode: 'DAY' }
    }
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: getPlainExcerpt(product.description),
    // Yapısal veride görsel adresi tam (https://...) olmalı; yer tutucular "/urunler/..." ile başlar.
    image: imageUrls.map((u) => (u.startsWith('/') ? `${env.NEXT_PUBLIC_APP_URL}${u}` : u)),
    url: `${env.NEXT_PUBLIC_APP_URL}/urun/${product.slug}`,
    category: product.categories.name,
    // Ürünlerde üretici barkodu (GTIN) yok; mağazanın kendi markasıyla satılıyor (Merchant akışıyla aynı).
    brand: { '@type': 'Brand', name: LEGAL.markaAdi },
    ...(product.origin?.trim() && {
      additionalProperty: [{ '@type': 'PropertyValue', name: 'Menşe / Yöre', value: product.origin.trim() }]
    }),
    ...(reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewAverage.toFixed(1),
        reviewCount
      },
      // Yalnız GERÇEK, onaylı yorumlar (yazar adı yorumda zaten herkese açık görünen ad).
      review: reviews.slice(0, 5).map((r) => ({
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        author: { '@type': 'Person', name: r.author_name },
        datePublished: r.created_at.slice(0, 10),
        ...(r.title && { name: r.title }),
        reviewBody: r.body
      }))
    }),
    offers: product.product_variants.map((v) => ({
      '@type': 'Offer',
      price: (v.price_cents / 100).toFixed(2),
      priceCurrency: 'TRY',
      availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      sku: v.sku,
      url: `${env.NEXT_PUBLIC_APP_URL}/urun/${product.slug}`,
      seller: { '@type': 'Organization', name: LEGAL.markaAdi },
      shippingDetails: shippingFor(v.price_cents, v.weight_grams),
      hasMerchantReturnPolicy: returnPolicy
    }))
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Breadcrumbs
        items={[
          { name: 'Anasayfa', href: '/' },
          { name: product.categories.name, href: `/kategori/${product.categories.slug}` },
          { name: product.name }
        ]}
      />

      <RecentlyViewedTracker slug={product.slug} />

      <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
        <ProductGallery images={imageUrls} alt={product.name} />
        <ProductDetailClient
          product={product}
          recentSalesCount={recentSalesCount}
          isFavorited={favoriteIds.has(product.id)}
          loggedIn={loggedIn}
        />
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

      {related.length > 0 && (
        <section className="mt-14 pt-10 border-t border-primary/10">
          <h2 className="font-display font-bold text-primary text-xl mb-5">Benzer Ürünler</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} isFavorited={favoriteIds.has(p.id)} loggedIn={loggedIn} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeSlug={product.slug} />
    </div>
  );
}
