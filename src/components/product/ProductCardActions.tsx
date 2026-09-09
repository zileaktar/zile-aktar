'use client';

import { useState } from 'react';
import { getProductImageUrl } from '@/lib/media';
import { formatPriceFromCents } from '@/lib/format';
import { dealFromRow } from '@/lib/pricing';
import { trackAddToCart } from '@/lib/analytics';
import { useCartStore } from '@/store/cart-store';
import type { ProductWithVariants } from '@/lib/data/products';

/**
 * Ürün kartının etkileşimli alt bloğu (client island): varyant (gramaj) seçimi,
 * seçili varyanta göre CANLI güncellenen fiyat ve "Sepete Ekle" butonu.
 * Kartın geri kalanı (görsel, rozetler, ad) sunucuda render edilir.
 */
export function ProductCardActions({ product }: { product: ProductWithVariants }) {
  const variants = product.product_variants;
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? '');
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);

  if (!selectedVariant) return null;

  const outOfStock = selectedVariant.stock <= 0;
  const compareAt = selectedVariant.compare_at_price_cents;
  const hasDiscount = compareAt != null && compareAt > selectedVariant.price_cents;
  const deal = dealFromRow(product);

  function handleAdd() {
    if (!selectedVariant || outOfStock) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantLabel: selectedVariant.label,
      priceCents: selectedVariant.price_cents,
      compareAtCents: selectedVariant.compare_at_price_cents,
      imageUrl: getProductImageUrl(product.image_path),
      deal
    });
    trackAddToCart({ name: product.name, priceTl: selectedVariant.price_cents / 100, quantity: 1 });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <>
      {variants.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {variants.map((v) => {
            const soldOut = v.stock <= 0;
            const active = v.id === selectedVariant.id;
            return (
              <button
                key={v.id}
                type="button"
                disabled={soldOut}
                onClick={() => setSelectedVariantId(v.id)}
                className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : soldOut
                      ? 'bg-cream text-carbon/30 border-primary/10 line-through cursor-not-allowed'
                      : 'bg-white text-carbon/70 border-primary/20 hover:border-primary/40'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-col leading-tight">
          {hasDiscount && (
            <span className="text-[11px] text-carbon/40 line-through">{formatPriceFromCents(compareAt)}</span>
          )}
          <span className={`font-display font-bold text-base sm:text-lg ${hasDiscount ? 'text-red-600' : 'text-primary'}`}>
            {formatPriceFromCents(selectedVariant.price_cents)}
          </span>
        </span>
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`touch-target rounded-full w-10 h-10 flex items-center justify-center shrink-0 transition active:scale-90 ${
            outOfStock ? 'bg-carbon/20 cursor-not-allowed' : justAdded ? 'bg-accent' : 'bg-primary hover:bg-primary-dark'
          } text-white`}
          aria-label={`${product.name} — Sepete Ekle`}
        >
          {justAdded ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
