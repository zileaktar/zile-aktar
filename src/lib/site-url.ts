/**
 * Sitenin kendi alan adları. Bu adreslere verilmiş TAM bağlantılar (ör. admin
 * afiş linkine yapıştırılan `https://zile-aktar.vercel.app/?kategori=bal`)
 * site içi göreli yola çevrilir — aksi halde müşteri başka bir alan adına geçer,
 * sepeti (tarayıcıda alan adına özel tutulur) boş görünür ve ödeme CSRF
 * kontrolüne takılır.
 */
export const OWN_HOSTS = ['zileaktar.com', 'www.zileaktar.com', 'zile-aktar.vercel.app'];

/** Eski Vercel adresi — middleware buradan gelen sayfa isteklerini zileaktar.com'a yönlendirir. */
export const LEGACY_HOSTS = ['zile-aktar.vercel.app'];

/** Kendi alan adımıza giden tam URL'yi `/yol?sorgu#bolum` biçimine çevirir; diğerlerini olduğu gibi bırakır. */
export function toSiteRelativeUrl(value: string): string {
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return v;
  try {
    const url = new URL(v);
    if (!OWN_HOSTS.includes(url.hostname.toLowerCase())) return v;
    return `${url.pathname}${url.search}${url.hash}` || '/';
  } catch {
    return v;
  }
}
