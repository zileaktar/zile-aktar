'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getProductImageUrl } from '@/lib/media';
import { formatPriceFromCents } from '@/lib/format';
import { dealBadgeText, dealFromRow } from '@/lib/pricing';
import { useCartStore } from '@/store/cart-store';
import type { ProductWithVariants } from '@/lib/data/products';

const BADGE_STYLES: Record<string, string> = {
  '100% Doğal': 'bg-primary text-white',
  'Soğuk Sıkım': 'bg-blue-600 text-white',
  Yöresel: 'bg-accent text-primary-dark',
  'Sınırlı Stok': 'bg-red-500 text-white',
  Geleneksel: 'bg-primary-dark text-cream'
};

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const variants = product.product_variants;
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? '');
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);

  if (!selectedVariant) return null;
  const imageUrl = getProductImageUrl(product.image_path);
  const outOfStock = selectedVariant.stock <= 0;
  const isLowStock = selectedVariant.stock > 0 && selectedVariant.stock < 10;
  const compareAt = selectedVariant.compare_at_price_cents;
  const hasDiscount = compareAt != null && compareAt > selectedVariant.price_cents;
  const discountPct = hasDiscount ? Math.round((1 - selectedVariant.price_cents / compareAt) * 100) : 0;
  const deal = dealFromRow(product);
  // "Sınırlı Stok" artık sabit/elle atanan bir etiket DEĞİL — aşağıda gerçek
  // stok sayısından her render'da yeniden hesaplanır (isLowStock). Veritabanında
  // henüz düzenlenmemiş eski ürünlerde bu etiket hâlâ kayıtlı olabileceğinden,
  // görüntülenen listeden burada filtrelenir (bkz. ProductForm.tsx'teki not).
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
      imageUrl,
      deal
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg overflow-hidden flex flex-col transition-shadow">
      <a href={`/urun/${product.slug}`} className="relative block overflow-hidden aspect-square bg-cream">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {deal && (
            <span className="text-[10.5px] font-extrabold px-2 py-1 rounded-full bg-primary text-white">{dealBadgeText(deal)}</span>
          )}
          {hasDiscount && (
            <span className="text-[10.5px] font-extrabold px-2 py-1 rounded-full bg-red-600 text-white">%{discountPct} İNDİRİM</span>
          )}
          {displayBadges.map((b) => (
            <span key={b} className={`text-[10.5px] font-bold px-2 py-1 rounded-full ${BADGE_STYLES[b] ?? 'bg-carbon text-white'}`}>
              {b}
            </span>
          ))}
          {isLowStock && <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-red-500 text-white">Sınırlı Stok</span>}
        </div>
      </a>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="text-[11px] font-semibold text-accent-dark uppercase tracking-wide mb-1">{product.categories.name}</div>
        <h3 className="font-semibold text-sm sm:text-[15px] leading-snug mb-2 flex-1">{product.name}</h3>

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
            aria-label="Sepete Ekle"
          >
            {justAdded ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
