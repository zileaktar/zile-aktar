import { z } from 'zod';

// Admin panelinde ürün/varyant oluşturma-düzenleme formlarını ve
// karşılık gelen API uçlarını doğrulamak için kullanılan ortak şema.

// migration 0013 product_form enum ile birebir.
export const PRODUCT_FORMS = ['toz', 'tane', 'yaprak', 'cicek', 'kok', 'kabuk', 'yag', 'sivi', 'recine', 'sabun', 'macun', 'diger'] as const;
export const PRODUCT_FORM_LABELS: Record<(typeof PRODUCT_FORMS)[number], string> = {
  toz: 'Toz', tane: 'Tane', yaprak: 'Yaprak', cicek: 'Çiçek', kok: 'Kök', kabuk: 'Kabuk',
  yag: 'Yağ', sivi: 'Sıvı', recine: 'Reçine / Sakız', sabun: 'Sabun', macun: 'Macun', diger: 'Diğer'
};

export const productVariantInputSchema = z.object({
  label: z.string().trim().min(1, 'Gramaj/boyut etiketi zorunlu (örn. 250g).').max(30),
  priceCents: z.number().int().positive("Fiyat 0'dan büyük olmalı."),
  stock: z.number().int().min(0, 'Stok negatif olamaz.'),
  // Parti/lot numarası + son tüketim tarihi (migration 0013) — opsiyonel, parti değişince güncellenir.
  lotNo: z.string().trim().max(60).optional().default(''),
  expiryDate: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Tarih YYYY-AA-GG biçiminde olmalı.')
});

/**
 * Sağlık beyanı mevzuatı (Tarım ve Orman Bakanlığı / Sağlık Bakanlığı): bitkisel
 * gıda/takviye ürünleri "tedavi eder / iyileştirir / şifadır" gibi tıbbi endikasyon
 * içeren ifadelerle pazarlanamaz. Ürün açıklaması bu kalıpları içeriyorsa admin
 * formu kaydı REDDEDER ve alternatif ("geleneksel olarak ... amacıyla kullanılır")
 * önerir.
 */
const HEALTH_CLAIM_PATTERN =
  /(tedavi eder|iyileştirir|iyilestirir|şifa(dır| verir| kaynağıdır)|sifa(dir| verir)|hastalığı (geçirir|yok eder|önler)|kanseri? (yok eder|geçirir|önler)|ilaç yerine geçer|kesin çözüm)/i;

export const productInputSchema = z.object({
  categoryId: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug yalnızca küçük harf, rakam ve tire içerebilir.'),
  name: z.string().trim().min(2).max(150),
  description: z
    .string()
    .trim()
    .max(4000)
    .default('')
    .refine((v) => !HEALTH_CLAIM_PATTERN.test(v), {
      message:
        'Sağlık beyanı mevzuatı: "tedavi eder / iyileştirir / şifa" gibi ibareler kullanılamaz. Bunun yerine "geleneksel olarak ... amacıyla kullanılır" gibi ifadeler tercih edin.'
    }),
  // Presigned upload akışından dönen "product-images/<dosya>" yolu ya da
  // (geçici placeholder'lar için) "/urunler/<slug>.svg" gibi kök-göreli bir yol.
  imagePath: z.string().trim().min(1, 'Ürün görseli zorunlu.'),
  badges: z.array(z.enum(['100% Doğal', 'Soğuk Sıkım', 'Yöresel', 'Sınırlı Stok', 'Geleneksel'])).max(4),
  isActive: z.boolean().default(true),
  // Aktar sektörü alanları (migration 0013) — hepsi opsiyonel.
  // form: boş seçim parseProductFormData'da null'a çevrilir.
  form: z.enum(PRODUCT_FORMS).nullable(),
  origin: z.string().trim().max(120).optional().default(''),
  storageInfo: z.string().trim().max(400).optional().default(''),
  allergenInfo: z.string().trim().max(300).optional().default(''),
  shelfLifeNote: z.string().trim().max(200).optional().default(''),
  variants: z.array(productVariantInputSchema).min(1, 'En az bir varyant eklenmeli.')
});

export type ProductInput = z.infer<typeof productInputSchema>;

/**
 * Sunucu tarafında imzalı yükleme URL'i istenirken doğrulanan gövde.
 * `folder`, "product-images" bucket'ı içinde hangi alt klasöre yazılacağını
 * belirler — ürün görselleri "products/", site logosu gibi genel görseller
 * "site/" altına gider. Yeni bir yükleme türü eklendiğinde buraya (whitelist
 * mantığıyla) yeni bir değer eklenir; keyfi bir klasör adı asla kabul edilmez.
 */
export const presignedUploadRequestSchema = z.object({
  fileName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+\.(jpe?g|png|webp)$/i, 'Yalnızca jpg, png veya webp dosyaları yüklenebilir.'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  folder: z.enum(['products', 'site']).default('products')
});
