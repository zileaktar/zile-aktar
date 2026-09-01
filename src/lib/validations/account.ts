import { z } from 'zod';
import { turkishPhoneRegex } from '@/lib/validations/checkout';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().regex(turkishPhoneRegex, 'Telefon 05xxxxxxxxx formatında olmalı.').optional(),
  marketingConsent: z.boolean()
});

export const addressInputSchema = z.object({
  label: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().regex(turkishPhoneRegex, 'Telefon 05xxxxxxxxx formatında olmalı.'),
  city: z.string().trim().min(2).max(60),
  district: z.string().trim().min(2).max(60),
  addressLine: z.string().trim().min(10).max(500),
  isDefault: z.boolean().default(false)
});

export const deleteAccountSchema = z.object({
  confirmationText: z.literal('HESABIMI SİL', {
    errorMap: () => ({ message: 'Onay için tam olarak "HESABIMI SİL" yazmalısınız.' })
  })
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
