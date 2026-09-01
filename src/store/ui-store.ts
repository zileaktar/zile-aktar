'use client';

import { create } from 'zustand';

interface UiState {
  isCartOpen: boolean;
  isMobileDrawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
}

/** Sepet paneli / mobil menü açık-kapalı durumu — bileşenler arası paylaşılan UI state. */
export const useUiStore = create<UiState>((set) => ({
  isCartOpen: false,
  isMobileDrawerOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  openMobileDrawer: () => set({ isMobileDrawerOpen: true }),
  closeMobileDrawer: () => set({ isMobileDrawerOpen: false })
}));
