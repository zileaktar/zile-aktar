'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  /** Ekleme anındaki fiyat (kuruş) — yalnızca UI önizlemesi içindir. */
  priceCents: number;
  imageUrl: string;
  quantity: number;
  /** "X alana Y" kampanyası (migration 0019) — yalnızca sepet/ödeme önizlemesi için.
   *  Gerçek indirim create_order'da DB'den yeniden hesaplanır. */
  deal?: { buyQty: number; getQty: number; getPercent: number } | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  totalCount: () => number;
  subtotalCents: () => number;
}

/**
 * Sepet durumu yalnızca istemcide (localStorage) tutulur — bu, önemli bir
 * güvenlik/mimari kararıdır: burada görülen fiyat/toplam yalnızca ÖNİZLEMEDİR.
 * Gerçek fiyat, stok ve toplam, /api/checkout çağrıldığında sunucuda
 * veritabanından yeniden hesaplanır ve doğrulanır (bkz. src/app/api/checkout/route.ts).
 * İstemci hiçbir zaman "güvenilir" fiyat kaynağı değildir.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: i.quantity + quantity } : i
              )
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
        }));
      },

      removeItem: (variantId) => {
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) }));
      },

      clear: () => set({ items: [] }),

      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalCents: () => get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)
    }),

    {
      name: 'kokten-aktar-cart-v1',
      // `skipHydration: true` + src/components/providers/CartHydrator.tsx:
      // persist middleware'i varsayılan ayarla, tarayıcıda store OLUŞTURULUR
      // OLUŞTURULMAZ localStorage'ı EŞ ZAMANLI okur — bu da sunucunun her zaman
      // boş render ettiği sepetle, React'in hydration için karşılaştırdığı
      // İLK istemci render'ının (zaten dolu sepetle) uyuşmamasına, yani
      // "Hydration failed" hatasına yol açar. skipHydration bunu ERTELER;
      // gerçek localStorage okuması yalnızca mount sonrası bir useEffect
      // içinde (CartHydrator) tetiklenir, böylece ilk render her zaman
      // sunucuyla birebir eşleşir.
      skipHydration: true
    }
  )
);

/**
 * Hydration güvenli sepet öğe adedi. `skipHydration` sepet verisini mount SONRASI
 * yüklediğinden, sunucu ve ilk istemci render'ı 0 görür; bu hook da o ilk render'da
 * 0 döndürür (böylece sepet rozeti gibi koşullu <span>'ler sunucu HTML'iyle
 * birebir eşleşir), gerçek adede yalnızca mount'tan sonra geçer.
 */
export function useCartCount(): number {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = useCartStore((s) => s.totalCount());
  return mounted ? count : 0;
}
