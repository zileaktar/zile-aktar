import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { formatDateTimeTR } from '@/lib/format';

/*
 * Sunucu tarafında PDF üretimi için küçük bir yardımcı.
 *
 * pdf-lib saf JavaScript'tir (tarayıcı/Chromium gerektirmez) — Vercel
 * fonksiyonlarında sorunsuz çalışır. PDF'in standart fontları (Helvetica vb.)
 * Türkçe karakterleri (ğ ş ı İ) ve ₺ işaretini İÇERMEDİĞİ için Inter fontu
 * (SIL Open Font License, bkz. src/assets/fonts/OFL-LICENSE.txt) dosyaya gömülür.
 * Fontlar `next.config.mjs` → `outputFileTracingIncludes` ile fonksiyon
 * paketine dahil edilir; aksi halde canlıda dosya bulunamaz.
 */

const FONT_DIR = path.join(process.cwd(), 'src', 'assets', 'fonts');

let fontBytesPromise: Promise<[Buffer, Buffer]> | null = null;

function loadFontBytes() {
  // Aynı sunucu örneğinde tekrar tekrar diskten okumamak için önbellek.
  fontBytesPromise ??= Promise.all([
    readFile(path.join(FONT_DIR, 'Inter-Regular.ttf')),
    readFile(path.join(FONT_DIR, 'Inter-Bold.ttf'))
  ]).catch((err) => {
    fontBytesPromise = null;
    throw err;
  });
  return fontBytesPromise;
}

// A4, pt cinsinden.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 40;
const MARGIN_TOP = 48;
const MARGIN_BOTTOM = 56;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

export const COLORS = {
  primary: rgb(0.2, 0.33, 0.2),
  text: rgb(0.13, 0.13, 0.13),
  muted: rgb(0.45, 0.45, 0.45),
  line: rgb(0.85, 0.85, 0.82),
  zebra: rgb(0.97, 0.965, 0.945),
  headerBg: rgb(0.2, 0.33, 0.2),
  sectionBg: rgb(0.91, 0.93, 0.89),
  white: rgb(1, 1, 1),
  red: rgb(0.7, 0.15, 0.15)
};

export interface TextOptions {
  size?: number;
  bold?: boolean;
  color?: RGB;
  /** Sol kenar boşluğundan itibaren ek girinti (pt). */
  indent?: number;
  maxWidth?: number;
  lineGap?: number;
}

export interface TableColumn {
  header: string;
  /** İçerik genişliğine oranla (tüm sütunların toplamı 1 olmalı). */
  width: number;
  align?: 'left' | 'right';
}

/** Tablo satırı: normal hücreler veya tam genişlikte bir ara başlık (ör. "Eylül 2026"). */
export type TableRow = { cells: string[]; bold?: boolean } | { section: string };

/**
 * Yazdırılamayan karakterleri temizler. Müşterinin girdiği adres vb. metinlerde
 * satır sonu/sekme olabilir; pdf-lib tek satırlık drawText'te bunları kabul etmez.
 */
function clean(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export class PdfBuilder {
  private page!: PDFPage;
  private y = 0;

  private constructor(
    private readonly doc: PDFDocument,
    private readonly regular: PDFFont,
    private readonly bold: PDFFont,
    private readonly footerLabel: string
  ) {
    this.addPage();
  }

  static async create(title: string, footerLabel: string): Promise<PdfBuilder> {
    const [regularBytes, boldBytes] = await loadFontBytes();
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    // subset: yalnız kullanılan harfler gömülür → dosya boyutu küçük kalır.
    const regular = await doc.embedFont(regularBytes, { subset: true });
    const bold = await doc.embedFont(boldBytes, { subset: true });
    doc.setTitle(title);
    doc.setAuthor('Zile Aktar');
    doc.setCreator('Zile Aktar Yönetim Paneli');
    doc.setCreationDate(new Date());
    return new PdfBuilder(doc, regular, bold, footerLabel);
  }

  private addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN_TOP;
  }

  /** `height` kadar yer kalmadıysa yeni sayfaya geçer. Yeni sayfa açıldıysa true döner. */
  ensureSpace(height: number): boolean {
    if (this.y - height < MARGIN_BOTTOM) {
      this.addPage();
      return true;
    }
    return false;
  }

  private font(bold?: boolean) {
    return bold ? this.bold : this.regular;
  }

  width(text: string, size: number, bold?: boolean): number {
    return this.font(bold).widthOfTextAtSize(text, size);
  }

  /** Metni verilen genişliğe sığacak satırlara böler (çok uzun kelimeleri harf harf böler). */
  wrap(text: string, size: number, maxWidth: number, bold?: boolean): string[] {
    const words = clean(text).split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (this.width(candidate, size, bold) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      // Tek başına sığmayan kelime (uzun e-posta, takip no vb.) → parçala.
      let rest = word;
      while (this.width(rest, size, bold) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && this.width(rest.slice(0, cut), size, bold) > maxWidth) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      current = rest;
    }
    if (current || lines.length === 0) lines.push(current);
    return lines;
  }

  /** Yalnız ilk satır (tablo başlıkları gibi tek satırlık alanlar için). */
  private firstLine(text: string, size: number, maxWidth: number, bold?: boolean): string {
    return this.wrap(text, size, maxWidth, bold)[0] ?? '';
  }

  text(value: string, opts: TextOptions = {}) {
    const size = opts.size ?? 10;
    const indent = opts.indent ?? 0;
    const maxWidth = opts.maxWidth ?? CONTENT_WIDTH - indent;
    const lineHeight = size * 1.35;
    for (const line of this.wrap(value, size, maxWidth, opts.bold)) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, {
        x: MARGIN_X + indent,
        y: this.y - size,
        size,
        font: this.font(opts.bold),
        color: opts.color ?? COLORS.text
      });
      this.y -= lineHeight;
    }
    this.y -= opts.lineGap ?? 0;
  }

  space(height: number) {
    this.y -= height;
  }

  divider() {
    this.ensureSpace(10);
    this.y -= 4;
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN_X, y: this.y },
      thickness: 0.6,
      color: COLORS.line
    });
    this.y -= 8;
  }

  /** Bölüm başlığı — başlık sayfanın en altında yalnız kalmasın diye biraz yer ayırır. */
  heading(value: string) {
    this.ensureSpace(48);
    this.space(6);
    this.text(value, { size: 12, bold: true, color: COLORS.primary, lineGap: 3 });
  }

  /** "Etiket: değer" satırları, iki sütun hizalı. */
  keyValues(pairs: Array<[string, string]>, labelWidth = 130) {
    const size = 9.5;
    const lineHeight = size * 1.4;
    for (const [label, value] of pairs) {
      const lines = this.wrap(value || '—', size, CONTENT_WIDTH - labelWidth);
      this.ensureSpace(lineHeight * Math.min(lines.length, 3));
      this.page.drawText(clean(label), {
        x: MARGIN_X,
        y: this.y - size,
        size,
        font: this.bold,
        color: COLORS.muted
      });
      lines.forEach((line, i) => {
        if (i > 0) this.ensureSpace(lineHeight);
        this.page.drawText(line, {
          x: MARGIN_X + labelWidth,
          y: this.y - size,
          size,
          font: this.regular,
          color: COLORS.text
        });
        this.y -= lineHeight;
      });
    }
  }

  /** Sağa yaslı toplam satırları (Ara toplam, Kargo, Genel toplam ...). */
  totals(rows: Array<{ label: string; value: string; bold?: boolean; color?: RGB }>) {
    const right = PAGE_WIDTH - MARGIN_X;
    for (const row of rows) {
      const size = row.bold ? 11 : 9.5;
      this.ensureSpace(size * 1.6);
      const font = this.font(row.bold);
      const color = row.color ?? (row.bold ? COLORS.primary : COLORS.text);
      const valueWidth = font.widthOfTextAtSize(row.value, size);
      this.page.drawText(row.value, { x: right - valueWidth, y: this.y - size, size, font, color });
      const label = clean(row.label);
      const labelWidth = font.widthOfTextAtSize(label, size);
      this.page.drawText(label, { x: right - 110 - labelWidth, y: this.y - size, size, font, color });
      this.y -= size * 1.6;
    }
  }

  table(columns: TableColumn[], rows: TableRow[]) {
    const size = 8.5;
    const lineHeight = size * 1.3;
    const padX = 4;
    const padY = 4;
    const cols = columns.map((c) => ({ ...c, px: c.width * CONTENT_WIDTH }));

    const drawHeader = () => {
      const height = lineHeight + padY * 2;
      this.ensureSpace(height + lineHeight + padY * 2);
      this.page.drawRectangle({ x: MARGIN_X, y: this.y - height, width: CONTENT_WIDTH, height, color: COLORS.headerBg });
      let x = MARGIN_X;
      for (const col of cols) {
        const label = this.firstLine(col.header, size, col.px - padX * 2, true);
        const w = this.width(label, size, true);
        const tx = col.align === 'right' ? x + col.px - padX - w : x + padX;
        this.page.drawText(label, { x: tx, y: this.y - padY - size, size, font: this.bold, color: COLORS.white });
        x += col.px;
      }
      this.y -= height;
    };

    drawHeader();
    let zebra = false;
    for (const row of rows) {
      if ('section' in row) {
        const height = lineHeight + padY * 2;
        // Ara başlık, altında en az bir satır sığmıyorsa yeni sayfaya taşınır.
        if (this.ensureSpace(height * 2)) drawHeader();
        this.page.drawRectangle({ x: MARGIN_X, y: this.y - height, width: CONTENT_WIDTH, height, color: COLORS.sectionBg });
        this.page.drawText(this.firstLine(row.section, size, CONTENT_WIDTH - padX * 2, true), {
          x: MARGIN_X + padX,
          y: this.y - padY - size,
          size,
          font: this.bold,
          color: COLORS.primary
        });
        this.y -= height;
        zebra = false;
        continue;
      }

      const cells = cols.map((col, i) => ({
        col,
        lines: this.wrap(row.cells[i] ?? '', size, col.px - padX * 2, row.bold)
      }));
      const height = Math.max(...cells.map((c) => c.lines.length)) * lineHeight + padY * 2;
      if (this.ensureSpace(height)) drawHeader();
      if (zebra) {
        this.page.drawRectangle({ x: MARGIN_X, y: this.y - height, width: CONTENT_WIDTH, height, color: COLORS.zebra });
      }
      zebra = !zebra;
      let x = MARGIN_X;
      for (const { col, lines } of cells) {
        lines.forEach((line, li) => {
          const w = this.width(line, size, row.bold);
          const tx = col.align === 'right' ? x + col.px - padX - w : x + padX;
          this.page.drawText(line, {
            x: tx,
            y: this.y - padY - size - li * lineHeight,
            size,
            font: this.font(row.bold),
            color: COLORS.text
          });
        });
        x += col.px;
      }
      this.y -= height;
    }
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN_X, y: this.y },
      thickness: 0.6,
      color: COLORS.line
    });
    this.space(6);
  }

  /** Her sayfanın altına "oluşturulma zamanı" + "Sayfa X / Y" yazar ve PDF baytlarını döndürür. */
  async finish(): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    const stamp = `${this.footerLabel} · Oluşturulma: ${formatDateTimeTR(new Date())}`;
    pages.forEach((page, i) => {
      const size = 7.5;
      page.drawLine({
        start: { x: MARGIN_X, y: MARGIN_BOTTOM - 18 },
        end: { x: PAGE_WIDTH - MARGIN_X, y: MARGIN_BOTTOM - 18 },
        thickness: 0.5,
        color: COLORS.line
      });
      page.drawText(stamp, { x: MARGIN_X, y: MARGIN_BOTTOM - 30, size, font: this.regular, color: COLORS.muted });
      const label = `Sayfa ${i + 1} / ${pages.length}`;
      const w = this.regular.widthOfTextAtSize(label, size);
      page.drawText(label, {
        x: PAGE_WIDTH - MARGIN_X - w,
        y: MARGIN_BOTTOM - 30,
        size,
        font: this.regular,
        color: COLORS.muted
      });
    });
    return this.doc.save();
  }
}

/** HTTP yanıtı: indirilecek PDF. Kişisel veri içerebildiği için hiçbir yerde önbelleğe alınmaz. */
export function pdfResponse(bytes: Uint8Array, fileName: string): Response {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, '-');
  // new Uint8Array(...): TS 5.9 DOM tipleri ArrayBuffer tabanlı bir görünüm ister.
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
