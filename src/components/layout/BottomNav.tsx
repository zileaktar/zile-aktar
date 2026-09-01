'use client';

import Link from 'next/link';
import { useUiStore } from '@/store/ui-store';
import { useCartCount } from '@/store/cart-store';

export function BottomNav() {
  const { openCart, openMobileDrawer } = useUiStore();
  const totalCount = useCartCount();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-primary/10 pb-safe">
      <div className="grid grid-cols-4">
        <Link href="/" className="flex flex-col items-center justify-center py-2.5 gap-1 text-[11px] font-semibold text-carbon/50 touch-target">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Anasayfa
        </Link>
        <button onClick={openMobileDrawer} className="flex flex-col items-center justify-center py-2.5 gap-1 text-[11px] font-semibold text-carbon/50 touch-target">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Kategoriler
        </button>
        <button onClick={openCart} className="relative flex flex-col items-center justify-center py-2.5 gap-1 text-[11px] font-semibold text-carbon/50 touch-target">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Sepet
          {totalCount > 0 && (
            <span className="absolute top-0.5 right-6 bg-accent text-primary-dark text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </button>
        <Link href="/hesabim" className="flex flex-col items-center justify-center py-2.5 gap-1 text-[11px] font-semibold text-carbon/50 touch-target">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Hesabım
        </Link>
      </div>
    </nav>
  );
}
