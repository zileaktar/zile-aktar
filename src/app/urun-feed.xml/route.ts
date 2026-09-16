import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { env } from '@/lib/env.mjs';
import { getProductImageUrls } from '@/lib/media';
import { getPlainExcerpt } from '@/lib/format';
import { LEGAL } from '@/lib/legal';

/**
 * Google Merchant Center uyumlu ürün akışı (RSS 2.0 + `g:` ad alanı).
 * iyzico'nun alışveriş asistanı "kolai" (Ayarlar > kolai > XML Linki) ve
 * ileride istenirse Google Merchant Center bu URL'i kullanır: /urun-feed.xml
 *
 * Stok/fiyat her zaman güncel olmalı — bu yüzden kasıtlı olarak önbelleksiz
 * (force-dynamic), tıpkı sitemap.ts ve getProducts() gibi. Beklenen istek
 * sıklığı düşük (iyzico kendi belirlediği periyotta — saatlik/günlük/haftalık —
 * çeker; ziyaretçiler tarafından çağrılmaz), o yüzden performans sorun değil.
 */
export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: products } = await supabase
    .from('products')
    .select(
      'id, slug, name, description, image_path, image_paths, product_variants(sku, label, price_cents, compare_at_price_cents, stock)'
    )
    .eq('is_active', true);

  const items = (products ?? [])
    .flatMap((p) => {
      const multiVariant = p.product_variants.length > 1;
      const images = getProductImageUrls(p.image_path, p.image_paths ?? []);
      const [imageLink, ...extraImages] = images;
      if (!imageLink) return [];

      return p.product_variants.map((v) => {
        const title = multiVariant ? `${p.name} - ${v.label}` : p.name;
        const link = `${env.NEXT_PUBLIC_APP_URL}/urun/${p.slug}`;
        const hasDiscount = v.compare_at_price_cents != null && v.compare_at_price_cents > v.price_cents;
        const priceCents = hasDiscount ? v.compare_at_price_cents! : v.price_cents;
        const salePriceCents = hasDiscount ? v.price_cents : null;
        const availability = v.stock > 0 ? 'in_stock' : 'out_of_stock';

        return [
          '  <item>',
          `    <g:id>${escapeXml(v.sku)}</g:id>`,
          `    <title><![CDATA[${title}]]></title>`,
          `    <description><![CDATA[${getPlainExcerpt(p.description, 500)}]]></description>`,
          `    <link>${escapeXml(link)}</link>`,
          `    <g:image_link>${escapeXml(imageLink)}</g:image_link>`,
          ...extraImages.slice(0, 9).map((url) => `    <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`),
          '    <g:condition>new</g:condition>',
          `    <g:availability>${availability}</g:availability>`,
          `    <g:price>${(priceCents / 100).toFixed(2)} TRY</g:price>`,
          ...(salePriceCents != null ? [`    <g:sale_price>${(salePriceCents / 100).toFixed(2)} TRY</g:sale_price>`] : []),
          `    <g:brand>${escapeXml(LEGAL.markaAdi)}</g:brand>`,
          '    <g:identifier_exists>no</g:identifier_exists>',
          ...(multiVariant ? [`    <g:item_group_id>${escapeXml(p.id)}</g:item_group_id>`] : []),
          '  </item>'
        ].join('\n');
      });
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    `  <title>${escapeXml(LEGAL.markaAdi)} Ürün Kataloğu</title>`,
    `  <link>${escapeXml(env.NEXT_PUBLIC_APP_URL)}</link>`,
    `  <description>${escapeXml(LEGAL.markaAdi)} — doğal ve yöresel ürünler ürün akışı</description>`,
    items,
    '</channel>',
    '</rss>'
  ].join('\n');

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
