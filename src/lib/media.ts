import { env } from '@/lib/env.mjs';

/**
 * Bir ürünün `image_path` alanını gösterilebilir bir URL'e çevirir. Üç biçimi destekler:
 *  1. Tam URL (http...) — dış kaynaklı geçici/demo görseller.
 *  2. "/" ile başlayan kök-göreli yol (örn. "/urunler/kekik.png") — projenin
 *     `public/` klasöründeki YER TUTUCU görseller. Gerçek ürün fotoğrafı çekilene
 *     kadar buraya bir dosya konur; foto hazır olunca aynı isimle üzerine yazmak
 *     yeterlidir, kodda hiçbir değişiklik gerekmez.
 *  3. Diğer her şey — admin panelinden Storage'a yüklenen "product-images/<dosya>"
 *     biçimindeki göreli yol, Supabase public Storage URL'ine dönüştürülür.
 */
export function getProductImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imagePath}`;
}

/**
 * Ürün galerisi için gösterilecek görsel URL'lerini sırayla döndürür:
 * ana görsel (`image_path`) her zaman ilk sırada, ardından ek galeri
 * görselleri (`image_paths`). Boş/yinelenen yollar elenir.
 */
export function getProductImageUrls(imagePath: string, extraPaths: string[] = []): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const path of [imagePath, ...extraPaths]) {
    const trimmed = path?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    urls.push(getProductImageUrl(trimmed));
  }
  return urls;
}
