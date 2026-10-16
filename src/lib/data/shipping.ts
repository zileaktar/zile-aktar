import 'server-only';
import { unstable_cache } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseAnonServerClient } from '@/lib/supabase/server';
import { FALLBACK_SHIPPING_CONFIG, type ShippingConfig } from '@/lib/shipping';

/**
 * Kargo ayarları + ağırlık aralıkları (migration 0043). 5 dk önbellekli; admin
 * kaydedince revalidateTag('shipping') ile anında yenilenir (admin/ayarlar/actions.ts).
 * Okunamazsa başlangıç değerine düşer — metinler/önizleme bozulmasın; gerçek
 * ücret zaten create_order'da DB'den hesaplanır.
 */
export const getShippingConfig = unstable_cache(
  async (): Promise<ShippingConfig> => {
    const supabase = createSupabaseAnonServerClient();
    const [{ data: settings, error: settingsError }, { data: rates, error: ratesError }] = await Promise.all([
      supabase
        .from('shipping_settings')
        .select('free_threshold_cents, default_item_grams, packaging_grams, extra_per_kg_cents')
        .eq('id', 1)
        .single(),
      supabase.from('shipping_rates').select('max_grams, price_cents').order('max_grams')
    ]);
    if (settingsError || ratesError || !settings || !rates || rates.length === 0) {
      Sentry.captureMessage('Kargo ayarları okunamadı, varsayılan kullanılıyor', { level: 'warning' });
      return FALLBACK_SHIPPING_CONFIG;
    }
    return {
      freeThresholdCents: settings.free_threshold_cents,
      defaultItemGrams: settings.default_item_grams,
      packagingGrams: settings.packaging_grams,
      extraPerKgCents: settings.extra_per_kg_cents,
      rates: rates.map((r) => ({ maxGrams: r.max_grams, priceCents: r.price_cents }))
    };
  },
  ['shipping-config'],
  { revalidate: 300, tags: ['shipping'] }
);
