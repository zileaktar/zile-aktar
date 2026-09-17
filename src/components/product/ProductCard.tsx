import Image from 'next/image';
import { getProductImageUrl } from '@/lib/media';
import { dealBadgeText, dealFromRow } from '@/lib/pricing';
import { ProductCardActions } from '@/components/product/ProductCardActions';
import { FavoriteButton } from '@/components/product/FavoriteButton';
import type { ProductWithVariants } from '@/lib/data/products';

const BADGE_STYLES: Record<string, string> = {
  '100% Doğal': 'bg-primary text-white',
  'Soğuk Sıkım': 'bg-blue-600 text-white',
  Yöresel: 'bg-accent text-primary-dark',
  'Sınırlı Stok': 'bg-red-500 text-white',
  Geleneksel: 'bg-primary-dark text-cream'
};

/**
 * Ürün kartı — SERVER component. Görsel, rozetler, kategori ve ad sunucuda
 * render edilir (JS yok, hidrasyon yok). Yalnızca etkileşimli alt blok
 * (varyant seçimi + fiyat + "Sepete Ekle") `ProductCardActions` client
 * island'ında çalışır.
 *
 * Görsel üstündeki indirim / "Sınırlı Stok" rozetleri, kartın VARSAYILAN
 * (ilk) varyantından hesaplanır; kullanıcı farklı bir gramaj seçse bile bu
 * rozetler değişmez (fiyat alt blokta canlı güncellenir). Ürünlerin çoğu tek
 * varyantlı olduğundan bu, pratikte fark edilmeyen bir ödünleşmedir.
 */
export function ProductCard({
  product,
  isFavorited = false,
  loggedIn = false
}: {
  product: ProductWithVariants;
  isFavorited?: boolean;
  loggedIn?: boolean;
}) {
  const variants = product.product_variants;
  const firstVariant = variants[0];
  if (!firstVariant) return null;

  const imageUrl = getProductImageUrl(product.image_path);
  const compareAt = firstVariant.compare_at_price_cents;
  const hasDiscount = compareAt != null && compareAt > firstVariant.price_cents;
  const discountPct = hasDiscount ? Math.round((1 - firstVariant.price_cents / compareAt) * 100) : 0;
  const isLowStock = firstVariant.stock > 0 && firstVariant.stock < 10;
  const deal = dealFromRow(product);
  // "Sınırlı Stok" artık canlı stok sayısından hesaplanır — DB'de kayıtlı eski
  // sabit etiket görüntülenen listeden filtrelenir (bkz. ProductForm.tsx notu).
  const displayBadges = product.badges.filter((b) => b !== 'Sınırlı Stok');

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg overflow-hidden flex flex-col transition-shadow">
      {/* İlişkili görsel + rozet katmanı: FavoriteButton bir <button>, HTML'de
          <a> içine etkileşimli içerik (nested interactive content) konulamaz
          — bu yüzden <a> yalnızca görseli sarar, rozetler/kalp ikonu bu dış
          relative kapsayıcıda KARDEŞ eleman olarak konumlanır. */}
      <div className="relative overflow-hidden aspect-square bg-cream">
        <a href={`/urun/${product.slug}`} className="absolute inset-0 block">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </a>
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
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
        <FavoriteButton
          productId={product.id}
          initialFavorited={isFavorited}
          loggedIn={loggedIn}
          className="absolute top-2 right-2 w-8 h-8"
        />
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="text-[11px] font-semibold text-accent-dark uppercase tracking-wide mb-1">{product.categories.name}</div>
        <h3 className="font-semibold text-sm sm:text-[15px] leading-snug mb-2 flex-1">{product.name}</h3>
        <ProductCardActions product={product} />
      </div>
    </div>
  );
}
