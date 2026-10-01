import { describe, expect, it } from 'vitest';
import {
  buildBulkPreview,
  centsToTl,
  decodeCsvBytes,
  parseCsv,
  parseTl,
  variantsToCsv,
  type VariantSnapshot
} from '@/lib/bulk-variants';

const v = (partial: Partial<VariantSnapshot>): VariantSnapshot => ({
  sku: 'KEKIK-STD',
  categoryName: 'Baharatlar',
  productName: 'Kekik',
  label: '100 g',
  priceCents: 15000,
  compareAtCents: null,
  stock: 10,
  isActive: true,
  ...partial
});

describe('parseTl / centsToTl', () => {
  it('Türkçe ve İngilizce biçimleri kuruşa çevirir', () => {
    expect(parseTl('150,50')).toBe(15050);
    expect(parseTl('150.50')).toBe(15050);
    expect(parseTl('1.250,00')).toBe(125000);
    expect(parseTl('1,250.00')).toBe(125000);
    expect(parseTl('150')).toBe(15000);
    expect(parseTl(' 99,9 ₺ ')).toBe(9990);
    expect(parseTl('')).toBeNull();
    expect(parseTl('abc')).toBe('invalid');
    expect(parseTl('1,234')).toBe('invalid'); // 3 ondalık hane belirsiz
    expect(centsToTl(15050)).toBe('150,50');
    expect(centsToTl(7)).toBe('0,07');
  });
});

describe('CSV okuma/yazma', () => {
  it('dışa aktarılan dosya geri okunabilir (tırnak, noktalı virgül)', () => {
    const csv = variantsToCsv([v({ productName: 'Çörekotu; yağı "saf"', compareAtCents: 20000 })]);
    const rows = parseCsv(csv);
    expect(rows[0]?.[0]).toBe('SKU');
    expect(rows[1]?.[2]).toBe('Çörekotu; yağı "saf"');
    expect(rows[1]?.[4]).toBe('150,00');
    expect(rows[1]?.[5]).toBe('200,00');
  });

  it('virgül ayraçlı dosyayı da tanır, boş satırları atar', () => {
    const rows = parseCsv('SKU,Fiyat (TL),Stok\r\nA,"150,50",3\r\n\r\n');
    expect(rows).toEqual([
      ['SKU', 'Fiyat (TL)', 'Stok'],
      ['A', '150,50', '3']
    ]);
  });

  it('UTF-8 değilse Windows-1254 olarak çözer', () => {
    // "ş" Windows-1254'te 0xFE — geçersiz UTF-8.
    expect(decodeCsvBytes(new Uint8Array([0x6b, 0x61, 0xfe]))).toBe('kaş');
    expect(decodeCsvBytes(new TextEncoder().encode('﻿kaş'))).toBe('kaş');
  });
});

describe('buildBulkPreview', () => {
  const current = new Map([
    ['KEKIK-STD', v({})],
    ['NANE-STD', v({ sku: 'NANE-STD', productName: 'Nane', stock: 5 })]
  ]);
  const header = ['SKU', 'Kategori', 'Ürün', 'Seçenek', 'Fiyat (TL)', 'İndirimsiz Fiyat (TL)', 'Stok', 'Durum'];

  it('yalnızca değişen satırları listeler', () => {
    const p = buildBulkPreview(
      [header, ['KEKIK-STD', '', '', '', '175,00', '200,00', '8', ''], ['NANE-STD', '', '', '', '150,00', '', '5', '']],
      current
    );
    expect(p.errors).toEqual([]);
    expect(p.unchanged).toBe(1);
    expect(p.changes).toHaveLength(1);
    expect(p.changes[0]?.next).toEqual({ priceCents: 17500, compareAtCents: 20000, stock: 8 });
    expect(p.changes[0]?.old).toEqual({ priceCents: 15000, compareAtCents: null, stock: 10 });
  });

  it('hatalı satırları satır numarasıyla bildirir', () => {
    const p = buildBulkPreview(
      [
        header,
        ['YOK-STD', '', '', '', '10', '', '1', ''],
        ['KEKIK-STD', '', '', '', '0', '', '1', ''],
        ['NANE-STD', '', '', '', '100', '90', '1', ''],
        ['NANE-STD', '', '', '', '100', '', '1', '']
      ],
      current
    );
    expect(p.errors.map((e) => e.line)).toEqual([2, 3, 4, 5]);
    expect(p.changes).toEqual([]);
  });

  it('negatif / ondalıklı stok reddedilir', () => {
    const p = buildBulkPreview([header, ['KEKIK-STD', '', '', '', '150', '', '-1', '']], current);
    expect(p.errors).toHaveLength(1);
    const q = buildBulkPreview([header, ['KEKIK-STD', '', '', '', '150', '', '2,5', '']], current);
    expect(q.errors).toHaveLength(1);
  });

  it('Stok Tablosu aracı dosyası: ürün ADIYLA eşleşir, sitede olmayan uyarıdır', () => {
    const toolHeader = ['Kategori', 'Urun', 'Miktar', 'Birim', 'Stok', 'Fiyat', 'Ozellik'];
    const p = buildBulkPreview(
      [
        toolHeader,
        ['Baharatlar', 'kekik', '100', 'Gram (g)', '7', '160', ''],
        ['Baharatlar', 'NANE', '100', 'Gram (g)', '5', '150', ''],
        ['Yağlar', 'olmayan ürün', '50', 'Mililitre (ml)', '3', '99', ''],
        ['', '', '', '', '', '', '']
      ],
      current
    );
    expect(p.errors).toEqual([]);
    expect(p.changes.map((c) => c.sku)).toEqual(['KEKIK-STD']);
    expect(p.changes[0]?.next).toEqual({ priceCents: 16000, compareAtCents: null, stock: 7 });
    expect(p.unchanged).toBe(1);
    expect(p.warnings.map((w) => w.line)).toEqual([4]);
  });

  it('araç dosyasında yeni fiyat indirimsiz fiyata ulaşırsa indirim kalkar', () => {
    const withDeal = new Map([['KEKIK-STD', v({ priceCents: 15000, compareAtCents: 18000 })]]);
    const p = buildBulkPreview([['Urun', 'Stok', 'Fiyat'], ['Kekik', '10', '180']], withDeal);
    expect(p.changes[0]?.next.compareAtCents).toBeNull();
    expect(p.warnings).toHaveLength(1);
    const q = buildBulkPreview([['Urun', 'Stok', 'Fiyat'], ['Kekik', '10', '160']], withDeal);
    expect(q.changes[0]?.next.compareAtCents).toBe(18000);
  });

  it('araç dosyası: birden fazla seçenekli üründe miktar+birimle seçer', () => {
    const multi = new Map([
      ['K-100', v({ sku: 'K-100', label: '100 gr' })],
      ['K-250', v({ sku: 'K-250', label: '250 gr' })]
    ]);
    const p = buildBulkPreview(
      [['Urun', 'Miktar', 'Birim', 'Stok', 'Fiyat'], ['Kekik', '250', 'Gram (g)', '4', '300']],
      multi
    );
    expect(p.changes.map((c) => c.sku)).toEqual(['K-250']);
    const q = buildBulkPreview([['Urun', 'Stok', 'Fiyat'], ['Kekik', '4', '300']], multi);
    expect(q.changes).toEqual([]);
    expect(q.warnings).toHaveLength(1);
  });

  it('başlıklar eksikse tüm dosya reddedilir', () => {
    const p = buildBulkPreview([['Ürün', 'Fiyat'], ['Kekik', '10']], current);
    expect(p.errors[0]?.line).toBe(1);
  });
});
