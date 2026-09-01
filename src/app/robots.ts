import type { MetadataRoute } from 'next';
import { env } from '@/lib/env.mjs';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/hesabim', '/admin', '/api', '/checkout'] }],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`
  };
}
