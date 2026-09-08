import { z } from 'zod';
import { turkishPhoneRegex } from '@/lib/validations/checkout';

// Hesabım > Adreslerim'de kayıtlı teslimat adresi ekleme/düzenleme şeması.
// Hem client form doğrulaması hem sunucu action'ı (asıl sınır) bu şemayı kullanır.
export const savedAddressSchema = z.object({
  label: z.string().trim().min(1, 'Adres başlığı girin (ör. Ev, İş).').max(40),
  fullName: z.string().trim().min(3, 'Ad soyad en az 3 karakter olmalı.').max(120),
  phone: z.string().trim().regex(turkishPhoneRegex, 'Telefon 05xxxxxxxxx formatında olmalı.'),
  city: z.string().trim().min(2, 'İl girin.').max(60),
  district: z.string().trim().min(2, 'İlçe girin.').max(60),
  addressLine: z.string().trim().min(10, 'Açık adres en az 10 karakter olmalı.').max(500),
  isDefault: z.boolean().optional()
});

export type SavedAddressInput = z.infer<typeof savedAddressSchema>;
