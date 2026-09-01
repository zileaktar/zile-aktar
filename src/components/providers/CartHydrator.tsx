'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart-store';

/**
 * cart-store.ts, `skipHydration: true` ile localStorage'ı OTOMATİK okumuyor
 * (bkz. o dosyadaki açıklama — hydration hatasını önlemek için). Bu bileşen,
 * sayfa TARAYICIDA mount olduktan SONRA (yani sunucuyla karşılaştırılan ilk
 * render bittikten sonra) gerçek sepeti localStorage'dan yükler. Görünür bir
 * arayüzü yoktur, tek işi bu tetikleyiciyi çalıştırmaktır.
 */
export function CartHydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}
