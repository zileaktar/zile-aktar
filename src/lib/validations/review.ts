import { z } from 'zod';

// migration 0013 reviews CHECK kısıtlarıyla eşleşir.
export const reviewInputSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, 'Puan seçin.').max(5),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().min(3, 'Yorum en az 3 karakter olmalı.').max(2000, 'Yorum en fazla 2000 karakter olabilir.')
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
