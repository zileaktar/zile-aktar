'use client';

import { useState } from 'react';
import { formatPriceFromCents } from '@/lib/format';
import { getProductImageUrl } from '@/lib/media';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import type { ProductWithVariants } from '@/lib/data/products';

const BADGE_STYLES: Record<string, string> = {
  '100% Doğal': 'bg-primary text-white',
  'Soğuk Sıkım': 'bg-blue-600 text-white',
  Yöresel: 'bg-accent text-primary-dark',
  'Sınırlı Stok': 'bg-red-500 text-white',
  Geleneksel: 'bg-primary-dark text-cream'
};

export function ProductDetailClient({ product }: { product: ProductWithVariants }) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.product_variants[0]?.id ?? '');
  const selectedVariant = product.product_variants.find((v) => v.id === selectedVariantId) ?? product.product_variants[0];
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUiStore((s) => s.openCart);

  if (!selectedVariant) return null;
  const outOfStock = selectedVariant.stock <= 0;
  const isLowStock = selectedVariant.stock > 0 && selectedVariant.stock < 10;
  // bkz. ProductCard.tsx — "Sınırlı Stok" artık canlı stok sayısından
  // hesaplanır, sabit/elle atanan etiket olarak saklanmaz.
  const displayBadges = product.badges.filter((b) => b !== 'Sınırlı Stok');

  function handleAdd() {
    if (!selectedVariant || outOfStock) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantLabel: selectedVariant.label,
      priceCents: selectedVariant.price_cents,
      imageUrl: getProductImageUrl(product.image_path)
    });
    openCart();
  }

  return (
    <div className="flex flex-col">
      <div className="flex gap-1.5 mb-3">
        {displayBadges.map((b) => (
          <span key={b} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${BADGE_STYLES[b] ?? 'bg-carbon text-white'}`}>
            {b}
          </span>
        ))}
        {isLowStock && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">Sınırlı Stok</span>}
      </div>
      <div className="text-xs font-semibold text-accent-dark uppercase tracking-wide mb-1">{product.categories.name}</div>
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-6">{product.name}</h1>

      <div className={`text-xs font-medium mb-5 ${selectedVariant.stock < 10 ? 'text-red-500' : 'text-primary'}`}>
        {selectedVariant.stock <= 0
          ? '❌ Stokta yok'
          : selectedVariant.stock < 10
            ? `⚠️ Son ${selectedVariant.stock} adet!`
            : `✅ Stokta var (${selectedVariant.stock} adet)`}
      </div>

      <label className="text-xs font-semibold text-carbon/60 mb-1.5">Gramaj / Boyut Seçin</label>
      <select
        value={selectedVariantId}
        onChange={(e) => setSelectedVariantId(e.target.value)}
        className="bg-cream border border-primary/15 rounded-xl px-4 py-3 text-sm font-medium mb-5 focus:outline-none focus:ring-2 focus:ring-accent/50"
      >
        {product.product_variants.map((v) => (
          <option key={v.id} value={v.id} disabled={v.stock <= 0}>
            {v.label} — {formatPriceFromCents(v.price_cents)} {v.stock <= 0 ? '(Tükendi)' : ''}
          </option>
        ))}
      </select>

      {(selectedVariant.expiry_date || selectedVariant.lot_no) && (
        <p className="text-[11px] text-carbon/50 -mt-3 mb-5">
          {selectedVariant.expiry_date && <>Son tüketim tarihi: {new Date(selectedVariant.expiry_date).toLocaleDateString('tr-TR')}</>}
          {selectedVariant.expiry_date && selectedVariant.lot_no && ' · '}
          {selectedVariant.lot_no && <>Parti no: {selectedVariant.lot_no}</>}
        </p>
      )}

      <div className="flex items-center gap-3 mt-auto mb-4">
        <span className="font-display font-bold text-2xl text-primary">{formatPriceFromCents(selectedVariant.price_cents)}</span>
      </div>

      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className={`touch-target w-full font-bold py-3.5 rounded-full transition flex items-center justify-center gap-2 ${
          outOfStock ? 'bg-carbon/20 text-carbon/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark text-white'
        }`}
      >
        🛒 {outOfStock ? 'Stokta Yok' : 'Sepete Ekle'}
      </button>
    </div>
  );
}
