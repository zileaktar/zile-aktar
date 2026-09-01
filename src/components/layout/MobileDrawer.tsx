'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/store/ui-store';
import { SiteLogo } from '@/components/layout/SiteLogo';

interface Category {
  slug: string;
  name: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  yoresel: '🍯',
  baharat: '🌶️',
  macun: '🌱',
  yag: '💧',
  cay: '🍵'
};

export function MobileDrawer({ categories, logoPath }: { categories: Category[]; logoPath: string | null }) {
  const { isMobileDrawerOpen, closeMobileDrawer } = useUiStore();
  const router = useRouter();

  function goTo(slug: string) {
    closeMobileDrawer();
    router.push(slug === 'all' ? '/' : `/?kategori=${slug}`);
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${
          isMobileDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileDrawer}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-[82%] max-w-xs bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <SiteLogo logoPath={logoPath} size={36} />
            <span className="font-display font-bold text-primary">Zile Aktar</span>
          </div>
          <button onClick={closeMobileDrawer} className="touch-target flex items-center justify-center rounded-full hover:bg-primary/10" aria-label="Kapat">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b4332" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <button onClick={() => goTo('all')} className="w-full text-left px-4 py-3.5 rounded-xl font-semibold text-primary hover:bg-cream flex items-center gap-3">
            🏠 Tüm Ürünler
          </button>
          {categories.map((cat) => (
            <button key={cat.slug} onClick={() => goTo(cat.slug)} className="w-full text-left px-4 py-3.5 rounded-xl font-semibold text-primary hover:bg-cream flex items-center gap-3">
              {CATEGORY_ICONS[cat.slug] ?? '🌿'} {cat.name}
            </button>
          ))}
          <div className="border-t border-primary/10 my-3" />
          <Link href="/hesabim" onClick={closeMobileDrawer} className="w-full text-left px-4 py-3.5 rounded-xl font-semibold text-primary hover:bg-cream flex items-center gap-3">
            👤 Hesabım
          </Link>
          <Link href="/hesabim/siparislerim" onClick={closeMobileDrawer} className="w-full text-left px-4 py-3.5 rounded-xl font-semibold text-primary hover:bg-cream flex items-center gap-3">
            📦 Siparişlerim
          </Link>
        </nav>
        <div className="p-4 border-t border-primary/10 text-center text-xs text-carbon/50">© 2026 Zile Aktar</div>
      </aside>
    </>
  );
}
