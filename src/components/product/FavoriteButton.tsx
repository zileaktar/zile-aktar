'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toggleFavoriteAction } from '@/app/hesabim/favoriler/actions';

/**
 * Kalp ikonu — ürün kartlarının üstünde ve ürün detay sayfasında. Giriş
 * yapmamış kullanıcı tıklarsa geri dönüş adresiyle giriş sayfasına yönlenir
 * (favoriler yalnızca DB'de tutulur, misafir/localStorage desteği yok —
 * cihazlar arası senkron olsun diye kasıtlı).
 */
export function FavoriteButton({
  productId,
  initialFavorited,
  loggedIn,
  className = ''
}: {
  productId: string;
  initialFavorited: boolean;
  loggedIn: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    if (!loggedIn) {
      router.push(`/giris?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    const next = !favorited;
    setFavorited(next); // iyimser güncelleme
    startTransition(async () => {
      const res = await toggleFavoriteAction(productId);
      if (res.error) setFavorited(!next); // başarısızsa geri al
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      aria-pressed={favorited}
      className={`touch-target flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition active:scale-90 ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={favorited ? '#dc2626' : 'none'}
        stroke={favorited ? '#dc2626' : '#1b4332'}
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
