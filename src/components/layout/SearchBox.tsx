'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProductImageUrl } from '@/lib/media';
import { formatPriceFromCents } from '@/lib/format';
import type { QuickSearchItem } from '@/lib/data/products';

interface SearchBoxProps {
  /** Dış sarmalayıcı (konumlandırma/genişlik) sınıfları. */
  wrapperClassName?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const INPUT_CLASS =
  'w-full bg-white border border-primary/15 rounded-full py-2.5 pl-10 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60 transition';

export function SearchBox({ wrapperClassName = '', placeholder = 'Ürün ara... (örn. bal, çörek otu)', autoFocus = false }: SearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const [items, setItems] = useState<QuickSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const wrapperRef = useRef<HTMLFormElement>(null);

  // Debounce'lu öneri sorgusu.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = (await res.json()) as { items: QuickSearchItem[] };
        setItems(data.items ?? []);
        setSearched(true);
        setOpen(true);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setItems([]);
          setSearched(true);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value]);

  // Dışarı tıklama + Esc ile kapat.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function submitFullSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = value.trim();
    if (!q) return;
    const params = new URLSearchParams();
    const kategori = searchParams.get('kategori');
    if (kategori) params.set('kategori', kategori);
    params.set('q', q);
    setOpen(false);
    router.push(`/?${params.toString()}#urunler`);
  }

  const showDropdown = open && value.trim().length >= 2;

  return (
    <form ref={wrapperRef} onSubmit={submitFullSearch} className={`relative ${wrapperClassName}`} role="search">
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => value.trim().length >= 2 && setOpen(true)}
        placeholder={placeholder}
        className={INPUT_CLASS}
        aria-label="Ürün ara"
        autoComplete="off"
      />
      <svg className="absolute left-3.5 top-[21px] -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b4332" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      {loading && (
        <svg className="absolute right-3 top-[21px] -translate-y-1/2 animate-spin text-primary/50" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {!loading && value.trim().length > 0 && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            setOpen(false);
          }}
          className="absolute right-2.5 top-[21px] -translate-y-1/2 text-carbon/40 hover:text-carbon/70"
          aria-label="Temizle"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-primary/10 overflow-hidden">
          {items.length > 0 ? (
            <ul className="max-h-[min(70vh,420px)] overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.slug}>
                  <a
                    href={`/urun/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImageUrl(item.imagePath)}
                      alt=""
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-lg object-cover bg-cream shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-carbon truncate">{item.name}</span>
                      <span className="block text-[11px] text-accent-dark uppercase tracking-wide">{item.categoryName}</span>
                    </span>
                    <span className="text-sm font-semibold text-primary shrink-0">{formatPriceFromCents(item.minPriceCents)}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            searched && !loading && (
              <div className="px-4 py-6 text-center">
                <div className="text-2xl mb-1">🔍</div>
                <p className="text-sm text-carbon/60">Eşleşen ürün bulunamadı</p>
              </div>
            )
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => submitFullSearch()}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-primary border-t border-primary/10 hover:bg-cream transition"
            >
              &ldquo;{value.trim()}&rdquo; için tüm sonuçları gör →
            </button>
          )}
        </div>
      )}
    </form>
  );
}
