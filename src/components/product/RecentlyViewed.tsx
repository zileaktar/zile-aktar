'use client';

import { useEffect, useState } from 'react';
import { getRecentlyViewedSlugs } from '@/lib/recently-viewed';
import { getProductImageUrl } from '@/lib/media';
import { formatPriceFromCents } from '@/lib/format';
import type { RecentlyViewedItem } from '@/lib/data/products';

/**
 * "Son Gezdikleriniz" şeridi — istemci bileşeni (localStorage okur), bu yüzden
 * `ProductCard` (server component) kullanılamaz; CartDrawer'daki öneri
 * şeridiyle aynı desende kendi kompakt kartını çizer.
 */
export function RecentlyViewed({ excludeSlug }: { excludeSlug: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const slugs = getRecentlyViewedSlugs().filter((s) => s !== excludeSlug);
    if (slugs.length === 0) return;

    const controller = new AbortController();
    fetch(`/api/recently-viewed?slugs=${encodeURIComponent(slugs.join(','))}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { items: RecentlyViewedItem[] }) => setItems(d.items ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-primary/10">
      <h2 className="font-display font-bold text-primary text-xl mb-5">Son Gezdikleriniz</h2>
      <div className="flex gap-3 overflow-x-auto overscroll-x-contain pb-2 snap-x [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full">
        {items.map((item) => {
          const hasDiscount = item.compareAtCents != null && item.compareAtCents > item.priceCents;
          return (
            <a
              key={item.slug}
              href={`/urun/${item.slug}`}
              className="shrink-0 w-32 snap-start bg-white rounded-xl p-2 shadow-sm hover:shadow-md transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- next/image, harici URL için domain izni gerektirir; bu küçük istemci şeridi için basit <img> yeterli */}
              <img
                src={getProductImageUrl(item.imagePath)}
                alt={item.name}
                width={112}
                height={112}
                loading="lazy"
                className="w-full aspect-square rounded-lg object-cover bg-cream mb-1.5"
              />
              <span className="block text-[11px] font-medium leading-tight line-clamp-2 min-h-[26px]">{item.name}</span>
              <span className="flex items-baseline gap-1 mt-1">
                {hasDiscount && (
                  <span className="text-[10px] text-carbon/40 line-through">{formatPriceFromCents(item.compareAtCents!)}</span>
                )}
                <span className={`text-xs font-bold ${hasDiscount ? 'text-red-600' : 'text-primary'}`}>
                  {formatPriceFromCents(item.priceCents)}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
