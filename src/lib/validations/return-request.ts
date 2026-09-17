import { z } from 'zod';

// Self-servis iade talebi (Hesabım → Siparişlerim → sipariş detayı). Sabit
// bir sebep listesi — serbest metin yalnızca ek açıklama (detail) için.
export const RETURN_REASONS = [
  'Ürün hasarlı/kusurlu geldi',
  'Yanlış ürün gönderildi',
  'Ürünü beğenmedim',
  'Cayma hakkımı kullanmak istiyorum',
  'Diğer'
] as const;

export const returnRequestSchema = z.object({
  reason: z.enum(RETURN_REASONS),
  detail: z.string().trim().max(1000).optional().default('')
});

export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;
