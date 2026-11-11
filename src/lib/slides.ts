import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { slideSvg, type Slide, type SlideLook } from "./formatRules";

// Slides drawn on the server (resvg is a native module, so this never reaches the browser): SVG (formatRules.ts) to PNG with resvg, then a PDF for a LinkedIn carousel or JPEG
// pictures for a TikTok slideshow. Inter is served from public/fonts, which the Docker image copies.

const fontFiles = () => ["Inter-400.ttf", "Inter-700.ttf"].map((f) => join(process.cwd(), "public", "fonts", f));
let fontsChecked = false;

function png(svg: string): Buffer {
  const files = fontFiles();
  if (!fontsChecked) {
    for (const f of files) readFileSync(f); // fails loudly if the image left the fonts out
    fontsChecked = true;
  }
  return new Resvg(svg, { font: { fontFiles: files, loadSystemFonts: false, defaultFontFamily: "Inter" } }).render().asPng();
}

/** A PDF with one page per slide, at the slides' own size. */
export async function slidesPdf(slides: Slide[], look: SlideLook): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  for (const [i, s] of slides.entries()) {
    const img = await pdf.embedPng(png(slideSvg(s, i + 1, slides.length, look)));
    // 72 points per inch at 150 dpi keeps the page a sensible paper size.
    const w = (look.width * 72) / 150;
    const h = (look.height * 72) / 150;
    pdf.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h });
  }
  pdf.setTitle(slides[0]?.title || look.brand);
  return Buffer.from(await pdf.save());
}

/** One JPEG per slide (TikTok photo posts take JPG or WebP). */
export async function slidesJpeg(slides: Slide[], look: SlideLook): Promise<Buffer[]> {
  return Promise.all(slides.map((s, i) => sharp(png(slideSvg(s, i + 1, slides.length, look))).jpeg({ quality: 90 }).toBuffer()));
}
