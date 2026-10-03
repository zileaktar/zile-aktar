import { inflateRawSync } from 'node:zlib';

/*
 * Minimal .xlsx okuyucu — toplu fiyat/stok güncellemesi için İLK çalışma
 * sayfasının hücre DEĞERLERİNİ satır satır döndürür (biçim, formül, tarih yok).
 *
 * Neden kütüphane değil: npm'deki "xlsx" (SheetJS) paketinin npm sürümü bilinen
 * güvenlik açıkları taşıyor (prototip kirletme / ReDoS) ve güncellemeleri npm'e
 * yayınlanmıyor; ihtiyacımız da yalnızca düz bir tabloyu okumak.
 *
 * Güvenlik: dosya boyutu çağıranda 1 MB ile sınırlı; açılan her parça en fazla
 * 5 MB'a kadar açılır (zip bombasına karşı); yalnız ihtiyaç duyulan iki XML
 * parçası okunur; XML regex ile ayrıştırılır (harici varlık / DTD işlenmez).
 */

// Açılmış XML üst sınırı: 5000 satırlık bir tablo ~1–2 MB tutar; daha büyüğü hem
// zip bombası hem de regex ayrıştırmasını yavaşlatma (DoS) riskidir.
const MAX_INFLATED_BYTES = 5 * 1024 * 1024;

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function readZipEntries(buf: Buffer): Map<string, ZipEntry> {
  // Merkezi dizinin sonu (EOCD) kaydını sondan geriye doğru ara.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('xlsx: zip yapısı bulunamadı');
  const count = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);

  const entries = new Map<string, ZipEntry>();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error('xlsx: bozuk merkezi dizin');
    const method = buf.readUInt16LE(ptr + 10);
    const compressedSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localHeaderOffset = buf.readUInt32LE(ptr + 42);
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen);
    entries.set(name, { name, method, compressedSize, localHeaderOffset });
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readZipFile(buf: Buffer, entry: ZipEntry): string {
  const p = entry.localHeaderOffset;
  if (buf.readUInt32LE(p) !== 0x04034b50) throw new Error('xlsx: bozuk dosya başlığı');
  const start = p + 30 + buf.readUInt16LE(p + 26) + buf.readUInt16LE(p + 28);
  const data = buf.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return data.toString('utf8');
  if (entry.method === 8) return inflateRawSync(data, { maxOutputLength: MAX_INFLATED_BYTES }).toString('utf8');
  throw new Error('xlsx: desteklenmeyen sıkıştırma');
}

function decodeXml(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** <si> içindeki tüm <t> parçalarını birleştirir (zengin metin "run"ları dahil). */
function textOf(xml: string): string {
  let out = '';
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += decodeXml(m[1] ?? '');
  return out;
}

/** "AB" → 27 (0 tabanlı sütun indeksi). */
function columnIndex(ref: string): number {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** Sayısal hücre: tam sayı olduğu gibi; ondalıkta kayan nokta gürültüsü 2 haneye yuvarlanır. */
function numberText(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** .xlsx baytları → ilk çalışma sayfasının satırları (boş satırlar atılır). */
export function readXlsxRows(bytes: Uint8Array): string[][] {
  const buf = Buffer.from(bytes);
  const entries = readZipEntries(buf);

  const sheetName =
    entries.has('xl/worksheets/sheet1.xml')
      ? 'xl/worksheets/sheet1.xml'
      : [...entries.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
  const sheetEntry = sheetName ? entries.get(sheetName) : undefined;
  if (!sheetEntry) throw new Error('xlsx: çalışma sayfası bulunamadı');

  const sharedEntry = entries.get('xl/sharedStrings.xml');
  const shared = sharedEntry
    ? [...readZipFile(buf, sharedEntry).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1] ?? ''))
    : [];

  const sheetXml = readZipFile(buf, sheetEntry);
  const rows: string[][] = [];
  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cell of (rowMatch[1] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cell[1] ?? '';
      const body = cell[2] ?? '';
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? 'n';
      const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let value = '';
      if (type === 's') value = shared[Number(raw)] ?? '';
      else if (type === 'inlineStr') value = textOf(body);
      else if (type === 'str' || type === 'e') value = decodeXml(raw ?? '');
      else if (type === 'b') value = raw === '1' ? 'TRUE' : 'FALSE';
      else value = raw != null ? numberText(raw) : '';
      const col = ref ? columnIndex(ref) : row.length;
      while (row.length < col) row.push('');
      row[col] = value;
    }
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}
