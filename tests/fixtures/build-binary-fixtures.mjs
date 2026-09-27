/* How the binary fixtures in this folder were made.
 *
 * Run once, by hand, with:
 *
 *     node tests/fixtures/build-binary-fixtures.mjs
 *
 * The files it writes are committed; nothing in the suite runs this script, and
 * no dependency was added for it. It exists so the provenance of a binary
 * fixture is readable rather than magic: a PDF with a real text layer, a PDF
 * with none, and a DOCX, all carrying the same six source sentences as
 * `negotiable-flagged.json`, plus two further PDFs that stress extraction in the
 * two ways the first one does not — footnotes and a table.
 *
 * The PDF writer below is deliberately minimal — uncompressed content
 * streams, a plain cross-reference table, one Courier font. Courier is chosen
 * because every glyph advances exactly 0.6em, so a line's width is known from
 * its character count and the layout is exact.
 *
 * What each fixture is built to break:
 *
 *   negotiable-flagged.pdf
 *     - a running header on every page and a running footer carrying a page
 *       number, both of which interrupt sentences at a page boundary
 *     - one source sentence hyphenated at a line end
 *     - four source sentences carrying the ﬁ ligature (U+FB01) via an
 *       /Encoding /Differences entry mapping code 1 to the /fi glyph
 *     - clause 13.2's typographic apostrophe (U+2019) as WinAnsi 0x92
 *     - a two-column page whose right column is emitted to the content
 *       stream BEFORE its left column, and whose running header is emitted
 *       last, so correct reading order cannot come from stream order
 *     - a source sentence that starts in the last column of one page and
 *       finishes on the next
 *
 *   footnoted.pdf
 *     - superscript footnote markers set immediately after a sentence's full
 *       stop, in smaller type on a raised baseline, which land inside the body
 *       line a parser reports
 *     - a footnote block at the foot of each page, under a drawn rule, in
 *       smaller type: it sits between the last body line of one page and the
 *       first of the next, which is where a sentence continuing across a page
 *       would be spliced
 *     - one of its labelled clauses is in a footnote rather than in the body,
 *       so a clause hidden in the small print has to come back citable
 *
 *   tabular.pdf
 *     - a three-column table whose column gaps are wide enough to read as
 *       gutters, so the page's reading order is not simply top to bottom
 *     - a whole sentence inside one table cell, which has to survive as a
 *       sentence rather than being run together with its neighbours
 *     - prose above and below the table, which must not absorb a cell
 *
 *   scan-no-text-layer.pdf
 *     - two pages, each painting one image XObject and showing no text at
 *       all: the shape a scan has
 *
 *   negotiable-flagged.docx
 *     - the same six sentences as Word paragraphs, one of them carrying the
 *       ﬁ ligature and one the typographic apostrophe
 *
 * Each of the two new PDFs is written with a `.json` sidecar listing the
 * sentences that must survive extraction intact. The sidecars are generated from
 * the same constants the pages are drawn from, so a label cannot drift away from
 * the document it describes.
 */

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * A very small PDF writer
 * ------------------------------------------------------------------ */

/** WinAnsi byte for the few non-ASCII characters these fixtures use, plus
 *  code 1 for the /fi ligature installed through /Differences. */
const BYTE_FOR_CHARACTER = new Map([
  ["’", 0x92], // right single quotation mark — WinAnsi quoteright
  ["“", 0x93],
  ["”", 0x94],
  ["—", 0x97],
  ["ﬁ", 0x01], // ﬁ — mapped to /fi by the font's /Differences
]);

/** Encode one line as a PDF literal string, escaping what has to be and
 *  writing anything outside printable ASCII as an octal escape. */
function pdfString(text) {
  const out = [0x28];
  for (const character of text) {
    const mapped = BYTE_FOR_CHARACTER.get(character);
    const code = mapped ?? character.codePointAt(0);
    if (code === undefined || code > 0xff) {
      throw new Error(`no WinAnsi byte for ${JSON.stringify(character)}`);
    }
    if (code === 0x28 || code === 0x29 || code === 0x5c) {
      out.push(0x5c, code);
    } else if (code < 0x20 || code > 0x7e) {
      out.push(0x5c);
      for (const digit of code.toString(8).padStart(3, "0")) {
        out.push(digit.charCodeAt(0));
      }
    } else {
      out.push(code);
    }
  }
  out.push(0x29);
  return Buffer.from(out);
}

/** Assemble a PDF from a list of object bodies (1-indexed by position). */
function assemblePdf(objectBodies) {
  const chunks = [];
  let offset = 0;
  const push = (buffer) => {
    chunks.push(buffer);
    offset += buffer.length;
  };

  push(Buffer.from("%PDF-1.7\n%\xe2\xe3\xcf\xd3\n", "latin1"));

  const offsets = [];
  objectBodies.forEach((body, index) => {
    offsets.push(offset);
    push(Buffer.from(`${index + 1} 0 obj\n`, "latin1"));
    push(Buffer.isBuffer(body) ? body : Buffer.from(body, "latin1"));
    push(Buffer.from("\nendobj\n", "latin1"));
  });

  const xrefOffset = offset;
  let xref = `xref\n0 ${objectBodies.length + 1}\n0000000000 65535 f \n`;
  for (const each of offsets) {
    xref += `${String(each).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objectBodies.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  push(Buffer.from(xref, "latin1"));

  return Buffer.concat(chunks);
}

function streamObject(dictionary, body) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body, "latin1");
  return Buffer.concat([
    Buffer.from(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`, "latin1"),
    bytes,
    Buffer.from("\nendstream", "latin1"),
  ]);
}

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 45;
const BODY_SIZE = 9;
const CHARACTER_WIDTH = BODY_SIZE * 0.6;
const LEADING = 12.6;
const GUTTER = 30;
const COLUMN_WIDTH = (PAGE_WIDTH - 2 * MARGIN - GUTTER) / 2;

const HEADER = "MERIDIAN HARBOR GROUP LLC - MASTER SERVICES AGREEMENT";

/** Word-wrap to a character count, hyphenating at a line end where a long
 *  word would otherwise be pushed whole onto the next line. */
function wrap(text, columns) {
  const lines = [];
  let line = "";
  const words = text.split(/\s+/).filter(Boolean);

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= columns) {
      line = candidate;
      continue;
    }

    /* Hyphenate: only a genuinely long word, only where at least three
       characters land on each side, and only when the character that would
       start the next line is lower case — which is what makes the join
       unambiguous for whoever has to undo it. */
    const room = columns - (line ? line.length + 1 : 0) - 1;
    if (word.length >= 10 && room >= 3 && word.length - room >= 3) {
      const head = word.slice(0, room);
      const tail = word.slice(room);
      if (/^[a-z]$/.test(tail[0]) && !head.includes("-")) {
        lines.push(line ? `${line} ${head}-` : `${head}-`);
        line = "";
        words[index] = tail;
        index -= 1;
        continue;
      }
    }

    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

/* The document. Blocks flow through frames in order. A block is a heading
   (kept with the line after it) or a paragraph. Every one of the six source
   sentences below is byte-identical to `negotiable-flagged.json`, except
   where "fi" is written as the ﬁ ligature the fixture is here to exercise. */

const LIGATURE = "ﬁ";
const lig = (text) => text.replaceAll("fi", LIGATURE);

const BLOCKS = [
  { kind: "heading", text: "3. SCOPE AND CHANGE CONTROL" },
  {
    kind: "paragraph",
    text:
      "3.1 The scope of the Services for any engagement is the scope stated in the applicable SOW.",
  },
  {
    kind: "paragraph",
    text:
      "3.4 Contractor shall perform such additional tasks, revisions and iterations as Client reasonably requests in order to achieve Client's objectives for the engagement, including an unlimited number of revision rounds on any deliverable, at no additional charge and without an amendment to the applicable Statement of Work.",
  },
  {
    kind: "paragraph",
    text:
      "3.5 Client's failure to sign a change order does not relieve Contractor of the obligation to continue performing the Services then in progress.",
  },
  { kind: "heading", text: "4. FEES AND PAYMENT" },
  {
    kind: "paragraph",
    text:
      "4.3 Invoices are payable ninety (90) days after Client's receipt and acceptance of the corresponding deliverable, acceptance is at Client's sole discretion, and Client may withhold payment of any invoice in whole or in part while any other matter between the Parties remains unresolved.",
  },
  {
    kind: "paragraph",
    text:
      "4.4 Contractor shall bear Contractor's own expenses. Client will reimburse travel and third-party costs only where a SOW identifies them in advance and Client has approved them in writing.",
  },
  { kind: "spanning-heading", text: "PART II - INTELLECTUAL PROPERTY, INDEMNIFICATION AND LIMITATION OF LIABILITY" },
  { kind: "heading", text: "7. INTELLECTUAL PROPERTY" },
  {
    kind: "paragraph",
    text:
      "7.1 Client retains all right, title and interest in the Client Materials.",
  },
  {
    kind: "paragraph",
    text: lig(
      "7.2 All deliverables, works in progress, sketches, source code, data models, prompts, configurations, tooling and any other material Contractor conceives, creates or reduces to practice in connection with the Services are works made for hire owned exclusively by Client from the moment of creation, and to the extent any such material does not qualify as a work made for hire, Contractor hereby irrevocably assigns to Client all right, title and interest in it worldwide, including any general-purpose tools, libraries or methods Contractor develops while performing the Services.",
    ),
  },
  {
    kind: "paragraph",
    text:
      "7.3 Contractor shall execute any document and take any further act that Client reasonably requests to record or perfect Client's ownership under Section 7.2, at Client's expense.",
  },
  {
    kind: "paragraph",
    text:
      "7.4 Contractor waives, to the extent permitted by law, any moral right, attribution right or right of integrity in the Deliverables.",
  },
  {
    kind: "paragraph",
    text:
      "7.5 Contractor shall not display, describe or reproduce any Deliverable, in a portfolio or otherwise, without Client's prior written consent.",
  },
  { kind: "heading", text: "8. CONFIDENTIALITY" },
  {
    kind: "paragraph",
    text:
      "8.1 Each Party shall keep the other Party's Confidential Information in confidence, shall use it only for the purposes of this Agreement, and shall disclose it only to those of its personnel and advisers who need it for those purposes and who are bound by confidentiality obligations no less protective than these.",
  },
  {
    kind: "paragraph",
    text:
      "8.2 The obligations in Section 8.1 do not apply to information that is or becomes public through no breach of this Agreement, that the receiving Party already held without a duty of confidence, or that the receiving Party develops independently without reference to the disclosing Party's Confidential Information.",
  },
  { kind: "heading", text: "10. INDEMNIFICATION" },
  {
    kind: "paragraph",
    text: lig(
      "10.1 Contractor shall defend, indemnify and hold harmless Client, its affiliates, officers, employees and agents from and against any and all claims, demands, losses, liabilities, damages, fines, penalties, costs and expenses, including reasonable attorneys' fees, arising out of or in any way connected with the Services, whether or not caused by any act or omission of Contractor, and this obligation is not subject to any limitation or cap on liability set out in this Agreement.",
    ),
  },
  {
    kind: "paragraph",
    text:
      "10.2 Client shall control the defence and settlement of any claim for which Contractor owes an indemnity under Section 10.1, and Contractor shall pay the costs of that defence as they are incurred.",
  },
  {
    kind: "paragraph",
    text:
      "10.3 Contractor's obligations under this Section 10 survive termination or expiry of this Agreement.",
  },
  { kind: "heading", text: "11. LIMITATION OF LIABILITY" },
  {
    kind: "paragraph",
    text:
      "11.1 Neither Party excludes liability for death or personal injury caused by its negligence, or for fraud.",
  },
  {
    kind: "paragraph",
    text: lig(
      "11.2 Client's total liability to Contractor for any claim arising out of or relating to this Agreement, whether in contract, tort or otherwise, shall not exceed the lesser of the fees actually paid to Contractor in the thirty (30) days preceding the event giving rise to the claim or five hundred dollars ($500), and Contractor waives any right to consequential, incidental, indirect or special damages, to specific performance, and to injunctive relief of any kind.",
    ),
  },
  {
    kind: "paragraph",
    text:
      "11.3 Nothing in Section 11.2 limits Contractor's obligations under Section 10.",
  },
  { kind: "heading", text: "13. GUARANTEE" },
  {
    kind: "paragraph",
    text: lig(
      "13.2 If Contractor is an entity, the individual signing below in the capacity of principal, member or officer of that entity personally and unconditionally guarantees the full and prompt performance of every obligation of Contractor under this Agreement, including the payment of any amounts owed to Client, and Client may proceed directly against that individual’s personal assets without first proceeding against Contractor.",
    ),
  },
  {
    kind: "paragraph",
    text:
      "14.3 This Agreement is governed by the laws of the State of Delaware, without regard to its conflict of laws rules.",
  },
];

/* Frames, in reading order. Page 1 is one column; page 2 is two columns
   under a spanning heading; page 3 is one column again. */
const FRAMES = [
  { page: 1, x: MARGIN, width: PAGE_WIDTH - 2 * MARGIN, top: 720, bottom: 70 },
  { page: 2, x: MARGIN, width: COLUMN_WIDTH, top: 686, bottom: 70 },
  { page: 2, x: MARGIN + COLUMN_WIDTH + GUTTER, width: COLUMN_WIDTH, top: 686, bottom: 70 },
  { page: 3, x: MARGIN, width: PAGE_WIDTH - 2 * MARGIN, top: 720, bottom: 70 },
];

/** Flow the blocks through the frames, returning a line per frame. */
function layout() {
  const placed = FRAMES.map(() => []);
  let frameIndex = 0;
  let y = FRAMES[0].top;
  const spanningHeadings = [];

  for (const block of BLOCKS) {
    if (block.kind === "spanning-heading") {
      /* The spanning heading sits above the columns of page 2 and is not part
         of the column flow at all. */
      spanningHeadings.push({ page: 2, x: MARGIN, y: 720, text: block.text });
      /* Move the flow on to page 2's first column. */
      while (FRAMES[frameIndex].page !== 2) {
        frameIndex += 1;
        y = FRAMES[frameIndex].top;
      }
      continue;
    }

    const frame = FRAMES[frameIndex];
    const columns = Math.floor(frame.width / CHARACTER_WIDTH);
    const lines = wrap(block.text, columns);

    for (let index = 0; index < lines.length; index += 1) {
      if (y < FRAMES[frameIndex].bottom) {
        frameIndex += 1;
        if (frameIndex >= FRAMES.length) {
          throw new Error("ran out of frames — shorten the document");
        }
        y = FRAMES[frameIndex].top;
        /* Re-wrap the remainder if the new frame is a different width. A line
           already ending in an inserted hyphen rejoins with no space. */
        const remainder = lines
          .slice(index)
          .reduce((so_far, line) =>
            so_far.endsWith("-")
              ? so_far.slice(0, -1) + line
              : `${so_far} ${line}`,
          );
        const rewrapped = wrap(
          remainder,
          Math.floor(FRAMES[frameIndex].width / CHARACTER_WIDTH),
        );
        lines.length = index;
        lines.push(...rewrapped);
      }
      placed[frameIndex].push({
        x: FRAMES[frameIndex].x,
        y,
        text: lines[index],
      });
      y -= LEADING;
    }
    y -= LEADING * 0.6; // paragraph gap
  }

  return { placed, spanningHeadings, lastFrame: frameIndex };
}

function buildFlaggedPdf() {
  const { placed, spanningHeadings } = layout();
  const pageCount = 3;

  const contentForPage = (page) => {
    const ops = [`BT /F1 ${BODY_SIZE} Tf`];

    const framesOnPage = FRAMES.map((frame, index) => ({ frame, index })).filter(
      ({ frame }) => frame.page === page,
    );

    /* Deliberately out of reading order on the two-column page: the right
       column is written to the stream first. Reading order has to come from
       geometry. */
    const order = page === 2 ? [...framesOnPage].reverse() : framesOnPage;

    for (const { index } of order) {
      for (const line of placed[index]) {
        ops.push(`1 0 0 1 ${line.x} ${line.y.toFixed(2)} Tm`);
        ops.push(`${pdfString(line.text).toString("latin1")} Tj`);
      }
    }

    for (const heading of spanningHeadings.filter((h) => h.page === page)) {
      ops.push(`1 0 0 1 ${heading.x} ${heading.y} Tm`);
      ops.push(`${pdfString(heading.text).toString("latin1")} Tj`);
    }

    /* The running header and footer last of all, so removing them cannot be
       a matter of dropping the first and last item in the stream. */
    ops.push("ET");
    ops.push(`BT /F1 8 Tf 1 0 0 1 ${MARGIN} ${PAGE_HEIGHT - 40} Tm ${pdfString(HEADER).toString("latin1")} Tj ET`);
    ops.push(
      `BT /F1 8 Tf 1 0 0 1 ${PAGE_WIDTH / 2 - 24} 36 Tm ${pdfString(`Page ${page} of ${pageCount}`).toString("latin1")} Tj ET`,
    );
    return ops.join("\n");
  };

  /* Object numbering: 1 catalog, 2 pages, 3 font, 4..6 pages, 7..9 contents */
  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Count ${pageCount} /Kids [${[4, 5, 6].map((n) => `${n} 0 R`).join(" ")}] >>`,
  );
  objects.push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Courier /FirstChar 1 /LastChar 255 /Widths [${new Array(255).fill(600).join(" ")}] /Encoding << /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [1 /fi] >> >>`,
  );
  for (let page = 1; page <= pageCount; page += 1) {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${6 + page} 0 R >>`,
    );
  }
  for (let page = 1; page <= pageCount; page += 1) {
    objects.push(streamObject("", contentForPage(page)));
  }

  return { bytes: assemblePdf(objects), placed };
}

function buildScanPdf() {
  /* Two pages, each painting one 8x8 grey image across the whole page and
     showing no text whatsoever. */
  const pixels = Buffer.alloc(64);
  for (let index = 0; index < pixels.length; index += 1) {
    pixels[index] = 200 - (index % 8) * 12;
  }

  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Count 2 /Kids [4 0 R 5 0 R] >>");
  objects.push(
    streamObject(
      "/Type /XObject /Subtype /Image /Width 8 /Height 8 /ColorSpace /DeviceGray /BitsPerComponent 8",
      pixels,
    ),
  );
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im1 3 0 R >> >> /Contents 6 0 R >>`,
  );
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im1 3 0 R >> >> /Contents 7 0 R >>`,
  );
  const paint = `q ${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm /Im1 Do Q`;
  objects.push(streamObject("", paint));
  objects.push(streamObject("", paint));

  return assemblePdf(objects);
}

/* ------------------------------------------------------------------ *
 * Shared page furniture for the two extraction-stress PDFs
 * ------------------------------------------------------------------ */

/** One positioned run of text as a content-stream fragment. */
function textOp(size, x, y, text) {
  return `BT /F1 ${size} Tf 1 0 0 1 ${x} ${y.toFixed(2)} Tm ${pdfString(text).toString("latin1")} Tj ET`;
}

/** The running header and footer both fixtures carry, so that furniture removal
 *  is exercised alongside whatever else the page is testing. */
function furnitureOps(header, page, pageCount) {
  return [
    textOp(8, MARGIN, PAGE_HEIGHT - 40, header),
    textOp(8, PAGE_WIDTH / 2 - 24, 36, `Page ${page} of ${pageCount}`),
  ];
}

function pageObjects({ pageCount, contentFor, extraResources = "" }) {
  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const kids = Array.from({ length: pageCount }, (_, index) => `${4 + index} 0 R`);
  objects.push(`<< /Type /Pages /Count ${pageCount} /Kids [${kids.join(" ")}] >>`);
  objects.push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Courier /FirstChar 1 /LastChar 255 /Widths [${new Array(255).fill(600).join(" ")}] /Encoding << /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [1 /fi] >> >>`,
  );
  for (let page = 1; page <= pageCount; page += 1) {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> ${extraResources} >> /Contents ${3 + pageCount + page} 0 R >>`,
    );
  }
  for (let page = 1; page <= pageCount; page += 1) {
    objects.push(streamObject("", contentFor(page).join("\n")));
  }
  return objects;
}

/* ------------------------------------------------------------------ *
 * footnoted.pdf
 * ------------------------------------------------------------------ */

const FOOTNOTE_HEADER = "SUPPLY OF SERVICES AGREEMENT - SCHEDULE 2 (SERVICE LEVELS)";
const FOOTNOTE_SIZE = 7;
const FOOTNOTE_CHARACTER_WIDTH = FOOTNOTE_SIZE * 0.6;
const FOOTNOTE_LEADING = 9.8;
const MARKER_SIZE = 6;
/* Two rises, on purpose. A marker raised a little sits inside its line's own row,
   which is where the body sentence survives it. A marker raised further —
   paragraph 6.1's, and a third of the body size is an ordinary superscript — is
   reported by the parser as a row of its own between the two body lines, and the
   recovery reads it there, splitting the sentence in half. Only the first case is
   labelled as surviving; `tests/corpus/README.md` records the second as
   extraction work rather than hiding it. */
const MARKER_RISE_IN_LINE = 1.2;
const MARKER_RISE_ABOVE_LINE = 2.5;
const PARAGRAPH_GAP = 24;
const BODY_TOP = 720;
const BODY_BOTTOM = 176;
const RULE_Y = 152;
const FOOTNOTE_TOP = 138;
const MEASURE = PAGE_WIDTH - 2 * MARGIN;

/* The reader of this document is the Customer: the small business buying the
   service. Paragraph 7.1 and footnote 2 are the clauses that work against them,
   and footnote 2 is there because a clause in the small print has to come back
   as citable as a clause in the body. */
const FOOTNOTED_PAGES = [
  {
    blocks: [
      { kind: "heading", text: "5. SERVICE LEVELS" },
      {
        kind: "paragraph",
        marker: "1",
        markerRise: MARKER_RISE_IN_LINE,
        text:
          "5.1 The Supplier shall meet the availability target stated in paragraph 5.2 in each calendar month of the Term.",
      },
      {
        kind: "paragraph",
        text:
          "5.2 The availability target is ninety-nine percent (99%) of each calendar month, measured at the Supplier's monitoring endpoint and excluding any period of planned maintenance notified to the Customer in advance.",
      },
      {
        kind: "paragraph",
        text:
          "5.3 Planned maintenance is notified at least five (5) Business Days in advance and does not count towards the availability target.",
      },
    ],
    footnotes: [
      {
        marker: "1",
        text:
          "Capitalised terms used in this Schedule have the meanings given in clause 1 of the Agreement.",
      },
    ],
  },
  {
    blocks: [
      { kind: "heading", text: "6. SERVICE CREDITS" },
      {
        kind: "paragraph",
        marker: "2",
        markerRise: MARKER_RISE_ABOVE_LINE,
        text:
          "6.1 Where the Supplier does not meet the availability target in a calendar month, the Customer may claim a Monthly Service Credit by notifying the Supplier within thirty (30) days of the end of that month.",
      },
      {
        kind: "paragraph",
        text:
          "6.2 A Monthly Service Credit is two percent (2%) of the fees for the month in which the failure occurred, for each full percentage point below the availability target.",
      },
      { kind: "heading", text: "7. TERM AND TERMINATION" },
      {
        kind: "paragraph",
        text:
          "7.1 The Customer may not terminate this Schedule or the Agreement before the end of the thirty-six (36) month Term, and the Supplier may terminate either of them at any time on ten (10) days' written notice to the Customer.",
      },
    ],
    footnotes: [
      {
        marker: "2",
        text:
          "A Monthly Service Credit is the Customer's only remedy for a failure to meet the availability target, and the Customer waives every other claim arising from that failure.",
      },
    ],
  },
];

function buildFootnotedPdf() {
  const columns = Math.floor(MEASURE / CHARACTER_WIDTH);
  const footnoteColumns = Math.floor(MEASURE / FOOTNOTE_CHARACTER_WIDTH);

  const contentFor = (page) => {
    const spec = FOOTNOTED_PAGES[page - 1];
    const ops = [];
    let y = BODY_TOP;

    for (const block of spec.blocks) {
      const lines = wrap(block.text, columns);
      lines.forEach((line, index) => {
        ops.push(textOp(BODY_SIZE, MARGIN, y, line));
        /* The marker follows the full stop of the last line, in smaller type on
           a raised baseline and with no gap before it, which is how a parser
           comes to report it as part of the body line. */
        if (block.marker && index === lines.length - 1) {
          ops.push(
            textOp(
              MARKER_SIZE,
              MARGIN + line.length * CHARACTER_WIDTH,
              y + block.markerRise,
              block.marker,
            ),
          );
        }
        y -= LEADING;
      });
      y -= PARAGRAPH_GAP - LEADING;
      if (y < BODY_BOTTOM) {
        throw new Error(`page ${page} of footnoted.pdf overflows its body frame`);
      }
    }

    /* The rule above the footnotes is drawn, not typed: it is part of what makes
       the block below it look like a footnote rather than a paragraph. */
    ops.push(`q 0.5 w ${MARGIN} ${RULE_Y} m ${MARGIN + 180} ${RULE_Y} l S Q`);

    let footnoteY = FOOTNOTE_TOP;
    for (const footnote of spec.footnotes) {
      const lines = wrap(footnote.text, footnoteColumns);
      lines.forEach((line, index) => {
        if (index === 0) {
          ops.push(
            textOp(
              MARKER_SIZE,
              MARGIN,
              footnoteY + MARKER_RISE_IN_LINE,
              footnote.marker,
            ),
          );
          ops.push(
            textOp(
              FOOTNOTE_SIZE,
              MARGIN + MARKER_SIZE * 0.6 + 3,
              footnoteY,
              line,
            ),
          );
        } else {
          ops.push(textOp(FOOTNOTE_SIZE, MARGIN, footnoteY, line));
        }
        footnoteY -= FOOTNOTE_LEADING;
      });
    }

    ops.push(...furnitureOps(FOOTNOTE_HEADER, page, FOOTNOTED_PAGES.length));
    return ops;
  };

  return assemblePdf(
    pageObjects({ pageCount: FOOTNOTED_PAGES.length, contentFor }),
  );
}

/* ------------------------------------------------------------------ *
 * tabular.pdf
 * ------------------------------------------------------------------ */

const TABLE_HEADER = "MILLPOND DATA LTD - SCHEDULE 3 (FEES AND PAYMENT MILESTONES)";
const TABLE_SIZE = 8;
const TABLE_CHARACTER_WIDTH = TABLE_SIZE * 0.6;
const TABLE_COLUMNS = [
  { x: MARGIN, width: 160 },
  { x: 215, width: 70 },
  { x: 295, width: 260 },
];
const TABLE_ROW_LEADING = 14;

/* Every prose line on the table page is written to fit one line and to reach
   across the table's gutters. A short line that stopped inside a gutter would be
   read as part of a column rather than as prose, which is a property of the page
   rather than of the extraction, and this fixture is here to test the table. */
const TABULAR_PAGE_ONE = {
  heading: { y: 720, text: "SCHEDULE 3 - FEES AND PAYMENT MILESTONES" },
  intro: {
    y: 694,
    text:
      "2.1 The fee for each milestone and the date it falls due are set out in the table below.",
  },
  table: {
    top: 656,
    rows: [
      ["Milestone", "Fee", "When the fee falls due"],
      ["Discovery workshop", "$4,000", "On signature of this Schedule."],
      ["Design system", "$9,500", "Ninety days after Client accepts this milestone."],
      [
        "Build and handover",
        "$12,500",
        "Ninety days after Client accepts the final milestone.",
      ],
    ],
  },
  closing: {
    y: 588,
    text:
      "2.2 Client shall pay each fee by the date stated in the third column of the table above.",
  },
};

const TABULAR_PAGE_TWO = [
  { kind: "heading", text: "3. ACCEPTANCE AND WITHHOLDING" },
  {
    kind: "paragraph",
    text:
      "3.1 Client shall tell Supplier in writing within ten (10) Business Days of delivery whether Client accepts a milestone.",
  },
  {
    kind: "paragraph",
    text:
      "3.2 Client may withhold the whole of a milestone fee until Client has accepted every milestone listed in Schedule 3, and acceptance is at Client's sole discretion.",
  },
  {
    kind: "paragraph",
    text:
      "3.3 An amount that is not in dispute remains payable on its original due date.",
  },
];

function buildTabularPdf() {
  const columns = Math.floor(MEASURE / CHARACTER_WIDTH);

  const contentFor = (page) => {
    const ops = [];

    if (page === 1) {
      const spec = TABULAR_PAGE_ONE;
      ops.push(textOp(BODY_SIZE, MARGIN, spec.heading.y, spec.heading.text));
      ops.push(textOp(BODY_SIZE, MARGIN, spec.intro.y, spec.intro.text));

      let y = spec.table.top;
      for (const row of spec.table.rows) {
        row.forEach((cell, index) => {
          const column = TABLE_COLUMNS[index];
          if (cell.length * TABLE_CHARACTER_WIDTH > column.width) {
            throw new Error(`cell does not fit its column: ${cell}`);
          }
          ops.push(textOp(TABLE_SIZE, column.x, y, cell));
        });
        y -= TABLE_ROW_LEADING;
      }

      ops.push(textOp(BODY_SIZE, MARGIN, spec.closing.y, spec.closing.text));
    } else {
      let y = BODY_TOP;
      for (const block of TABULAR_PAGE_TWO) {
        for (const line of wrap(block.text, columns)) {
          ops.push(textOp(BODY_SIZE, MARGIN, y, line));
          y -= LEADING;
        }
        y -= PARAGRAPH_GAP - LEADING;
      }
    }

    ops.push(...furnitureOps(TABLE_HEADER, page, 2));
    return ops;
  };

  return assemblePdf(pageObjects({ pageCount: 2, contentFor }));
}

/** The sentences each stress fixture is labelled with, generated from the same
 *  constants the pages are drawn from. */
function footnotedLabels() {
  const paragraph = (page, prefix) =>
    FOOTNOTED_PAGES[page].blocks.find((block) =>
      block.kind === "paragraph" && block.text.startsWith(prefix),
    ).text;
  const footnote = (page) => FOOTNOTED_PAGES[page].footnotes[0].text;

  const terminationSentence = paragraph(1, "7.1").slice("7.1 ".length);
  const soleRemedySentence = footnote(1);

  return {
    documentType: "negotiable",
    title: "Millpond Data Ltd — Supply of Services Agreement, Schedule 2",
    expectedAllClear: false,
    plantedClauses: [
      {
        clauseType: "limitation-of-liability",
        severity: "high",
        clauseRef: "footnote 2",
        sourceSentence: soleRemedySentence,
        whatItPermits:
          "The document, in a footnote, makes the service credit the customer's only remedy when the availability target is missed and waives every other claim arising from that failure. The credit is two percent of one month's fees for each point below the target, so the recoverable amount is fixed by paragraph 6.2 however much the failure costs. Whether a waiver of remedies drafted this way would be upheld depends on the governing law.",
      },
      {
        clauseType: "termination-and-notice",
        severity: "medium",
        clauseRef: "7.1",
        sourceSentence: terminationSentence,
        whatItPermits:
          "The document gives the customer no way out before the end of the thirty-six month term and lets the supplier end the arrangement at any time on ten days' notice. The right to terminate runs one way only.",
      },
    ],
    checkedAndAbsent: [
      "personal-guarantee",
      "uncapped-indemnification",
      "non-compete-non-solicit",
      "ip-assignment-work-for-hire",
      "payment-terms",
      "scope-and-change-control",
    ],
    survivingSentences: [
      paragraph(0, "5.1").slice("5.1 ".length),
      paragraph(0, "5.2").slice("5.2 ".length),
      footnote(0),
      paragraph(1, "6.2").slice("6.2 ".length),
      terminationSentence,
      soleRemedySentence,
    ],
    notes: {
      "personal-guarantee":
        "No guarantee of any kind. This Schedule is signed by nobody in a personal capacity.",
      "uncapped-indemnification": "This Schedule contains no indemnity.",
      "non-compete-non-solicit": "No restraint on either party's other business.",
      "ip-assignment-work-for-hire":
        "This Schedule assigns nothing and licenses nothing.",
      "payment-terms":
        "This Schedule sets service credits against fees rather than payment terms. When a fee falls due is in Schedule 3 rather than here.",
      "scope-and-change-control":
        "This Schedule states a fixed availability target and a fixed credit. It contains no revision or change process.",
    },
  };
}

function tabularLabels() {
  const withholdingSentence = TABULAR_PAGE_TWO.find((block) =>
    block.text.startsWith("3.2"),
  ).text.slice("3.2 ".length);

  return {
    documentType: "negotiable",
    title: "Millpond Data Ltd — Supply of Services Agreement, Schedule 3",
    expectedAllClear: false,
    plantedClauses: [
      {
        clauseType: "payment-terms",
        severity: "medium",
        clauseRef: "3.2",
        sourceSentence: withholdingSentence,
        whatItPermits:
          "The document lets the client hold back the whole of a milestone fee until it has accepted every milestone in the schedule, and makes acceptance the client's own decision. On these terms work that has been delivered and not yet accepted has no date by which it must be paid.",
      },
    ],
    checkedAndAbsent: [
      "personal-guarantee",
      "uncapped-indemnification",
      "non-compete-non-solicit",
      "ip-assignment-work-for-hire",
      "limitation-of-liability",
      "termination-and-notice",
      "scope-and-change-control",
    ],
    survivingSentences: [
      TABULAR_PAGE_ONE.intro.text.slice("2.1 ".length),
      TABULAR_PAGE_ONE.table.rows[2][2],
      TABULAR_PAGE_ONE.table.rows[3][2],
      TABULAR_PAGE_ONE.closing.text.slice("2.2 ".length),
      withholdingSentence,
    ],
    notes: {
      "personal-guarantee": "No guarantee of any kind.",
      "uncapped-indemnification": "This Schedule contains no indemnity.",
      "non-compete-non-solicit": "No restraint on either party's other business.",
      "ip-assignment-work-for-hire":
        "This Schedule assigns nothing and licenses nothing.",
      "limitation-of-liability":
        "This Schedule caps nothing and waives no remedy. The sole-remedy clause is in Schedule 2 rather than here.",
      "termination-and-notice": "This Schedule contains no termination right.",
      "scope-and-change-control":
        "The milestones are fixed by the table. There is no revision or change process in this Schedule.",
    },
  };
}

/* ------------------------------------------------------------------ *
 * A very small DOCX writer (a zip of three parts)
 * ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;

  for (const { name, content } of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    const raw = Buffer.from(content, "utf8");
    const deflated = deflateSync(raw, { level: 9 }).subarray(2, -4);
    const crc = crc32(raw);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(0, 6); // flags
    header.writeUInt16LE(8, 8); // deflate
    header.writeUInt16LE(0, 10); // time
    header.writeUInt16LE(0x21, 12); // date — 1 Jan 1996, fixed for determinism
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(deflated.length, 18);
    header.writeUInt32LE(raw.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    header.writeUInt16LE(0, 28);

    local.push(header, nameBytes, deflated);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0, 8);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(0, 12);
    entry.writeUInt16LE(0x21, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(deflated.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);

    offset += header.length + nameBytes.length + deflated.length;
  }

  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...local, centralBytes, end]);
}

const xmlEscape = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function buildDocx() {
  const paragraphs = [
    "MASTER SERVICES AGREEMENT (Independent Contractor)",
    "3. SCOPE AND CHANGE CONTROL",
    BLOCKS.find((b) => b.text.startsWith("3.4")).text,
    BLOCKS.find((b) => b.text.startsWith("4.3")).text,
    "7. INTELLECTUAL PROPERTY",
    BLOCKS.find((b) => b.text.startsWith("7.2")).text,
    "10. INDEMNIFICATION",
    BLOCKS.find((b) => b.text.startsWith("10.1")).text,
    "11. LIMITATION OF LIABILITY",
    BLOCKS.find((b) => b.text.startsWith("11.2")).text,
    "13. GUARANTEE",
    BLOCKS.find((b) => b.text.startsWith("13.2")).text,
  ];

  const body = paragraphs
    .map(
      (text) =>
        `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`,
    )
    .join("");

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

  return zip([
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: rels },
    { name: "word/document.xml", content: document },
  ]);
}

/* ------------------------------------------------------------------ *
 * Write, and report what landed where
 * ------------------------------------------------------------------ */

const { bytes: flaggedPdf, placed } = buildFlaggedPdf();
writeFileSync(join(here, "negotiable-flagged.pdf"), flaggedPdf);
writeFileSync(join(here, "scan-no-text-layer.pdf"), buildScanPdf());
writeFileSync(join(here, "negotiable-flagged.docx"), buildDocx());

const footnoted = buildFootnotedPdf();
writeFileSync(join(here, "footnoted.pdf"), footnoted);
writeFileSync(
  join(here, "footnoted.json"),
  `${JSON.stringify(footnotedLabels(), null, 2)}\n`,
);

const tabular = buildTabularPdf();
writeFileSync(join(here, "tabular.pdf"), tabular);
writeFileSync(
  join(here, "tabular.json"),
  `${JSON.stringify(tabularLabels(), null, 2)}\n`,
);

console.log("footnoted.pdf", footnoted.length, "bytes");
console.log("tabular.pdf", tabular.length, "bytes");
console.log("negotiable-flagged.pdf", flaggedPdf.length, "bytes");
FRAMES.forEach((frame, index) => {
  console.log(
    `  frame ${index} (page ${frame.page}, x=${frame.x}): ${placed[index].length} lines`,
  );
  for (const line of placed[index]) {
    console.log(`    ${line.y.toFixed(1).padStart(6)} | ${line.text}`);
  }
});
