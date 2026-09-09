'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

/**
 * /admin/urunler liste filtre çubuğu. Tüm filtre durumu URL arama parametrelerinde
 * tutulur (sayfa `force-dynamic` server component olduğundan her değişiklikte
 * sunucu yeniden sorgular). Arama kutusu 300ms debounce'lu.
 */
export function ProductListFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Arama kutusu: yazma bitince (debounce) URL'i güncelle.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if ((searchParams.get('q') ?? '') !== q.trim()) apply({ q: q.trim() });
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const kategori = searchParams.get('kategori') ?? '';
  const durum = searchParams.get('durum') ?? '';
  const stok = searchParams.get('stok') ?? '';
  const sirala = searchParams.get('sirala') ?? '';
  const hasActiveFilter = Boolean(q || kategori || durum || stok || sirala);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ürün adı ara..."
          className="flex-1 bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm"
        />
        <select
          value={kategori}
          onChange={(e) => apply({ kategori: e.target.value })}
          className="bg-cream border border-primary/15 rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={durum}
          onChange={(e) => apply({ durum: e.target.value })}
          className="bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Aktif + Pasif</option>
          <option value="aktif">Sadece aktif</option>
          <option value="pasif">Sadece pasif</option>
        </select>

        <select
          value={stok}
          onChange={(e) => apply({ stok: e.target.value })}
          className="bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Tüm stok durumları</option>
          <option value="var">Stokta var</option>
          <option value="azalan">Azalan stok (&lt;10)</option>
          <option value="yok">Tükendi (0)</option>
        </select>

        <select
          value={sirala}
          onChange={(e) => apply({ sirala: e.target.value })}
          className="bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">En yeni</option>
          <option value="isim">İsme göre (A-Z)</option>
          <option value="stok-az">Stok (azdan çoğa)</option>
        </select>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              router.replace(pathname, { scroll: false });
            }}
            className="text-sm font-semibold text-red-500 hover:underline px-2"
          >
            Filtreleri temizle
          </button>
        )}
      </div>
    </div>
  );
}
