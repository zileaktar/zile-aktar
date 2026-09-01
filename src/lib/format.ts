/** Kuruş cinsinden tam sayıyı Türkçe para birimi biçimine çevirir (34000 -> "340,00 ₺"). */
export function formatPriceFromCents(cents: number): string {
  return (cents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

/**
 * JSON-LD verisini <script type="application/ld+json"> içine güvenle gömer.
 * `JSON.stringify` tek başına `</script>` dizisini KAÇIRMAZ — bir ürün adı/açıklaması
 * (ör. ele geçirilmiş bir admin hesabından) `</script><script>...` içerirse, bu doğrudan
 * sayfa HTML'ine enjekte olup script bağlamından kaçabilir. `<` karakterini unicode
 * kaçış diziyle (<) değiştirmek, JSON geçerliliğini bozmadan bu vektörü kapatır.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Ürün açıklamaları artık "## Başlık" / "- madde" / "⚠️ uyarı" gibi basit bir
 * biçimlendirme içerebilir (bkz. RichProductDescription.tsx). Arama motoru
 * meta açıklaması ve JSON-LD gibi DÜZ METİN bekleyen yerlerde bu işaretlerin
 * ham haliyle görünmesini engellemek için ilk anlamlı paragrafı çıkarır.
 */
export function getPlainExcerpt(richText: string, maxLength = 160): string {
  const firstParagraph = richText
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('##') && !line.startsWith('⚠️'));

  const text = (firstParagraph ?? richText).replace(/^-\s*/, '');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
