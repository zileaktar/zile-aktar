import type { MetadataRoute } from 'next';
import { env } from '@/lib/env.mjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: products } = await supabase.from('products').select('slug, updated_at').eq('is_active', true);

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${env.NEXT_PUBLIC_APP_URL}/urun/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  return [
    { url: env.NEXT_PUBLIC_APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...productUrls
  ];
}
