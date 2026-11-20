import { describe, expect, it } from 'vitest';
import {
  buildDistanceSalesHtml,
  buildOrderLegalDocuments,
  buildPreliminaryInfoHtml,
  LEGAL_DOCS_VERSION,
  type LegalDocInput
} from '@/lib/legal-documents';
import { LEGAL } from '@/lib/legal';

const baseInput: LegalDocInput = {
  orderNumber: 'ZA-20261120-0001',
  orderDate: '2026-11-20T09:30:00.000Z',
  buyerEmail: 'ayse@example.com',
  shippingAddress: {
    fullName: 'Ayşe Yılmaz',
    phone: '05551234567',
    city: 'İstanbul',
    district: 'Kadıköy',
    addressLine: 'Örnek Mah. Örnek Sk. No:1 D:2'
  },
  billingAddress: null,
  items: [
    { name: 'Karabiber', variantLabel: '100 g', quantity: 2, unitPriceCents: 4500 },
    { name: 'Ihlamur', variantLabel: '50 g', quantity: 1, unitPriceCents: 12000 }
  ],
  subtotalCents: 21000,
  dealDiscountCents: 0,
  couponDiscountCents: 1000,
  couponCode: 'HOSGELDIN',
  shippingCents: 7500,
  totalCents: 27500,
  paymentMethod: 'card'
};

describe('siparişe özel ÖBF / MSS', () => {
  it('müşteri adı, adres, ürünler, toplam tutar ve tarihi içerir', () => {
    for (const html of Object.values(buildOrderLegalDocuments(baseInput))) {
      expect(html).toContain('ZA-20261120-0001');
      expect(html).toContain('Ayşe Yılmaz');
      expect(html).toContain('Örnek Mah. Örnek Sk. No:1 D:2');
      expect(html).toContain('Kadıköy / İstanbul');
      expect(html).toContain('ayse@example.com');
      expect(html).toContain('Karabiber');
      expect(html).toContain('Ihlamur');
      expect(html).toContain('275,00 ₺'); // toplam
      expect(html).toContain('75,00 ₺'); // kargo
      expect(html).toContain('-10,00 ₺'); // kupon
      expect(html).toContain('HOSGELDIN');
      expect(html).toContain('20.11.2026 12:30'); // Türkiye saati (UTC+3)
      expect(html).toContain(LEGAL_DOCS_VERSION);
    }
  });

  it('satıcı künyesini (unvan, adres, VKN, MERSİS) içerir', () => {
    const html = buildDistanceSalesHtml(baseInput);
    expect(html).toContain(LEGAL.unvan);
    expect(html).toContain(LEGAL.vergiNo);
    expect(html).toContain(LEGAL.mersisNo);
    expect(html).toContain('Zile / Tokat');
  });

  it('cayma hakkı, iade taşıyıcısı ve uyuşmazlık mercilerini içerir', () => {
    const html = buildPreliminaryInfoHtml(baseInput);
    expect(html).toContain(`${LEGAL.caymaSuresiGun} gün`);
    expect(html).toContain(LEGAL.iadeKargoFirmasi);
    expect(html).toContain('Tüketici Hakem Heyeti');
    expect(html).toContain('arabulucu');
  });

  it('kullanıcı girdisini HTML-escape eder (XSS)', () => {
    const html = buildPreliminaryInfoHtml({
      ...baseInput,
      shippingAddress: { ...baseInput.shippingAddress, fullName: '<script>alert(1)</script>', addressLine: '"><img src=x onerror=alert(1)>' }
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('fatura adresi farklıysa onu gösterir', () => {
    const html = buildDistanceSalesHtml({
      ...baseInput,
      billingAddress: { fullName: 'Yılmaz Ltd.', phone: '05550000000', city: 'Ankara', district: 'Çankaya', addressLine: 'Fatura Sk. 5' }
    });
    expect(html).toContain('Yılmaz Ltd.');
    expect(html).toContain('Çankaya / Ankara');
  });

  it('havale siparişinde ödeme şekli havale olarak yazılır, kart yazılmaz', () => {
    const html = buildDistanceSalesHtml({ ...baseInput, paymentMethod: 'havale' });
    expect(html).toContain('Havale/EFT');
    expect(html).not.toContain('3D Secure altyapısı');
  });

  it('önizlemede (sipariş no yok, kargo hesaplanıyor) çökmez', () => {
    const html = buildPreliminaryInfoHtml({ ...baseInput, orderNumber: null, shippingCents: null });
    expect(html).toContain('önizleme');
    expect(html).toContain('hesaplanıyor');
  });

  it('aynı girdi her zaman birebir aynı metni üretir (arşiv özeti tutarlılığı)', () => {
    expect(buildDistanceSalesHtml(baseInput)).toBe(buildDistanceSalesHtml(baseInput));
  });

  it('kart verisi alanı yok — belgede kart numarası geçmez', () => {
    // MERSİS no da 16 hanedir — onu çıkarıp kalan metinde 16 haneli sayı arıyoruz.
    const html = Object.values(buildOrderLegalDocuments(baseInput)).join('').replaceAll(LEGAL.mersisNo, '');
    expect(html).not.toMatch(/\b\d{16}\b/);
    expect(html.toLowerCase()).not.toContain('cvv');
  });
});
