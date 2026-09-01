'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/store/ui-store';
import { useCartStore } from '@/store/cart-store';
import { formatPriceFromCents } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD_CENTS, calculateShippingCents } from '@/lib/pricing';

export function CartDrawer() {
  const { isCartOpen, closeCart } = useUiStore();
  const { items, updateQuantity, removeItem } = useCartStore();
  const router = useRouter();

  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const shipping = calculateShippingCents(subtotal);
  const total = subtotal + shipping;
  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - subtotal;
  const shippingPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_CENTS) * 100);

  function goToCheckout() {
    closeCart();
    router.push('/checkout');
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeCart}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[60] shadow-2xl flex flex-col transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-primary/10">
          <h3 className="font-display font-bold text-lg text-primary flex items-center gap-2">
            🛒 Sepetim {items.length > 0 && <span className="text-sm font-normal text-carbon/50">({items.reduce((s, i) => s + i.quantity, 0)} ürün)</span>}
          </h3>
          <button onClick={closeCart} className="touch-target flex items-center justify-center rounded-full hover:bg-primary/10" aria-label="Kapat">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b4332" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-b border-primary/10">
            <div className="text-xs font-medium text-carbon/70 mb-2">
              {remaining > 0 ? (
                <>
                  🚚 <b>{formatPriceFromCents(remaining)}</b> daha ekleyin, kargo <b>bedava</b> olsun!
                </>
              ) : (
                <>🎉 Tebrikler, kargonuz bedava!</>
              )}
            </div>
            <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-500 rounded-full" style={{ width: `${shippingPct}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">🛍️</div>
              <p className="font-semibold text-primary">Sepetiniz boş</p>
              <p className="text-sm text-carbon/50 mt-1">Doğal ürünlerimizi keşfetmeye başlayın!</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="flex gap-3 items-center">
                <Image src={item.imageUrl} alt={item.productName} width={64} height={64} className="w-16 h-16 rounded-xl object-cover shrink-0 bg-cream" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.productName}</div>
                  <div className="text-xs text-carbon/50">{item.variantLabel}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-2 bg-cream rounded-full px-1 py-1">
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="touch-target w-7 h-7 flex items-center justify-center rounded-full hover:bg-white font-bold text-primary">
                        −
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="touch-target w-7 h-7 flex items-center justify-center rounded-full hover:bg-white font-bold text-primary">
                        +
                      </button>
                    </div>
                    <span className="font-display font-bold text-sm text-primary">{formatPriceFromCents(item.priceCents * item.quantity)}</span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.variantId)} className="touch-target flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 shrink-0" aria-label="Kaldır">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-primary/10 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm text-carbon/60">
              <span>Ara Toplam</span>
              <span className="font-medium text-carbon">{formatPriceFromCents(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-carbon/60">
              <span>Kargo</span>
              <span className="font-medium text-carbon">{shipping === 0 ? 'Bedava' : formatPriceFromCents(shipping)}</span>
            </div>
            <div className="flex items-center justify-between font-display font-bold text-lg text-primary pt-2 border-t border-dashed border-primary/15">
              <span>Toplam</span>
              <span>{formatPriceFromCents(total)}</span>
            </div>
            <button onClick={goToCheckout} className="touch-target w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-full transition flex items-center justify-center gap-2">
              Siparişi Tamamla
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
