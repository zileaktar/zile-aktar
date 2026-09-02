'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getProductImageUrl } from '@/lib/media';
import type { CampaignBannerRow } from '@/lib/supabase/types';

/**
 * Anasayfanın en üstündeki kampanya/duyuru afişi carousel'i (hero'nun yerine geçer).
 * Yatay kaydırma + snap ile dokunmatik "sağa-sola kaydır" desteği native gelir;
 * ok butonları ve noktalar ek kontrol sağlar, 6 sn'de bir otomatik ilerler
 * (fare üzerindeyken durur). Tek afiş varsa ok/nokta/otomatik ilerleme gösterilmez.
 */
export function CampaignCarousel({ banners }: { banners: CampaignBannerRow[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [active, setActive] = useState(0);
  const multiple = banners.length > 1;

  const goTo = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const target = ((index % banners.length) + banners.length) % banners.length;
      el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
    },
    [banners.length]
  );

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  useEffect(() => {
    if (!multiple) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const el = scrollerRef.current;
      if (!el) return;
      const next = Math.round(el.scrollLeft / el.clientWidth) + 1;
      goTo(next);
    }, 6000);
    return () => clearInterval(id);
  }, [multiple, goTo]);

  return (
    <section
      className="relative bg-primary-dark"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      aria-roledescription="carousel"
      aria-label="Kampanyalar"
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {banners.map((b) => {
          const hasText = b.title || b.subtitle || b.cta_label;
          return (
            <a
              key={b.id}
              href={b.link_url || '/#urunler'}
              className="group relative block shrink-0 w-full snap-center aspect-[16/9] sm:aspect-[21/9] max-h-[560px] overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductImageUrl(b.image_path)}
                alt={b.title ?? 'Kampanya'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {hasText && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/85 via-primary-dark/45 to-transparent" />
                  <div className="relative h-full max-w-7xl mx-auto px-5 sm:px-8 flex items-center">
                    <div className="max-w-md text-white">
                      {b.title && (
                        <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight mb-2 sm:mb-3">
                          {b.title}
                        </h2>
                      )}
                      {b.subtitle && <p className="text-cream/85 text-sm sm:text-lg mb-4 sm:mb-6">{b.subtitle}</p>}
                      {b.cta_label && (
                        <span className="inline-flex items-center gap-2 bg-accent group-hover:bg-accent-dark text-primary-dark font-bold px-6 py-3 rounded-full transition shadow-lg text-sm sm:text-base">
                          {b.cta_label}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </a>
          );
        })}
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            aria-label="Önceki afiş"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/85 hover:bg-white text-primary-dark shadow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            aria-label="Sonraki afiş"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/85 hover:bg-white text-primary-dark shadow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}. afişe git`}
                className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
