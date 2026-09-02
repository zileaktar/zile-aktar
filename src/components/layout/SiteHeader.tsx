'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useCartCount } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { SiteLogo } from '@/components/layout/SiteLogo';
import { SearchBox } from '@/components/layout/SearchBox';

interface Category {
  id: string;
  slug: string;
  name: string;
}

export function SiteHeader({ categories, logoPath }: { categories: Category[]; logoPath: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const activeCategory = searchParams.get('kategori') ?? 'all';
  const activeCategoryObj = categories.find((c) => c.slug === activeCategory);
  const totalCount = useCartCount();
  const { openCart, openMobileDrawer } = useUiStore();

  function goToCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') params.delete('kategori');
    else params.set('kategori', slug);
    startTransition(() => router.push(`/?${params.toString()}`));
    setIsCategoryMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-primary/10 pt-safe">
      <div className="bg-primary-dark text-cream text-xs sm:text-sm py-2 text-center px-4">
        🌿 150₺ ve üzeri alışverişlerde <span className="font-semibold text-accent-light">kargo bedava</span>!
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          <button
            onClick={openMobileDrawer}
            className="lg:hidden touch-target flex items-center justify-center rounded-full hover:bg-primary/10 -ml-2"
            aria-label="Menüyü Aç"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1b4332" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <SiteLogo logoPath={logoPath} size={44} />
            <div className="leading-none">
              <div className="font-display font-bold text-lg sm:text-xl text-primary">
                Zile <span className="text-accent-dark">Aktar</span>
              </div>
              <div className="hidden sm:block text-[11px] tracking-wide text-primary/60 font-medium">Doğadan Gelen Şifa</div>
            </div>
          </Link>

          {/* MASAÜSTÜ KATEGORİ MENÜSÜ — 10 kategori düz bir sırada sığmadığı ve
              uzun isimler (ör. "Tütsüler, Doğal Taşlar ve Reçineler") satırı
              taşırdığı için "Tümü" hızlı erişimi + tek bir "Kategoriler"
              açılır panel butonuna indirgendi. Panel, tüm kategorileri 2
              sütunlu düzenli bir ızgarada gösterir. */}
          <nav className="hidden lg:flex items-center gap-1 mx-auto relative" aria-label="Kategoriler">
            <button
              onClick={() => goToCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeCategory === 'all' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'
              }`}
            >
              Tümü
            </button>

            <button
              onClick={() => setIsCategoryMenuOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeCategory !== 'all' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'
              }`}
              aria-expanded={isCategoryMenuOpen}
            >
              {activeCategoryObj ? activeCategoryObj.name : 'Kategoriler'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isCategoryMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCategoryMenuOpen(false)} />
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl border border-primary/10 p-3 grid grid-cols-2 gap-1 w-[520px]">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => goToCategory(cat.slug)}
                      className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                        activeCategory === cat.slug ? 'bg-primary text-white' : 'text-carbon hover:bg-cream'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <SearchBox wrapperClassName="hidden md:block w-56 xl:w-72" />

            <button onClick={() => setMobileSearchOpen((v) => !v)} className="md:hidden touch-target flex items-center justify-center rounded-full hover:bg-primary/10" aria-label="Ara">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b4332" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <Link href="/hesabim" className="hidden sm:flex touch-target items-center justify-center rounded-full hover:bg-primary/10" aria-label="Hesabım">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b4332" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <button onClick={openCart} className="relative touch-target flex items-center justify-center rounded-full hover:bg-primary/10" aria-label="Sepetim">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#1b4332" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-primary-dark text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden pb-3">
            <SearchBox wrapperClassName="block" placeholder="Ürün ara..." autoFocus />
          </div>
        )}

        {/* MOBİL KATEGORİ SATIRI — 10 kategoriyi yatay kaydırmalı tek satırda
            göstermek (uzun isimlerle) hem dağınık görünüyordu hem de her
            kategoriyi görmek için uzun bir kaydırma gerektiriyordu. Bunun
            yerine yalnızca "Tümü" + aktif kategoriyi gösteren tek bir
            "Kategoriler" butonu var; tam liste zaten MobileDrawer'da (hamburger
            menü / alt navigasyondaki "Kategoriler") düzenli, dikey bir liste
            olarak duruyor — burada tekrar etmeye gerek yok. */}
        <div className="lg:hidden flex gap-2 pb-3">
          <button
            onClick={() => goToCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeCategory === 'all' ? 'bg-primary text-white' : 'bg-white border border-primary/15 text-primary'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={openMobileDrawer}
            className={`flex items-center gap-1.5 flex-1 min-w-0 px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeCategory !== 'all' ? 'bg-primary text-white' : 'bg-white border border-primary/15 text-primary'
            }`}
          >
            <span className="truncate">{activeCategoryObj ? activeCategoryObj.name : 'Kategoriler'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0 ml-auto">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      {isPending && <div className="h-0.5 bg-accent animate-pulse" />}
    </header>
  );
}
