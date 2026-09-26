/** Kuruş cinsinden tam sayıyı Türkçe para birimi biçimine çevirir (34000 -> "340,00 ₺"). */
export function formatPriceFromCents(cents: number): string {
  return (cents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

/*
 * Tarih/saat biçimlendirme — HER ZAMAN Türkiye saati (Europe/Istanbul).
 *
 * `toLocaleString('tr-TR')` saat dilimi belirtilmezse ÇALIŞTIĞI makinenin
 * saatini kullanır: Vercel sunucuları UTC'de olduğu için sunucuda çizilen
 * sayfalarda saatler 3 saat GERİ görünüyordu (ve sunucu/tarayıcı farkı
 * hydration uyuşmazlığına yol açabiliyordu). Tüm tarih gösterimleri bu
 * yardımcılardan geçmeli.
 */
const TR_TIME_ZONE = 'Europe/Istanbul';

const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: TR_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: TR_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: TR_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit'
});

/** "26.09.2026 14:35" — Türkiye saatiyle. */
export function formatDateTimeTR(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

/** "26.09.2026" — Türkiye saatiyle. */
export function formatDateTR(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

/**
 * Sipariş listeleri için okunaklı zaman: bugün ise "Bugün 14:35", dün ise
 * "Dün 09:10", daha eskiyse tam tarih-saat. Gün karşılaştırması Türkiye
 * takvimine göre yapılır (UTC gece yarısı kaymasından etkilenmez).
 */
export function formatOrderTimeTR(value: string | Date, now: Date = new Date()): string {
  const date = new Date(value);
  const day = dateFormatter.format(date);
  if (day === dateFormatter.format(now)) return `Bugün ${timeFormatter.format(date)}`;
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (day === dateFormatter.format(yesterday)) return `Dün ${timeFormatter.format(date)}`;
  return dateTimeFormatter.format(date);
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
