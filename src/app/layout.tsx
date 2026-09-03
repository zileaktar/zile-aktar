import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter, Poppins } from 'next/font/google';
import { env } from '@/lib/env.mjs';
import { Providers } from '@/app/providers';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CookieConsent } from '@/components/consent/CookieConsent';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { Analytics } from '@/components/analytics/Analytics';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { BottomNav } from '@/components/layout/BottomNav';
import { getCategories } from '@/lib/data/products';
import { getSiteSettings } from '@/lib/data/settings';
import { getProductImageUrl } from '@/lib/media';
import { safeJsonLd } from '@/lib/format';
import { LEGAL } from '@/lib/legal';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-poppins', display: 'swap' });

/**
 * Favicon: admin panelinden bir site logosu yüklenmişse onu kullanır (tarayıcı
 * sekmesi + iOS ana ekran). Yoksa `src/app/icon.svg` / `apple-icon.svg` dosya
 * kuralı devreye girer. NOT: en iyi görünüm için logo KARE olmalı — yatay/geniş
 * logo küçük ikonda sıkışık görünür.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { logoPath } = await getSiteSettings();
  const logoUrl = logoPath ? getProductImageUrl(logoPath) : null;

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    title: { default: 'Zile Aktar | Doğadan Gelen Şifa & Yöresel Lezzetler', template: '%s | Zile Aktar' },
    description:
      'Hakiki bal, soğuk sıkım yağlar, taze baharatlar ve şifalı bitki çayları. %100 doğal ve yöresel ürünler, güvenli 3D ödeme ile kapınızda.',
    keywords: ['aktar', 'yöresel ürünler', 'organik bal', 'şifalı bitkiler', 'soğuk sıkım yağ', 'bitki çayı'],
    ...(logoUrl ? { icons: { icon: logoUrl, shortcut: logoUrl, apple: logoUrl } } : {}),
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      siteName: 'Zile Aktar',
      title: 'Zile Aktar | Doğadan Gelen Şifa & Yöresel Lezzetler',
      description: 'Hakiki bal, soğuk sıkım yağlar ve şifalı bitkiler — doğrudan üreticiden sofranıza.',
      images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Zile Aktar' }]
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
    alternates: { canonical: '/' }
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1b4332'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, { logoPath }] = await Promise.all([getCategories(), getSiteSettings()]);

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: LEGAL.markaAdi,
    url: env.NEXT_PUBLIC_APP_URL,
    telephone: '+90 551 173 00 94',
    email: LEGAL.eposta,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Dutlupınar Mah., Cumhuriyet Cd., Kültür Sitesi D:26/G',
      addressLocality: 'Zile',
      addressRegion: 'Tokat',
      postalCode: '60400',
      addressCountry: 'TR'
    },
    priceRange: '₺₺',
    currenciesAccepted: 'TRY',
    paymentAccepted: 'Kredi Kartı, Banka Kartı, Havale/EFT'
  };

  return (
    <html lang="tr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-cream text-carbon font-sans antialiased pb-16 lg:pb-0">
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }} />
        <Providers>
          {/* SiteHeader içinde useSearchParams() kullanılıyor (kategori/arama filtreleme
              için); Next.js, bu API'yi kullanan istemci bileşenlerinin bir Suspense
              sınırı içinde olmasını zorunlu kılar — aksi halde statik sayfa üretimi
              (build sırasında prerender) "missing-suspense-with-csr-bailout" hatasıyla
              başarısız olur. Fallback, header'ın yaklaşık yüksekliğinde boş bir alan
              olduğundan gerçek kullanıcıda fark edilmeyecek kadar kısa sürer. */}
          <Suspense fallback={<div className="h-[104px] sm:h-[132px] bg-cream" />}>
            <SiteHeader categories={categories} logoPath={logoPath} />
          </Suspense>
          <main>{children}</main>
          <SiteFooter categories={categories} logoPath={logoPath} />
          <CartDrawer />
          <MobileDrawer categories={categories} logoPath={logoPath} />
          <BottomNav />
          <WhatsAppButton />
          <CookieConsent />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
