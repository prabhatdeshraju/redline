/* The PDF adapter: pdf.js in, positioned text items out.
 *
 * Nothing here knows anything about sentences. Its only jobs are to get the
 * glyph positions out of pdf.js and to notice a page that is a photograph of a
 * page rather than a page.
 *
 * It runs in the reader's browser. The file is handed to pdf.js as bytes that
 * came out of a File the reader chose; it is never sent anywhere.
 */

import type { ParsedPage, PositionedTextItem } from "./text-recovery";

export type ParsedPdf = {
  readonly pages: readonly ParsedPage[];
  /** Pages that paint an image and show no text: the shape a scan has. */
  readonly imageOnlyPages: readonly number[];
};

/* The pdf.js worker runs the parse off the main thread so a long document does
   not freeze the page. The file is copied into public/pdfjs/ from the installed
   pdfjs-dist; see public/pdfjs/README.md. In Node — which is where the suite
   runs — pdf.js disables the worker itself and loads it in-process, so this is
   set only in a browser. */
const WORKER_URL = "/pdfjs/pdf.worker.min.mjs";

/* The legacy build, in the browser as well as in the suite.
 *
 * pdf.js's default build uses `Uint8Array.prototype.toHex`, which is newer than
 * the runtimes this has to work on — Node 24 does not have it, and neither do
 * released Safari or Firefox. The legacy build is the same parser without those
 * assumptions. Picking it per environment would mean the suite exercised a
 * different build than the one that ships, which for the module that owns
 * ADR 0001's guarantee is not a trade worth making. One build everywhere.
 */
type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let loaded: Promise<PdfJs> | null = null;

/** Load pdf.js once. The import is dynamic so that a reader who pastes text or
 *  brings a DOCX never downloads a PDF parser. */
function loadPdfJs(): Promise<PdfJs> {
  loaded ??= (async () => {
    const pdfjs: PdfJs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;
    }
    return pdfjs;
  })();
  return loaded;
}

/** True when a page's operator list paints an image. */
function paintsAnImage(fnArray: ArrayLike<number>, ops: PdfJs["OPS"]): boolean {
  const painting = new Set<number>([
    ops.paintImageXObject,
    ops.paintImageXObjectRepeat,
    ops.paintInlineImageXObject,
    ops.paintInlineImageXObjectGroup,
    ops.paintImageMaskXObject,
    ops.paintImageMaskXObjectRepeat,
    ops.paintImageMaskXObjectGroup,
    ops.paintSolidColorImageMask,
  ]);
  for (let index = 0; index < fnArray.length; index += 1) {
    if (painting.has(fnArray[index])) return true;
  }
  return false;
}

/** Read a PDF's text layer.
 *
 * `disableNormalization` is deliberately on. pdf.js will otherwise apply its own
 * NFKC pass over a long list of characters, which happens to decompose the
 * ligatures we want decomposed — and also folds several things we have decided
 * not to fold. One documented normalisation rule is worth more than two
 * overlapping ones, so `lib/extraction/normalise.ts` owns the whole of it and
 * this asks pdf.js for the characters the file actually contains.
 */
export async function parsePdf(bytes: Uint8Array): Promise<ParsedPdf> {
  const pdfjs = await loadPdfJs();

  /* The loading task, not just the document: it is what owns the worker, and
     closing it is what releases the reader's file from memory. */
  const loading = pdfjs.getDocument({
    data: bytes,
    /* No font is fetched from the operating system or from anywhere else: this
       parse reads glyph positions and touches the network for nothing. */
    useSystemFonts: false,
  });
  const pdf = await loading.promise;

  try {
    const pages: ParsedPage[] = [];
    const imageOnlyPages: number[] = [];

    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent({ disableNormalization: true });

      const items: PositionedTextItem[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        if (item.str.length === 0) continue;
        items.push({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          /* The vertical scale of the text matrix is the rendered type size.
             `height` is zero on a run that is only a space. */
          fontSize: Math.abs(item.transform[3]) || item.height || 1,
        });
      }

      if (items.every((item) => item.text.trim().length === 0)) {
        const { fnArray } = await page.getOperatorList();
        if (paintsAnImage(fnArray, pdfjs.OPS)) imageOnlyPages.push(number);
      }

      pages.push({
        pageNumber: number,
        width: viewport.width,
        height: viewport.height,
        items,
      });

      page.cleanup();
    }

    return { pages, imageOnlyPages };
  } finally {
    await loading.destroy();
  }
}
