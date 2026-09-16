// "Son Gezdikleriniz" — tamamen istemci tarafında (localStorage), hesap/oturum
// gerektirmez. Sunucu ürünün fiyat/görselini bu slug listesine göre ayrıca
// çeker (bkz. getProductsBySlugs) — burada sadece hangi ürünlerin gezildiği
// tutulur, ürün verisinin kendisi değil.
const STORAGE_KEY = 'za_recently_viewed';
const MAX_ITEMS = 12;

export function getRecentlyViewedSlugs(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    // localStorage kullanılamıyorsa (gizli sekme, devre dışı vb.) sessizce boş dön.
    return [];
  }
}

export function addRecentlyViewed(slug: string): void {
  try {
    const next = [slug, ...getRecentlyViewedSlugs().filter((s) => s !== slug)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Yazılamıyorsa sorun değil — özellik zarifçe devre dışı kalır.
  }
}
