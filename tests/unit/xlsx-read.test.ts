import { describe, expect, it } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { readXlsxRows } from '@/lib/xlsx-read';

/** Testler için en küçük geçerli zip (deflate ile sıkıştırılmış dosyalar). */
function makeZip(files: Record<string, string>): Uint8Array {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBuf = Buffer.from(name, 'utf8');
    const data = deflateRawSync(Buffer.from(content, 'utf8'));
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(Buffer.byteLength(content), 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(Buffer.byteLength(content), 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(Object.keys(files).length, 8);
  eocd.writeUInt16LE(Object.keys(files).length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, centralBuf, eocd]));
}

describe('readXlsxRows', () => {
  it('paylaşılan metinleri, sayıları ve boş hücreleri doğru okur', () => {
    const shared =
      '<sst><si><t>Urun</t></si><si><t>Stok</t></si><si><t>Fiyat</t></si><si><r><t>biberiye </t></r><r><t>yağı &amp; co</t></r></si></sst>';
    const sheet =
      '<worksheet><sheetData>' +
      '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>' +
      '<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>100</v></c><c r="C2"><v>149.99999999999997</v></c></row>' +
      '<row r="3"><c r="A3" t="inlineStr"><is><t>hint yağı</t></is></c><c r="C3"><v>12.5</v></c></row>' +
      '<row r="4"></row>' +
      '</sheetData></worksheet>';
    const rows = readXlsxRows(makeZip({ 'xl/sharedStrings.xml': shared, 'xl/worksheets/sheet1.xml': sheet }));
    expect(rows).toEqual([
      ['Urun', 'Stok', 'Fiyat'],
      ['biberiye yağı & co', '100', '150'],
      ['hint yağı', '', '12.5']
    ]);
  });

  it('zip olmayan dosyada hata verir', () => {
    expect(() => readXlsxRows(new TextEncoder().encode('Urun;Stok\nkekik;3'))).toThrow();
  });
});
