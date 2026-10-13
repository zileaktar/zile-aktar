/**
 * Kategori sayfalarının (`/kategori/[slug]`) arama motoru metinleri.
 *
 * - `title`: tarayıcı sekmesi + Google başlığı (sonuna otomatik " | Zile Aktar" eklenir).
 * - `description`: Google sonuç açıklaması (~150-160 karakter).
 * - `intro`: sayfanın üstünde görünen tanıtım paragrafı — Google sayfanın neyle
 *   ilgili olduğunu bu metinden anlar; her kategoride FARKLI olmalı.
 *
 * Mevzuat: tıbbi iddia (tedavi eder, iyileştirir, şifa verir...) YAZILMAZ.
 * Burada olmayan bir kategori (admin panelden yeni eklenen) genel metinle gösterilir.
 */
export interface CategorySeo {
  title: string;
  description: string;
  intro: string;
}

const CATEGORY_SEO: Record<string, CategorySeo> = {
  baharat: {
    title: 'Baharat Çeşitleri – Pul Biber, İsot, Sumak, Kekik',
    description:
      "Zile Aktar'dan pul biber, isot, sumak, kekik, kimyon ve köfte baharatı. Tokat Zile'deki dükkânımızdan taze baharatlar kapınıza gelir.",
    intro:
      "Tokat'ın Zile ilçesindeki dükkânımızda yıllardır sattığımız baharatları artık internetten de sipariş edebilirsiniz. Zehir acı ve tatlı pul biber, isot, sumak, kekik, kimyon, karabiber, köfte ve sucuk baharatı gibi mutfağın vazgeçilmezleri taze olarak paketlenir ve Türkiye'nin her yerine kargoyla gönderilir."
  },
  yag: {
    title: 'Doğal ve Bitkisel Yağlar – Soğuk Sıkım Yağ Çeşitleri',
    description:
      "Çörek otu, tatlı badem, argan, hindistan cevizi, kabak çekirdeği ve onlarca bitkisel yağ. Zile Aktar'dan güvenli ödeme ve hızlı kargo ile.",
    intro:
      "Çörek otu yağından tatlı badem yağına, argan yağından lavanta yağına kadar geniş bir bitkisel yağ yelpazesi. Cilt ve saç bakımında, masajda ve mutfakta kullanılan yağlarımızı Tokat Zile'deki aktarımızdan özenle paketleyip gönderiyoruz."
  },
  cay: {
    title: 'Kurutulmuş Bitkiler ve Bitki Çayları',
    description:
      "Ihlamur, papatya, ada çayı, ısırgan, melisa ve onlarca kurutulmuş bitki. Zile Aktar'dan bitki çayı çeşitleri, Tokat'tan kapınıza.",
    intro:
      "Ihlamur, papatya, ada çayı, ısırgan, melisa, biberiye ve daha pek çok kurutulmuş bitki bu kategoride. Aktar geleneğiyle seçilen bitkiler, bitki çayı olarak demlenmek üzere temiz ve kuru ortamda paketlenir; Tokat Zile'den Türkiye'nin her yerine gönderilir."
  },
  kozmetik: {
    title: 'Doğal Sabun Çeşitleri – Defne, Kükürt, Kojik, Zeytinyağlı',
    description:
      "Defne sabunu, kükürt sabunu, kojik asit sabunu, zeytinyağlı ve keçi sütlü sabunlar. Zile Aktar'da doğal sabun çeşitleri uygun fiyatla.",
    intro:
      'Defne, zeytinyağlı, kükürtlü, ardıç katranlı, kojik asitli ve keçi sütlü sabunlar. Günlük cilt temizliği için seçtiğimiz doğal içerikli sabunları tek tek ya da birden fazla adet olarak sipariş edebilirsiniz.'
  },
  sirke: {
    title: 'Doğal Fermente Sirkeler – Elma, Alıç, Enginar Sirkesi',
    description:
      "Elma sirkesi, alıç sirkesi, enginarlı ve kayısılı sirkeler, fermente pancar. Geleneksel yöntemle hazırlanan doğal sirkeler Zile Aktar'da.",
    intro:
      'Geleneksel fermantasyon yöntemiyle hazırlanan elma, alıç, ananas ve enginar sirkeleri ile dört hırsız sirkesi ve fermente pancar. Sofranızda ve salatalarınızda kullanabileceğiniz doğal sirkeler, kırılmaya karşı özenle paketlenerek gönderilir.'
  },
  // Henüz katalogda olmayan ama eklendiğinde hazır olan yöresel kategoriler.
  // Admin panelde kategori bu "slug" ile açılırsa metin otomatik kullanılır.
  yoresel: {
    title: 'Tokat Yöresel Ürünleri – Tokat Yaprağı, Salça, Pekmez',
    description:
      "Tokat yaprağı, ev yapımı salça, pekmez ve Zile'nin yöresel lezzetleri. Tokat'tan, üreticiden kapınıza Zile Aktar güvencesiyle.",
    intro:
      "Tokat'ın meşhur yaprağı, güneşte kurutulmuş biber ve domates salçası, pekmez ve Zile'nin yöresel ürünleri. Bölgenin üreticilerinden temin ettiğimiz ürünleri Zile'deki dükkânımızdan Türkiye'nin her yerine gönderiyoruz."
  }
};

export function getCategorySeo(slug: string, name: string): CategorySeo {
  return (
    CATEGORY_SEO[slug] ?? {
      title: name,
      description: `${name} çeşitleri Zile Aktar'da. Tokat Zile'deki aktarımızdan güvenli ödeme ve hızlı kargo ile kapınıza.`,
      intro: `${name} kategorisindeki ürünlerimizi Tokat Zile'deki dükkânımızdan özenle paketleyip Türkiye'nin her yerine gönderiyoruz.`
    }
  );
}
