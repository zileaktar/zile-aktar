import Link from 'next/link';
import { env } from '@/lib/env.mjs';
import { safeJsonLd } from '@/lib/format';

export interface Crumb {
  name: string;
  /** Bağlantı yolu ("/..."); son kırıntıda genelde verilmez (mevcut sayfa). */
  href?: string;
}

/**
 * Ekmek kırıntısı (breadcrumb) navigasyonu + Schema.org `BreadcrumbList`
 * yapısal verisi. Sunucu bileşeni — ürün ve kategori/arama sayfalarında kullanılır.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${env.NEXT_PUBLIC_APP_URL}${c.href}` } : {})
    }))
  };

  return (
    <nav aria-label="Ekmek kırıntısı" className="text-xs sm:text-sm text-carbon/50 mb-4 sm:mb-6">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${c.name}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-carbon/30" aria-hidden="true">/</span>}
              {c.href && !isLast ? (
                <Link href={c.href} className="hover:text-primary hover:underline">
                  {c.name}
                </Link>
              ) : (
                <span className={isLast ? 'text-carbon/70 font-medium' : undefined} aria-current={isLast ? 'page' : undefined}>
                  {c.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
