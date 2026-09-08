'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/**
 * Ürün detay sayfası görsel galerisi. Tek görselde sade bir kare gösterir;
 * birden fazla görselde müşteri sağa/sola KAYDIRARAK (dokunmatik) veya
 * ok/nokta/küçük görsel ile gezer. Kaydırma yerel `scroll-snap` ile yapılır —
 * ekstra kütüphane yok, mobilde native dokunmatik hızında çalışır.
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(count - 1, i));
    track.scrollTo({ left: track.clientWidth * clamped, behavior: 'smooth' });
  }, [count]);

  // Kaydırma sırasında aktif görsel indeksini takip et.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setIndex(Math.round(track.scrollLeft / track.clientWidth));
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
        <Image src={images[0]!} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
      </div>
    );
  }

  return (
    <div>
      <div className="relative group">
        <div
          ref={trackRef}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl bg-white shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <div key={src} className="relative aspect-square w-full shrink-0 snap-center">
              <Image
                src={src}
                alt={`${alt} — görsel ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Oklar — dokunmatik olmayan cihazlarda faydalı, mobilde kaydırma yeterli */}
        <button
          type="button"
          aria-label="Önceki görsel"
          onClick={() => scrollTo(index - 1)}
          disabled={index === 0}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/90 shadow-md text-primary disabled:opacity-0 transition hover:bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Sonraki görsel"
          onClick={() => scrollTo(index + 1)}
          disabled={index === count - 1}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/90 shadow-md text-primary disabled:opacity-0 transition hover:bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Noktalar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`${i + 1}. görsele git`}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-primary' : 'w-1.5 bg-primary/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Küçük görsel şeridi */}
      <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`${i + 1}. görseli göster`}
            className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
              i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Image src={src} alt="" fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
