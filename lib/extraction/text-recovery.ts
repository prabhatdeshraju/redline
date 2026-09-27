/* Faithful text recovery, as pure functions.
 *
 * A PDF has no sentences in it. It has glyphs at coordinates, emitted in
 * whatever order the producing application happened to write them. Everything
 * that makes a sentence a sentence — which glyphs share a line, which lines
 * share a column, which column is read first, that a hyphen at a line end is
 * not part of the word, that the words at the top of every page are furniture
 * rather than prose — is reconstructed here.
 *
 * This is the part of the extraction boundary that owns ADR 0001's guarantee.
 * When a quoted sentence later fails to match the reader's own copy, the defect
 * is in this file, and the fix is here rather than in loosening the match.
 *
 * Everything below takes positioned text items and returns text. No parser, no
 * file, no browser: the whole of the hard logic is reachable from a test that
 * writes its own input.
 *
 * Coordinates are PDF user space: the origin is the bottom-left of the page and
 * y increases upwards, so the first line on a page has the largest y.
 */

import { countLigatures, normaliseRecoveredText } from "./normalise";

/** One run of glyphs a parser reported, with where it sits on the page. */
export type PositionedTextItem = {
  readonly text: string;
  /** Left edge, in user space. */
  readonly x: number;
  /** Baseline, in user space: larger is further up the page. */
  readonly y: number;
  /** Advance width of this run. */
  readonly width: number;
  /** Rendered size of the type, used as the scale for every tolerance here. */
  readonly fontSize: number;
};

export type ParsedPage = {
  readonly pageNumber: number;
  readonly width: number;
  readonly height: number;
  readonly items: readonly PositionedTextItem[];
};

/** A run of items the geometry says share one line of type. */
export type RecoveredLine = {
  readonly text: string;
  readonly x: number;
  readonly right: number;
  readonly y: number;
  readonly fontSize: number;
  readonly pageNumber: number;
};

export type RecoveryDiagnostics = {
  readonly pages: number;
  /** Pages the parser reported no text on at all. */
  readonly pagesWithoutText: readonly number[];
  /** Pages laid out in more than one column, and how many columns were read. */
  readonly multiColumnPages: ReadonlyArray<{
    readonly pageNumber: number;
    readonly columns: number;
  }>;
  /** The running header and footer lines that were recognised and removed. */
  readonly runningLinesRemoved: readonly string[];
  /** Words rejoined across a line-end hyphen. */
  readonly hyphenationsJoined: number;
  /** Line-end hyphens kept because the document uses that compound elsewhere. */
  readonly hyphensKept: number;
  /** Sentences that continued across a page boundary and were rejoined. */
  readonly sentencesJoinedAcrossPages: number;
  /** Ligature characters decomposed to the sequence the writer typed. */
  readonly ligaturesDecomposed: number;
};

export type RecoveredText = {
  readonly text: string;
  readonly diagnostics: RecoveryDiagnostics;
};

/* ------------------------------------------------------------------ *
 * 1. Rows
 * ------------------------------------------------------------------ */

/** Group runs of type into rows by baseline.
 *
 * Two runs share a row when their baselines are within a third of the type size
 * of each other. The tolerance has to scale with the type, or a footnote and the
 * line above it merge.
 *
 * A row is not yet a line: on a two-column page the left column's first line and
 * the right column's first line are the same row, because they sit on the same
 * baseline. Separating them is what the next section is for.
 */
export function rowsOf(
  items: readonly PositionedTextItem[],
): PositionedTextItem[][] {
  const present = items.filter((item) => item.text.length > 0);
  if (present.length === 0) return [];

  const sorted = [...present].sort((a, b) =>
    b.y === a.y ? a.x - b.x : b.y - a.y,
  );

  const rows: PositionedTextItem[][] = [];
  for (const item of sorted) {
    const row = rows.at(-1);
    const reference = row?.[0];
    const tolerance = Math.max(1, (reference?.fontSize ?? item.fontSize) / 3);
    if (row && reference && Math.abs(reference.y - item.y) <= tolerance) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }
  return rows.map((row) => [...row].sort((a, b) => a.x - b.x));
}

/** A horizontal gap inside one row, wide enough to be something other than a
 *  word space. */
export type RowGap = { readonly start: number; readonly end: number };

/** The gaps inside a row that are at least `minimum` wide. */
export function gapsInRow(
  row: readonly PositionedTextItem[],
  minimum: number,
): RowGap[] {
  const gaps: RowGap[] = [];
  let right = row.length > 0 ? row[0].x : 0;
  for (const item of row) {
    if (item.x - right >= minimum) gaps.push({ start: right, end: item.x });
    right = Math.max(right, item.x + item.width);
  }
  return gaps;
}

/* ------------------------------------------------------------------ *
 * 2. Columns
 * ------------------------------------------------------------------ */

/** Find the vertical gutters that separate columns of type on a page.
 *
 * A gutter is a band of the measure that several rows all leave empty in the
 * same place. Three things make it findable:
 *
 *   - the top and bottom bands of the page are ignored. A running header reaches
 *     past the gutter and a centred footer sits directly over it.
 *   - a row that is wide and has no gap in it is ignored. That is a title or a
 *     heading spanning the columns; it covers the gutter and would hide it. A
 *     row made of two columns is just as wide but has the gutter inside it, so
 *     it is kept.
 *   - a gutter has to appear in at least three rows. One row with a wide gap in
 *     it is a tab stop, a signature block or a short last line; a gap in the
 *     same place down the page is a column.
 */
export function findColumnBoundaries(page: ParsedPage): number[] {
  const margin = page.height * 0.07;
  const body = page.items.filter(
    (item) =>
      item.text.trim().length > 0 &&
      item.y > margin &&
      item.y < page.height - margin,
  );
  if (body.length < 8) return [];

  const left = Math.min(...body.map((item) => item.x));
  const right = Math.max(...body.map((item) => item.x + item.width));
  const measure = right - left;
  if (measure <= 0) return [];

  const minimumGutter = Math.max(measure * 0.035, 10);
  const rows = rowsOf(body);
  const gapsPerRow = rows.map((row) => gapsInRow(row, minimumGutter));

  const spanOf = (row: readonly PositionedTextItem[]): number =>
    Math.max(...row.map((item) => item.x + item.width)) -
    Math.min(...row.map((item) => item.x));

  const considered = rows.filter(
    (row, index) =>
      gapsPerRow[index].length > 0 || spanOf(row) <= measure * 0.6,
  );
  if (considered.length < 4) return [];

  /* One cell per point across the measure, marked where a considered row covers
     it. What is left uncovered and interior is a candidate gutter. */
  const cells = Math.max(1, Math.ceil(measure));
  const covered = new Uint8Array(cells);
  for (const row of considered) {
    for (const item of row) {
      const from = Math.max(0, Math.floor(item.x - left));
      const to = Math.min(cells, Math.ceil(item.x + item.width - left));
      covered.fill(1, from, to);
    }
  }

  const candidates: number[] = [];
  let runStart: number | null = null;
  for (let cell = 0; cell <= cells; cell += 1) {
    const isGap = cell < cells && covered[cell] === 0;
    if (isGap && runStart === null) runStart = cell;
    if (!isGap && runStart !== null) {
      const width = cell - runStart;
      /* A gutter is interior. A gap at either edge of the measure is margin. */
      if (width >= minimumGutter && runStart > 0 && cell < cells) {
        candidates.push(left + runStart + width / 2);
      }
      runStart = null;
    }
  }

  return candidates.filter((boundary) => {
    const rowsAcross = gapsPerRow.filter((gaps) =>
      gaps.some((gap) => gap.start <= boundary && gap.end >= boundary),
    ).length;
    if (rowsAcross < 3) return false;

    const before = considered.filter((row) =>
      row.some((item) => item.x + item.width <= boundary),
    ).length;
    const after = considered.filter((row) =>
      row.some((item) => item.x >= boundary),
    ).length;
    return before >= 3 && after >= 3;
  });
}

/* ------------------------------------------------------------------ *
 * 3. Rows to lines
 * ------------------------------------------------------------------ */

/** Assemble a page's lines of type.
 *
 * Within a row, runs are read left to right and a space is inserted where the
 * horizontal gap is wide enough to be one: a parser reports "shall" and "pay" as
 * separate runs and the space between them exists only as a coordinate.
 *
 * A row is then cut at any column boundary it does not actually reach across.
 * The test is whether a run of type covers the boundary: a two-column row has a
 * real gap there and is cut into one line per column, while a centred footer
 * whose glyphs run straight through the gutter is left whole.
 */
export function groupIntoLines(
  page: ParsedPage,
  boundaries: readonly number[] = [],
): RecoveredLine[] {
  const lines: RecoveredLine[] = [];
  for (const row of rowsOf(page.items)) {
    for (const segment of splitRowAtBoundaries(row, boundaries)) {
      const line = assembleLine(segment, page.pageNumber);
      if (line) lines.push(line);
    }
  }
  return lines;
}

/** Cut one row into per-column segments at the boundaries it does not reach
 *  across. Exported so the cut can be tested on its own. */
export function splitRowAtBoundaries(
  row: readonly PositionedTextItem[],
  boundaries: readonly number[],
): PositionedTextItem[][] {
  if (boundaries.length === 0 || row.length === 0) return [[...row]];

  const cuts = boundaries.filter(
    (boundary) =>
      !row.some((item) => item.x < boundary && item.x + item.width > boundary) &&
      row.some((item) => item.x + item.width <= boundary) &&
      row.some((item) => item.x >= boundary),
  );
  if (cuts.length === 0) return [[...row]];

  const segments: PositionedTextItem[][] = [[]];
  let next = 0;
  for (const item of row) {
    while (next < cuts.length && item.x >= cuts[next]) {
      segments.push([]);
      next += 1;
    }
    segments[segments.length - 1].push(item);
  }
  return segments.filter((segment) => segment.length > 0);
}

function assembleLine(
  segment: readonly PositionedTextItem[],
  pageNumber: number,
): RecoveredLine | null {
  if (segment.length === 0) return null;
  const fontSize = Math.max(...segment.map((item) => item.fontSize), 1);

  let text = "";
  let right = segment[0].x;
  for (const item of segment) {
    const gap = item.x - right;
    const needsSpace =
      text.length > 0 &&
      gap > fontSize * 0.2 &&
      !/\s$/.test(text) &&
      !/^\s/.test(item.text);
    if (needsSpace) text += " ";
    text += item.text;
    right = Math.max(right, item.x + item.width);
  }

  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length === 0) return null;

  return {
    text: trimmed,
    x: segment[0].x,
    right,
    y: segment[0].y,
    fontSize,
    pageNumber,
  };
}

/* ------------------------------------------------------------------ *
 * 4. Reading order
 * ------------------------------------------------------------------ */

/** Put a page's lines into the order a person reads them.
 *
 * Single column: top to bottom, which is what the geometry already gives.
 *
 * Two or more columns: each column is read to its foot before the next one
 * begins. A line that reaches across a boundary closes the columns above it and
 * opens fresh ones below, so a page that is one column at the top and two below
 * is read correctly rather than interleaved.
 *
 * Stream order is never consulted. A producing application is free to write the
 * right column before the left, and several do.
 */
export function orderForReading(
  lines: readonly RecoveredLine[],
  boundaries: readonly number[] = [],
): {
  readonly lines: RecoveredLine[];
  readonly columns: number;
} {
  if (boundaries.length === 0) {
    return { lines: [...lines], columns: 1 };
  }

  const reachesAcross = (line: RecoveredLine): boolean =>
    boundaries.some((boundary) => line.x < boundary && line.right > boundary);

  const columnFor = (line: RecoveredLine): number =>
    boundaries.filter((boundary) => line.x >= boundary).length;

  const columns = boundaries.length + 1;
  const ordered: RecoveredLine[] = [];
  let buckets: RecoveredLine[][] = Array.from({ length: columns }, () => []);

  const flush = () => {
    for (const bucket of buckets) ordered.push(...bucket);
    buckets = Array.from({ length: columns }, () => []);
  };

  for (const line of lines) {
    if (reachesAcross(line)) {
      flush();
      ordered.push(line);
    } else {
      buckets[columnFor(line)].push(line);
    }
  }
  flush();

  return { lines: ordered, columns };
}

/* ------------------------------------------------------------------ *
 * 5. Running headers and footers
 * ------------------------------------------------------------------ */

/** The shape of a line, with its digits blanked, so that "Page 3 of 9" and
 *  "Page 4 of 9" are recognised as the same piece of furniture. */
function furnitureKey(text: string): string {
  return text.replace(/\d+/g, "#").replace(/\s+/g, " ").trim().toLowerCase();
}

/** The lines on one page that sit apart from the text block: at most two at the
 *  top and two at the bottom, each separated from the block by more than the
 *  page's own leading.
 *
 * Being set away from the text is what makes furniture furniture. Taking the
 * first and last lines regardless would eat a clause that happens to begin at
 * the top of a page, which is the failure this guards against. */
export function furnitureCandidates(
  lines: readonly RecoveredLine[],
): RecoveredLine[] {
  if (lines.length < 4) return [];

  const gaps: number[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const gap = lines[index - 1].y - lines[index].y;
    if (gap > 0) gaps.push(gap);
  }
  if (gaps.length === 0) return [];

  /* The tightest quarter of the gaps is the body leading. The median would be
     dragged upwards by the two enormous gaps the margins themselves create. */
  const sorted = [...gaps].sort((a, b) => a - b);
  const leading = sorted[Math.floor(sorted.length / 4)];
  const separated = leading * 1.4;

  const candidates: RecoveredLine[] = [];
  for (let index = 0; index < 2 && index + 1 < lines.length; index += 1) {
    if (lines[index].y - lines[index + 1].y <= separated) break;
    candidates.push(lines[index]);
  }
  for (let index = lines.length - 1; index > lines.length - 3 && index > 0; index -= 1) {
    if (lines[index - 1].y - lines[index].y <= separated) break;
    candidates.push(lines[index]);
  }
  return candidates;
}

/** Find the lines that are page furniture rather than document text.
 *
 * A running header or footer is the same line, set apart from the text block, on
 * more than one page. Both halves matter: a sentence that happens to repeat
 * inside a contract is not furniture because it is inside the block, and a
 * heading that appears once is not furniture because it appears once.
 *
 * This is the step that lets a sentence survive a page break. The header sits
 * between the end of the sentence and its continuation; leaving it in would
 * splice "MASTER SERVICES AGREEMENT Page 3 of 9" into the middle of a clause,
 * and no reader would ever find that sentence in their own copy.
 */
export function findRunningLines(
  pagesOfLines: ReadonlyArray<readonly RecoveredLine[]>,
): Set<string> {
  const pagesWithText = pagesOfLines.filter((lines) => lines.length > 0);
  if (pagesWithText.length < 2) return new Set();

  const seenOn = new Map<string, Set<number>>();
  pagesWithText.forEach((lines, index) => {
    for (const line of furnitureCandidates(lines)) {
      const key = furnitureKey(line.text);
      if (key.length === 0) continue;
      const pages = seenOn.get(key) ?? new Set<number>();
      pages.add(index);
      seenOn.set(key, pages);
    }
  });

  const needed = Math.max(2, Math.ceil(pagesWithText.length / 2));
  const running = new Set<string>();
  for (const [key, pages] of seenOn) {
    if (pages.size >= needed) running.add(key);
  }
  return running;
}

/** Drop the furniture, keeping only lines that are the document's own text. */
export function stripRunningLines(
  lines: readonly RecoveredLine[],
  running: ReadonlySet<string>,
): RecoveredLine[] {
  return lines.filter((line) => !running.has(furnitureKey(line.text)));
}

/* ------------------------------------------------------------------ *
 * 6. Lines to prose
 * ------------------------------------------------------------------ */

const HYPHENS = /[-‐]$/;
/* A sentence has finished when it ends in a full stop, question mark or
   exclamation mark, optionally inside a closing quote or bracket. A line ending
   in an apostrophe has not finished — "thirty (30) days'" — and neither has one
   ending in a colon or a semicolon. */
const ENDS_A_SENTENCE = /[.!?]["'’”)\]]?$/;

/** Hyphenated compounds the document uses inside a line.
 *
 * This is the evidence that settles the one genuinely ambiguous case in
 * de-hyphenation. A line ending "third-" followed by a line starting "party"
 * might be the word "thirdparty" broken by the typesetter, or the compound
 * "third-party" broken at its own hyphen. If the document writes "third-party"
 * somewhere it did not have to break it, the hyphen is the writer's and it
 * stays. Otherwise it is the typesetter's and it goes.
 */
export function hyphenatedCompounds(
  lines: readonly RecoveredLine[],
): Set<string> {
  const compounds = new Set<string>();
  for (const line of lines) {
    /* Anything at the very end of a line is exactly the case we cannot use as
       evidence, so the trailing hyphen is trimmed off first. */
    const body = line.text.replace(HYPHENS, "");
    for (const match of body.matchAll(/\p{L}+(?:-\p{L}+)+/gu)) {
      compounds.add(match[0].toLowerCase());
    }
  }
  return compounds;
}

type Join =
  | { readonly kind: "space" }
  | { readonly kind: "paragraph" }
  | { readonly kind: "dehyphenate" }
  | { readonly kind: "keep-hyphen" };

/** How two consecutive lines join. Exported because every failure mode this
 *  module exists for comes down to one of these four answers. */
export function decideJoin(
  previous: RecoveredLine,
  next: RecoveredLine,
  context: {
    readonly medianLineGap: number;
    readonly compounds: ReadonlySet<string>;
  },
): Join {
  if (HYPHENS.test(previous.text)) {
    const head = previous.text.replace(HYPHENS, "").match(/\p{L}+$/u)?.[0];
    const tail = next.text.match(/^\p{L}+/u)?.[0];
    if (head && tail) {
      /* An upper-case or numeric continuation is never a broken word:
         "Anglo-American", "pre-2020". */
      if (/^\p{Lu}/u.test(tail)) return { kind: "keep-hyphen" };
      if (context.compounds.has(`${head}-${tail}`.toLowerCase())) {
        return { kind: "keep-hyphen" };
      }
      return { kind: "dehyphenate" };
    }
    if (head && /^\d/.test(next.text)) return { kind: "keep-hyphen" };
  }

  /* Across a page break — and across a column boundary, where the next line
     sits further UP the page than the one before it — there is no vertical gap
     to read, so the question is whether the sentence had finished. An
     unfinished sentence continues. */
  const movedToANewFrame =
    previous.pageNumber !== next.pageNumber || next.y > previous.y;
  if (movedToANewFrame) {
    const finished =
      ENDS_A_SENTENCE.test(previous.text) || /^\p{Lu}|^\d/u.test(next.text);
    return finished ? { kind: "paragraph" } : { kind: "space" };
  }

  const gap = previous.y - next.y;
  if (context.medianLineGap > 0 && gap > context.medianLineGap * 1.5) {
    return { kind: "paragraph" };
  }

  return { kind: "space" };
}

/** The median baseline-to-baseline distance between consecutive lines on the
 *  same page, which is the only reliable scale for "this gap is a paragraph". */
export function medianLineGap(lines: readonly RecoveredLine[]): number {
  const gaps: number[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const previous = lines[index - 1];
    const next = lines[index];
    if (previous.pageNumber !== next.pageNumber) continue;
    const gap = previous.y - next.y;
    if (gap > 0) gaps.push(gap);
  }
  if (gaps.length === 0) return 0;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

/** Reassemble prose from lines that are already in reading order. */
export function joinLines(lines: readonly RecoveredLine[]): {
  readonly text: string;
  readonly hyphenationsJoined: number;
  readonly hyphensKept: number;
  readonly sentencesJoinedAcrossPages: number;
} {
  if (lines.length === 0) {
    return {
      text: "",
      hyphenationsJoined: 0,
      hyphensKept: 0,
      sentencesJoinedAcrossPages: 0,
    };
  }

  const context = {
    medianLineGap: medianLineGap(lines),
    compounds: hyphenatedCompounds(lines),
  };

  let text = lines[0].text;
  let hyphenationsJoined = 0;
  let hyphensKept = 0;
  let sentencesJoinedAcrossPages = 0;

  for (let index = 1; index < lines.length; index += 1) {
    const previous = lines[index - 1];
    const next = lines[index];
    const join = decideJoin(previous, next, context);

    switch (join.kind) {
      case "dehyphenate":
        text = text.replace(HYPHENS, "") + next.text;
        hyphenationsJoined += 1;
        break;
      case "keep-hyphen":
        text += next.text;
        hyphensKept += 1;
        break;
      case "paragraph":
        text += `\n\n${next.text}`;
        break;
      case "space":
        text += ` ${next.text}`;
        if (previous.pageNumber !== next.pageNumber) {
          sentencesJoinedAcrossPages += 1;
        }
        break;
    }
  }

  return { text, hyphenationsJoined, hyphensKept, sentencesJoinedAcrossPages };
}

/* ------------------------------------------------------------------ *
 * The whole recovery
 * ------------------------------------------------------------------ */

/** Positioned items in, the document's text out, with the diagnostics that say
 *  what had to be repaired to get there. */
export function recoverText(pages: readonly ParsedPage[]): RecoveredText {
  const boundariesPerPage = pages.map((page) => findColumnBoundaries(page));
  const perPage = pages.map((page, index) =>
    groupIntoLines(page, boundariesPerPage[index]),
  );
  const running = findRunningLines(perPage);

  const multiColumnPages: Array<{ pageNumber: number; columns: number }> = [];
  const ordered: RecoveredLine[] = [];
  const pagesWithoutText: number[] = [];
  const removed = new Map<string, string>();

  pages.forEach((page, index) => {
    const lines = perPage[index];
    if (lines.length === 0) {
      pagesWithoutText.push(page.pageNumber);
      return;
    }

    /* Furniture comes off before reading order is worked out, not after. A
       centred footer sits across the gutter between two columns, and a running
       header reaches past it; either one hides the gutter from the geometry and
       the page gets read as one column, interleaving the two. */
    const kept = stripRunningLines(lines, running);
    for (const line of lines) {
      if (running.has(furnitureKey(line.text))) {
        /* The first wording seen wins, so a footer is reported as the reader saw
           it on page one rather than as a blanked pattern. */
        const key = furnitureKey(line.text);
        if (!removed.has(key)) removed.set(key, line.text);
      }
    }

    const read = orderForReading(kept, boundariesPerPage[index]);
    if (read.columns > 1) {
      multiColumnPages.push({
        pageNumber: page.pageNumber,
        columns: read.columns,
      });
    }
    ordered.push(...read.lines);
  });

  const joined = joinLines(ordered);
  const ligaturesDecomposed = countLigatures(joined.text);

  return {
    text: normaliseRecoveredText(joined.text),
    diagnostics: {
      pages: pages.length,
      pagesWithoutText,
      multiColumnPages,
      runningLinesRemoved: [...removed.values()],
      hyphenationsJoined: joined.hyphenationsJoined,
      hyphensKept: joined.hyphensKept,
      sentencesJoinedAcrossPages: joined.sentencesJoinedAcrossPages,
      ligaturesDecomposed,
    },
  };
}
