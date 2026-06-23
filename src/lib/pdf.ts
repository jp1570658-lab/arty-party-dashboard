import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";

export const BRAND = rgb(0.486, 0.227, 0.929); // #7C3AED
const INK = rgb(0.07, 0.09, 0.15);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.9, 0.91, 0.93);

const MARGIN = 50;
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;

/** Standard (WinAnsi) fonts can't encode arbitrary Unicode — normalise and
 *  strip anything outside the Latin-1 range so user content never crashes. */
export function winAnsi(s: string): string {
  return (s ?? "")
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•‣◦⁃↳]/g, "-")
    .replace(/[^\x00-\xFF]/g, "");
}

/** A simple top-down text/flow layout helper over pdf-lib. */
export class PdfBuilder {
  doc!: PDFDocument;
  font!: PDFFont;
  bold!: PDFFont;
  page!: PDFPage;
  y = PAGE_H - MARGIN;

  static async create() {
    const b = new PdfBuilder();
    b.doc = await PDFDocument.create();
    b.font = await b.doc.embedFont(StandardFonts.Helvetica);
    b.bold = await b.doc.embedFont(StandardFonts.HelveticaBold);
    b.newPage();
    return b;
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensure(space: number) {
    if (this.y - space < MARGIN) this.newPage();
  }

  brandHeader(label = "ARTY-PARTY") {
    this.page.drawText(label, {
      x: MARGIN,
      y: this.y,
      size: 11,
      font: this.bold,
      color: BRAND,
    });
    this.y -= 6;
    this.rule();
    this.y -= 14;
  }

  title(text: string) {
    text = winAnsi(text);
    this.ensure(30);
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size: 20,
      font: this.bold,
      color: INK,
    });
    this.y -= 26;
  }

  subtitle(text: string) {
    text = winAnsi(text);
    this.ensure(18);
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size: 11,
      font: this.font,
      color: MUTED,
    });
    this.y -= 20;
  }

  heading(text: string) {
    text = winAnsi(text);
    this.ensure(26);
    this.y -= 6;
    this.page.drawText(text.toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 11,
      font: this.bold,
      color: BRAND,
    });
    this.y -= 16;
  }

  /** Wrapped paragraph text. */
  paragraph(text: string, size = 10, color = INK) {
    const maxWidth = PAGE_W - MARGIN * 2;
    const words = winAnsi(text).split(/\s+/);
    let line = "";
    const flush = () => {
      this.ensure(size + 4);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color });
      this.y -= size + 4;
      line = "";
    };
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (this.font.widthOfTextAtSize(test, size) > maxWidth) flush();
      line = line ? `${line} ${w}` : w;
    }
    if (line) flush();
  }

  /** A row of columns at fixed x offsets. */
  row(cols: { text: string; x: number; bold?: boolean; color?: typeof INK }[], size = 10) {
    this.ensure(size + 6);
    for (const c of cols) {
      this.page.drawText(winAnsi(c.text), {
        x: MARGIN + c.x,
        y: this.y,
        size,
        font: c.bold ? this.bold : this.font,
        color: c.color ?? INK,
      });
    }
    this.y -= size + 6;
  }

  rule() {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 1,
      color: LINE,
    });
  }

  space(n = 8) {
    this.y -= n;
  }

  async toBytes() {
    return this.doc.save();
  }
}

export const PAGE = { W: PAGE_W, H: PAGE_H, MARGIN };
