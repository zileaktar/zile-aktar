'use client';

import { useEffect } from 'react';
import { addRecentlyViewed } from '@/lib/recently-viewed';

/** Görünmez — ürün detay sayfası mount olunca bu ürünü "son gezilenler"e ekler. */
export function RecentlyViewedTracker({ slug }: { slug: string }) {
  useEffect(() => {
    addRecentlyViewed(slug);
  }, [slug]);

  return null;
}
