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
  /** Uygulamayı ENGELLER (dosya düzeltilip yeniden yüklenmeli). */
  errors: Array<{ line: number; message: string }>;
  /** Bilgi amaçlı, engellemez (ör. sitede olmayan ürün atlandı, indirim kaldırılacak). */
  warnings: Array<{ line: number; message: string }>;
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

/**
 * Metin hücresi için formül enjeksiyonu koruması: "=", "+", "-", "@" (ve sekme/satır
 * başı) ile başlayan değer Excel'de FORMÜL olarak çalışabilir (ör. bir ürün adı
 * `=HYPERLINK(...)`). Başına ' eklenir → Excel metin olarak gösterir. Yalnızca
 * bilgi sütunlarına (kategori/ürün/seçenek) uygulanır; SKU ve sayılar dokunulmaz.
 */
function textCell(value: string): string {
  return csvCell(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);
}

/** Güncel varyant listesi → `;` ayraçlı CSV metni (BOM'u çağıran ekler). */
export function variantsToCsv(rows: VariantSnapshot[]): string {
  const lines = [HEADERS.join(';')];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.sku),
        textCell(r.categoryName),
        textCell(r.productName),
        textCell(r.label),
        centsToTl(r.priceCents),
        r.compareAtCents != null ? centsToTl(r.compareAtCents) : '',
        String(r.stock),
        r.isActive ? 'Aktif' : 'Pasif'
      ].join(';')
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

/** Ürün adı eşleştirme anahtarı: "biberiye yağı" = "Biberiye Yağı" = "BİBERİYE YAĞI". */
export function productNameKey(name: string): string {
  return normalizeHeader(name.replace(/İ/g, 'i'));
}

const UNIT_ALIASES: Record<string, string> = {
  g: 'g', gr: 'g', gram: 'g', gramg: 'g',
  kg: 'kg', kilogram: 'kg', kilogramkg: 'kg',
  ml: 'ml', mililitre: 'ml', mililitreml: 'ml',
  l: 'l', lt: 'l', litre: 'l', litrelt: 'l',
  adet: 'adet', paket: 'paket', kutu: 'kutu', demet: 'demet'
};

/** "20 ml" / ("20", "Mililitre (ml)") → "20ml"; tanınmayan birimde null. */
function labelKey(amount: string, unit: string): string | null {
  const n = Number(amount.replace(',', '.').trim());
  const u = UNIT_ALIASES[normalizeHeader(unit)];
  if (!Number.isFinite(n) || n <= 0 || !u) return null;
  return `${n}${u}`;
}

function siteLabelKey(label: string): string | null {
  const m = /^\s*([\d.,]+)\s*(.+?)\s*$/.exec(label);
  return m ? labelKey(m[1] ?? '', m[2] ?? '') : null;
}

type RowTarget = { cur: VariantSnapshot } | { error: string } | { warning: string };

/**
 * Yüklenen dosyayı (CSV/XLSX satırları) veritabanındaki güncel değerlerle
 * karşılaştırır. İki dosya biçimi tanınır:
 *  1. Panelden indirilen liste — "SKU" sütunu var; eşleşme SKU ile, "İndirimsiz
 *     Fiyat" sütunu da güncellenir. Bilinmeyen SKU HATADIR.
 *  2. Mağazanın Stok Tablosu aracının "Dışa Aktar" dosyası — "Urun", "Stok",
 *     "Fiyat" (+ "Miktar", "Birim") sütunları; eşleşme ÜRÜN ADIYLA (siteye bu
 *     tablodan aktarıldı: "biberiye yağı" → "Biberiye Yağı"). Sitede olmayan ürün
 *     UYARIDIR (atlanır, engellemez). İndirim sütunu yoktur: yeni fiyat mevcut
 *     indirimsiz fiyata ulaşırsa indirim kaldırılır (önizlemede görünür).
 * Yalnızca DEĞİŞEN satırlar `changes`'e girer. `errors` varsa uygulama engellenir;
 * `warnings` bilgi amaçlıdır. Satır no 1'den (başlık = 1. satır).
 */
export function buildBulkPreview(rows: string[][], current: Map<string, VariantSnapshot>): BulkPreview {
  const errors: BulkPreview['errors'] = [];
  const warnings: BulkPreview['warnings'] = [];
  const changes: BulkChange[] = [];
  let unchanged = 0;

  const [header, ...dataRows] = rows;
  const result = () => ({ changes, errors, warnings, unchanged, totalRows: dataRows.length });
  if (!header) return { ...result(), errors: [{ line: 1, message: 'Dosya boş.' }] };

  const skuCol = findColumn(header, 'sku');
  const nameCol = findColumn(header, 'urun', 'urunadi');
  const amountCol = findColumn(header, 'miktar');
  const unitCol = findColumn(header, 'birim');
  const priceCol = findColumn(header, 'fiyattl', 'fiyat');
  const compareCol = findColumn(header, 'indirimsizfiyattl', 'indirimsizfiyat');
  const stockCol = findColumn(header, 'stok');
  const mode: 'sku' | 'name' | null = skuCol >= 0 ? 'sku' : nameCol >= 0 ? 'name' : null;

  if (!mode || priceCol < 0 || stockCol < 0) {
    errors.push({
      line: 1,
      message:
        'Dosya tanınmadı: başlık satırında "SKU" (panelden indirilen liste) ya da "Urun" (Stok Tablosu aracı) ile birlikte "Fiyat" ve "Stok" sütunları olmalı. Başlıkları değiştirmeyin.'
    });
    return result();
  }
  if (dataRows.length > MAX_BULK_ROWS) {
    errors.push({ line: 1, message: `Dosyada en fazla ${MAX_BULK_ROWS} satır olabilir.` });
    return result();
  }

  // Ad → varyantlar (yalnız "ad" biçimi için).
  const byName = new Map<string, VariantSnapshot[]>();
  if (mode === 'name') {
    for (const v of current.values()) {
      const key = productNameKey(v.productName);
      byName.set(key, [...(byName.get(key) ?? []), v]);
    }
  }

  const resolve = (cells: string[]): RowTarget | null => {
    if (mode === 'sku') {
      const sku = (cells[skuCol] ?? '').trim();
      if (!sku) return { error: 'SKU boş.' };
      const cur = current.get(sku);
      return cur ? { cur } : { error: `${sku}: bu SKU sistemde yok (yeni ürün bu ekrandan eklenemez).` };
    }
    const rawName = (cells[nameCol] ?? '').trim();
    if (!rawName) return null; // araçtaki boş satırlar sessizce atlanır
    const candidates = byName.get(productNameKey(rawName)) ?? [];
    if (candidates.length === 0) {
      return { warning: `"${rawName}" sitede yok — atlandı (yeni ürünü panelden "Yeni Ürün Ekle" ile ekleyin).` };
    }
    const fileKey = amountCol >= 0 && unitCol >= 0 ? labelKey(cells[amountCol] ?? '', cells[unitCol] ?? '') : null;
    if (candidates.length === 1) return { cur: candidates[0]! };
    const match = fileKey ? candidates.filter((c) => siteLabelKey(c.label) === fileKey) : [];
    return match.length === 1
      ? { cur: match[0]! }
      : {
          warning: `"${rawName}" sitede birden fazla seçenekte (${candidates.map((c) => c.label).join(', ')}) — hangisi olduğu anlaşılamadı, atlandı. Panelden indirilen listeyle güncelleyin.`
        };
  };

  const seen = new Set<string>();
  dataRows.forEach((cells, idx) => {
    const line = idx + 2;
    const target = resolve(cells);
    if (!target) return;
    if ('error' in target) return void errors.push({ line, message: target.error });
    if ('warning' in target) return void warnings.push({ line, message: target.warning });
    const cur = target.cur;
    const name = `${cur.productName} (${cur.label})`;

    if (seen.has(cur.sku)) {
      errors.push({ line, message: `${name}: aynı ürün dosyada birden fazla kez var.` });
      return;
    }
    seen.add(cur.sku);

    const price = parseTl(cells[priceCol] ?? '');
    if (price === null || price === 'invalid' || price <= 0 || price > MAX_PRICE_CENTS) {
      errors.push({ line, message: `${name}: fiyat geçersiz ("${(cells[priceCol] ?? '').trim()}").` });
      return;
    }

    let compareAt: number | null;
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
      // Sütun yok (araç dosyası): indirim korunur — ama yeni fiyat indirimsiz fiyata
      // ulaştıysa "indirim" anlamsızdır (ve veritabanı kuralını bozar) → kaldırılır.
      compareAt = cur.compareAtCents != null && cur.compareAtCents > price ? cur.compareAtCents : null;
      if (cur.compareAtCents != null && compareAt === null) {
        warnings.push({ line, message: `${name}: yeni fiyat indirimsiz fiyata ulaştığı için indirim kaldırılacak.` });
      }
    }

    const stockRaw = (cells[stockCol] ?? '').trim();
    if (!/^\d+$/.test(stockRaw) || Number(stockRaw) > MAX_STOCK) {
      errors.push({ line, message: `${name}: stok 0 veya pozitif tam sayı olmalı ("${stockRaw}").` });
      return;
    }
    const stock = Number(stockRaw);

    if (mode === 'name' && amountCol >= 0 && unitCol >= 0) {
      const fileKey = labelKey(cells[amountCol] ?? '', cells[unitCol] ?? '');
      const siteKey = siteLabelKey(cur.label);
      if (fileKey && siteKey && fileKey !== siteKey) {
        warnings.push({
          line,
          message: `${name}: dosyadaki miktar (${(cells[amountCol] ?? '').trim()} ${(cells[unitCol] ?? '').trim()}) sitedekinden farklı — fiyat/stok güncellenir, gramaj etiketini ürün sayfasından düzeltin.`
        });
      }
    }

    if (price === cur.priceCents && compareAt === cur.compareAtCents && stock === cur.stock) {
      unchanged++;
      return;
    }
    changes.push({
      sku: cur.sku,
      productName: cur.productName,
      label: cur.label,
      old: { priceCents: cur.priceCents, compareAtCents: cur.compareAtCents, stock: cur.stock },
      next: { priceCents: price, compareAtCents: compareAt, stock }
    });
  });

  return result();
}
