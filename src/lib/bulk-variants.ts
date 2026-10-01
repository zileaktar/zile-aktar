/*
 * Panelden toplu fiyat/stok güncelleme (Ürünler → Toplu Güncelleme) — saf
 * fonksiyonlar, birim testli (tests/unit/bulk-variants.test.ts).
 *
 * Akış: admin güncel listeyi CSV indirir → Excel'de Fiyat/İndirimsiz Fiyat/Stok
 * sütunlarını değiştirir → dosyayı yükler → ÖNİZLEME (yalnız değişen satırlar +
 * hatalar) → onay → uygulanır. Eşleşme SKU ile. Ürün ekleme/silme YOK.
 *
 * Türkçe Excel uyumu:
 *  - Dışa aktarım `;` ayraçlı ve UTF-8 BOM'lu (Excel sütunları ve ğ/ş/ı'yı doğru açar),
 *    fiyatlar virgüllü ("150,50").
 *  - İçe aktarımda ayraç (`;` `,` sekme) başlık satırından bulunur; dosya UTF-8
 *    değilse Windows-1254 (Excel'in "CSV (virgülle ayrılmış)" kaydı) olarak okunur;
 *    fiyat "150,50", "150.50", "1.250,00" biçimlerinin hepsi kabul edilir.
 */

export interface VariantSnapshot {
  sku: string;
  categoryName: string;
  productName: string;
  label: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  isActive: boolean;
}

export interface VariantValues {
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
}

export interface BulkChange {
  sku: string;
  productName: string;
  label: string;
  old: VariantValues;
  next: VariantValues;
}

export interface BulkPreview {
  changes: BulkChange[];
  errors: Array<{ line: number; message: string }>;
  unchanged: number;
  totalRows: number;
}

export const MAX_BULK_ROWS = 5000;
// Makul üst sınırlar — yanlışlıkla fazladan sıfır yazılmasına karşı (ör. 1500 yerine 150000).
export const MAX_PRICE_CENTS = 10_000_000; // 100.000 TL
export const MAX_STOCK = 100_000;

const HEADERS = ['SKU', 'Kategori', 'Ürün', 'Seçenek', 'Fiyat (TL)', 'İndirimsiz Fiyat (TL)', 'Stok', 'Durum'] as const;

/** 15050 → "150,50" (Türkçe Excel ondalık virgülü). */
export function centsToTl(cents: number): string {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}

/**
 * "150,50" / "150.50" / "1.250,00" / "1,250.00" / "150" → kuruş. Boş → null.
 * Geçersiz → 'invalid'. Kuruşta 2 haneden fazla ondalık kabul edilmez.
 */
export function parseTl(input: string): number | null | 'invalid' {
  let s = input.trim().replace(/\s|₺|TL/gi, '');
  if (s === '') return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // İkisi de var: sondaki ondalık ayracıdır, diğeri binlik.
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma >= 0) {
    s = s.replace(',', '.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return 'invalid';
  const [whole = '0', frac = ''] = s.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

function csvCell(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Güncel varyant listesi → `;` ayraçlı CSV metni (BOM'u çağıran ekler). */
export function variantsToCsv(rows: VariantSnapshot[]): string {
  const lines = [HEADERS.join(';')];
  for (const r of rows) {
    lines.push(
      [
        r.sku,
        r.categoryName,
        r.productName,
        r.label,
        centsToTl(r.priceCents),
        r.compareAtCents != null ? centsToTl(r.compareAtCents) : '',
        String(r.stock),
        r.isActive ? 'Aktif' : 'Pasif'
      ]
        .map(csvCell)
        .join(';')
    );
  }
  return lines.join('\r\n') + '\r\n';
}

/** Bayt dizisini metne çevirir: önce UTF-8 (BOM'lu/BOM'suz), olmazsa Windows-1254. */
export function decodeCsvBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1254').decode(bytes);
  }
}

/** Tırnaklı alanları destekleyen basit CSV ayrıştırıcı. Ayraç başlık satırından bulunur. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = [';', ',', '\t'].map((d) => ({ d, n: firstLine.split(d).length - 1 }));
  const delimiter = counts.sort((a, b) => b.n - a.n)[0]?.d ?? ';';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // Tamamen boş satırlar (Excel'in sona eklediği) atılır.
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Başlık eşleştirme: büyük/küçük harf ve Türkçe karakter farkına duyarsız. */
function normalizeHeader(h: string): string {
  return h
    .toLocaleLowerCase('tr-TR')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function findColumn(headers: string[], ...candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const i = normalized.indexOf(c);
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Yüklenen CSV'yi veritabanındaki güncel değerlerle karşılaştırır. Yalnızca
 * DEĞİŞEN satırlar `changes`'e girer; hatalı satırlar `errors`'a (satır no 1'den,
 * başlık = 1. satır). Hata varsa uygulama yapılmamalı (önizlemede engellenir).
 */
export function buildBulkPreview(rows: string[][], current: Map<string, VariantSnapshot>): BulkPreview {
  const errors: BulkPreview['errors'] = [];
  const changes: BulkChange[] = [];
  let unchanged = 0;

  const [header, ...dataRows] = rows;
  if (!header) return { changes, errors: [{ line: 1, message: 'Dosya boş.' }], unchanged, totalRows: 0 };

  const skuCol = findColumn(header, 'sku');
  const priceCol = findColumn(header, 'fiyattl', 'fiyat');
  const compareCol = findColumn(header, 'indirimsizfiyattl', 'indirimsizfiyat');
  const stockCol = findColumn(header, 'stok');
  if (skuCol < 0 || priceCol < 0 || stockCol < 0) {
    errors.push({
      line: 1,
      message:
        'Başlık satırında "SKU", "Fiyat (TL)" ve "Stok" sütunları bulunamadı. Lütfen panelden indirdiğiniz dosyayı kullanın, başlıkları değiştirmeyin.'
    });
    return { changes, errors, unchanged, totalRows: dataRows.length };
  }
  if (dataRows.length > MAX_BULK_ROWS) {
    errors.push({ line: 1, message: `Dosyada en fazla ${MAX_BULK_ROWS} satır olabilir.` });
    return { changes, errors, unchanged, totalRows: dataRows.length };
  }

  const seen = new Set<string>();
  dataRows.forEach((cells, idx) => {
    const line = idx + 2;
    const sku = (cells[skuCol] ?? '').trim();
    if (!sku) {
      errors.push({ line, message: 'SKU boş.' });
      return;
    }
    if (seen.has(sku)) {
      errors.push({ line, message: `${sku}: aynı SKU dosyada birden fazla kez var.` });
      return;
    }
    seen.add(sku);

    const cur = current.get(sku);
    if (!cur) {
      errors.push({ line, message: `${sku}: bu SKU sistemde yok (yeni ürün bu ekrandan eklenemez).` });
      return;
    }
    const name = `${cur.productName} (${cur.label})`;

    const price = parseTl(cells[priceCol] ?? '');
    if (price === null || price === 'invalid' || price <= 0 || price > MAX_PRICE_CENTS) {
      errors.push({ line, message: `${name}: fiyat geçersiz ("${(cells[priceCol] ?? '').trim()}").` });
      return;
    }

    let compareAt: number | null = null;
    if (compareCol >= 0) {
      const c = parseTl(cells[compareCol] ?? '');
      if (c === 'invalid' || (c !== null && c > MAX_PRICE_CENTS)) {
        errors.push({ line, message: `${name}: indirimsiz fiyat geçersiz ("${(cells[compareCol] ?? '').trim()}").` });
        return;
      }
      if (c !== null && c <= price) {
        errors.push({ line, message: `${name}: indirimsiz fiyat, satış fiyatından büyük olmalı (ya da boş bırakın).` });
        return;
      }
      compareAt = c;
    } else {
      compareAt = cur.compareAtCents; // sütun yoksa indirim olduğu gibi kalır
    }

    const stockRaw = (cells[stockCol] ?? '').trim();
    if (!/^\d+$/.test(stockRaw) || Number(stockRaw) > MAX_STOCK) {
      errors.push({ line, message: `${name}: stok 0 veya pozitif tam sayı olmalı ("${stockRaw}").` });
      return;
    }
    const stock = Number(stockRaw);

    if (price === cur.priceCents && compareAt === cur.compareAtCents && stock === cur.stock) {
      unchanged++;
      return;
    }
    changes.push({
      sku,
      productName: cur.productName,
      label: cur.label,
      old: { priceCents: cur.priceCents, compareAtCents: cur.compareAtCents, stock: cur.stock },
      next: { priceCents: price, compareAtCents: compareAt, stock }
    });
  });

  return { changes, errors, unchanged, totalRows: dataRows.length };
}
