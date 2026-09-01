import { z } from 'zod';
import { isValidTcKimlikNo } from '@/lib/tc-kimlik-no';

// Bu şema hem client (form doğrulama, anlık hata mesajları) hem de
// /api/checkout route handler'ında (gerçek güvenlik sınırı) kullanılır.
// Client'tan asla fiyat/toplam bilgisi kabul edilmez — yalnızca variantId + qty
// gönderilir, gerçek fiyat sunucuda veritabanından okunur.

export const checkoutItemSchema = z.object({
  variantId: z.string().uuid('Geçersiz ürün varyantı.'),
  quantity: z.number().int().min(1).max(20, 'Bir üründen en fazla 20 adet sipariş edebilirsiniz.')
});

export const turkishPhoneRegex = /^(05)[0-9]{9}$/;

export const checkoutAddressSchema = z.object({
  fullName: z.string().trim().min(3, 'Ad soyad en az 3 karakter olmalı.').max(120),
  phone: z.string().regex(turkishPhoneRegex, 'Telefon 05xxxxxxxxx formatında olmalı.'),
  email: z.string().trim().email('Geçerli bir e-posta girin.'),
  city: z.string().trim().min(2).max(60),
  district: z.string().trim().min(2).max(60),
  addressLine: z.string().trim().min(10, 'Açık adres en az 10 karakter olmalı.').max(500),
  // iyzico'nun Checkout Form Initialize isteği `buyer.identityNumber` alanını
  // zorunlu tutar. Tek ödeme yöntemi kart olduğundan bu alan her siparişte gereklidir
  // (aşağıdaki superRefine geçerli bir T.C. Kimlik No olmasını da doğrular).
  identityNumber: z.string().trim().optional()
});

/** Fatura adresi — teslimat adresinden farklıysa. E-posta/kimlik alanı yok. */
export const billingAddressSchema = z.object({
  fullName: z.string().trim().min(3, 'Ad soyad / unvan en az 3 karakter olmalı.').max(160),
  phone: z.string().regex(turkishPhoneRegex, 'Telefon 05xxxxxxxxx formatında olmalı.'),
  city: z.string().trim().min(2).max(60),
  district: z.string().trim().min(2).max(60),
  addressLine: z.string().trim().min(10, 'Fatura adresi en az 10 karakter olmalı.').max(500)
});

export const checkoutRequestSchema = z
  .object({
    items: z.array(checkoutItemSchema).min(1, 'Sepetiniz boş.'),
    address: checkoutAddressSchema,
    billingAddress: billingAddressSchema.nullish(),
    // Ödeme yöntemleri: kredi/banka kartı (iyzico 3D Secure) veya havale/EFT
    // (banka hesabına ödeme, dekont sonrası admin onayı). Kapıda ödeme yok.
    paymentMethod: z.enum(['card', 'havale']),
    acceptedDistanceSalesAgreement: z.literal(true, {
      errorMap: () => ({ message: 'Mesafeli Satış Sözleşmesi onayı zorunludur.' })
    }),
    acceptedKvkk: z.literal(true, {
      errorMap: () => ({ message: 'KVKK Aydınlatma Metni onayı zorunludur.' })
    })
  })
  .superRefine((data, ctx) => {
    // T.C. Kimlik No yalnızca kart ödemesinde zorunlu (iyzico buyer.identityNumber şartı).
    // Havale/EFT'de iyzico'ya istek gitmez, bu alan istenmez.
    if (data.paymentMethod !== 'card') return;

    if (!data.address.identityNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['address', 'identityNumber'],
        message: 'Kredi/banka kartı ile ödemede T.C. Kimlik No zorunludur.'
      });
      return;
    }

    if (!isValidTcKimlikNo(data.address.identityNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['address', 'identityNumber'],
        message: 'Geçerli bir T.C. Kimlik No girin.'
      });
    }
  });

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;
