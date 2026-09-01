'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart-store';

/**
 * Sipariş başarı sayfasında (/siparis-alindi) mount olunca sepeti temizler.
 * Sepet, ödeme sayfasına geçerken DEĞİL, ödeme gerçekten onaylanınca boşalır —
 * böylece kullanıcı iyzico'da vazgeçerse sepeti kaybolmaz.
 */
export function ClearCartOnSuccess() {
  const clear = useCartStore((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
