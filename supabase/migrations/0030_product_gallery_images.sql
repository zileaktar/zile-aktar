-- ================================================================
-- ÜRÜN GALERİSİ — birden fazla ürün fotoğrafı
--
-- `products.image_path` ana (kapak) görsel olarak kalır; kart, sepet, OG
-- görseli, Schema.org gibi tekil görsel bekleyen tüm yerler onu kullanmaya
-- devam eder. `image_paths` EK galeri görselleridir (sıralı) — ürün detay
-- sayfasında müşteri sağa/sola kaydırarak gezer.
--
-- Her eleman `getProductImageUrl()`'in çözebildiği bir yoldur:
--   "product-images/<dosya>" (Storage) · "/urunler/<slug>.svg" (placeholder) · tam URL.
-- ================================================================

alter table public.products
  add column if not exists image_paths text[] not null default '{}';
