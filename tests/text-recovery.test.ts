/* The text-recovery functions, one failure mode at a time.
 *
 * Every case here is a way a PDF breaks verbatim matching. The input is written
 * by the test, in the shape a PDF parser reports: runs of glyphs with
 * coordinates. Nothing is parsed, nothing is mocked, and the assertion is always
 * the same one the product makes later — does this sentence occur in that text.
 */

import { describe, expect, it } from "vitest";

import {
  decideJoin,
  findColumnBoundaries,
  findRunningLines,
  gapsInRow,
  groupIntoLines,
  hyphenatedCompounds,
  joinLines,
  orderForReading,
  recoverText,
  rowsOf,
  splitRowAtBoundaries,
  stripRunningLines,
  type ParsedPage,
  type PositionedTextItem,
  type RecoveredLine,
} from "@/lib/extraction/text-recovery";

/* ---- a tiny layout, in the units a PDF uses ---- */

const SIZE = 9;
/** Courier advances every glyph by exactly 0.6em, so a run's width is known. */
const GLYPH = SIZE * 0.6;
const LEADING = 12.6;

/** One run of glyphs at a position. */
function run(text: string, x: number, y: number, fontSize = SIZE): PositionedTextItem {
  return { text, x, y, width: text.length * fontSize * 0.6, fontSize };
}

/** A line of text, reported the way pdf.js reports one: split into word runs
 *  with the spaces between them as runs of their own. */
function words(text: string, x: number, y: number, fontSize = SIZE): PositionedTextItem[] {
  const items: PositionedTextItem[] = [];
  let cursor = x;
  for (const part of text.split(/( )/)) {
    if (part.length === 0) continue;
    items.push(run(part, cursor, y, fontSize));
    cursor += part.length * fontSize * 0.6;
  }
  return items;
}

function page(
  pageNumber: number,
  items: PositionedTextItem[],
  { width = 612, height = 792 } = {},
): ParsedPage {
  return { pageNumber, width, height, items };
}

/** Lay out a column of lines from a top baseline downwards. */
function column(
  lines: readonly string[],
  x: number,
  top: number,
  fontSize = SIZE,
): PositionedTextItem[] {
  return lines.flatMap((text, index) =>
    words(text, x, top - index * LEADING, fontSize),
  );
}

function asLine(
  text: string,
  x: number,
  y: number,
  pageNumber = 1,
): RecoveredLine {
  return {
    text,
    x,
    right: x + text.length * GLYPH,
    y,
    fontSize: SIZE,
    pageNumber,
  };
}

/* ------------------------------------------------------------------ */

describe("rows and lines", () => {
  it("joins the word runs on one baseline back into a line of text", () => {
    const lines = groupIntoLines(
      page(1, words("Contractor shall indemnify Client.", 45, 700)),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe("Contractor shall indemnify Client.");
  });

  it("infers a space from a gap where the parser reported none", () => {
    /* Two runs with a full glyph's worth of space between them and no space run
       of their own — which is what a PDF using positioned text does. */
    const lines = groupIntoLines(
      page(1, [run("Contractor", 45, 700), run("shall", 45 + 11 * GLYPH, 700)]),
    );

    expect(lines[0].text).toBe("Contractor shall");
  });

  it("does not invent a space between runs that are touching", () => {
    const lines = groupIntoLines(
      page(1, [run("Contrac", 45, 700), run("tor", 45 + 7 * GLYPH, 700)]),
    );

    expect(lines[0].text).toBe("Contractor");
  });

  it("keeps lines in top-to-bottom order whatever order the parser gave them", () => {
    const first = words("first line", 45, 700);
    const second = words("second line", 45, 687);
    const lines = groupIntoLines(page(1, [...second, ...first]));

    expect(lines.map((line) => line.text)).toEqual(["first line", "second line"]);
  });

  it("keeps a footnote off the line above it, because the tolerance scales", () => {
    const body = words("body text at nine point", 45, 100);
    const note = words("a footnote at six point", 45, 92, 6);
    const lines = groupIntoLines(page(1, [...body, ...note]));

    expect(lines).toHaveLength(2);
  });

  it("reports the gaps inside a row", () => {
    const row = rowsOf([run("left", 45, 700), run("right", 300, 700)])[0];

    expect(gapsInRow(row, 20)).toEqual([
      { start: 45 + 4 * GLYPH, end: 300 },
    ]);
    expect(gapsInRow(row, 400)).toEqual([]);
  });
});

describe("column order", () => {
  /* A two-column page: both columns share their baselines, which is what makes
     this hard — grouping by baseline alone welds them together. */
  const LEFT = [
    "7.2 All deliverables, works in progress and",
    "any other material Contractor creates in",
    "connection with the Services are works made",
    "for hire owned exclusively by Client.",
    "7.3 Contractor shall execute any document",
    "that Client reasonably requests to perfect",
    "that ownership, at Client's expense.",
  ];
  const RIGHT = [
    "10.1 Contractor shall indemnify Client from",
    "and against any and all claims arising out",
    "of or connected with the Services, whether",
    "or not caused by any act or omission of",
    "Contractor, and this obligation is not",
    "subject to any cap on liability.",
    "10.2 Client shall control the defence.",
  ];

  const twoColumns = page(1, [
    /* Written right column first on purpose: several producers do this, and
       reading order must not come from stream order. */
    ...column(RIGHT, 321, 686),
    ...column(LEFT, 45, 686),
  ]);

  it("finds the gutter", () => {
    expect(findColumnBoundaries(twoColumns)).toHaveLength(1);
  });

  it("reads the left column to its foot before starting the right", () => {
    const boundaries = findColumnBoundaries(twoColumns);
    const lines = orderForReading(
      groupIntoLines(twoColumns, boundaries),
      boundaries,
    );

    expect(lines.columns).toBe(2);
    expect(lines.lines.map((line) => line.text)).toEqual([...LEFT, ...RIGHT]);
  });

  it("recovers a sentence that sits inside one column", () => {
    const { text } = recoverText([twoColumns]);

    expect(text).toContain(
      "7.2 All deliverables, works in progress and any other material " +
        "Contractor creates in connection with the Services are works made for " +
        "hire owned exclusively by Client.",
    );
  });

  it("does not interleave the two columns", () => {
    const { text } = recoverText([twoColumns]);

    expect(text).not.toContain("progress and 10.1");
  });

  it("is not fooled into finding a column on a single-column page", () => {
    const single = page(
      1,
      column(
        [
          "4.3 Invoices are payable ninety (90) days after Client's receipt and",
          "acceptance of the corresponding deliverable, acceptance is at Client's",
          "sole discretion, and Client may withhold payment of any invoice in whole",
          "or in part while any other matter between the Parties remains",
          "unresolved.",
          "4.4 Contractor shall bear Contractor's own expenses.",
        ],
        45,
        700,
      ),
    );

    expect(findColumnBoundaries(single)).toEqual([]);
  });

  it("is not fooled by a signature block, where one row has a wide gap", () => {
    const withSignatures = page(1, [
      ...column(
        [
          "14.10 This Agreement may be signed in counterparts, including by",
          "electronic signature, each of which is an original and all of which",
          "together constitute one instrument.",
        ],
        45,
        700,
      ),
      ...words("Name:", 45, 600),
      ...words("Date:", 400, 600),
    ]);

    expect(findColumnBoundaries(withSignatures)).toEqual([]);
  });

  it("finds the gutter even under a heading that spans both columns", () => {
    const withHeading = page(1, [
      ...words(
        "PART II - INTELLECTUAL PROPERTY, INDEMNIFICATION AND LIABILITY",
        45,
        720,
      ),
      ...column(RIGHT, 321, 686),
      ...column(LEFT, 45, 686),
    ]);

    expect(findColumnBoundaries(withHeading)).toHaveLength(1);
  });

  it("finds the gutter even under a footer set straight across it", () => {
    const withFooter = page(1, [
      ...column(RIGHT, 321, 686),
      ...column(LEFT, 45, 686),
      /* A centred "Page 1 of 3" sits over the gutter. Being in the bottom band
         of the page is what keeps it out of the way. */
      ...words("Page 1 of 3", 282, 36),
    ]);

    expect(findColumnBoundaries(withFooter)).toHaveLength(1);
  });

  it("leaves a row whose glyphs run through the gutter whole", () => {
    const boundaries = [305];
    const footer = rowsOf(words("Page 1 of 3", 282, 36));

    expect(splitRowAtBoundaries(footer[0], boundaries)).toHaveLength(1);
  });

  it("cuts a row that has a real gap at the gutter", () => {
    const row = rowsOf([
      ...words("left column text", 45, 686),
      ...words("right column text", 321, 686),
    ])[0];

    const segments = splitRowAtBoundaries(row, [305]);
    expect(segments).toHaveLength(2);
  });
});

describe("running headers and footers", () => {
  const header = "MERIDIAN HARBOR GROUP LLC - MASTER SERVICES AGREEMENT";

  const pages = [1, 2, 3].map((number) =>
    page(number, [
      ...words(header, 45, 752, 8),
      ...column(
        [
          `body of page ${number}, first line`,
          "second line of the body",
          "third line of the body",
          "fourth line of the body",
        ],
        45,
        700,
      ),
      ...words(`Page ${number} of 3`, 282, 36, 8),
    ]),
  );

  const perPage = pages.map((each) => groupIntoLines(each));

  it("recognises a header repeated on every page", () => {
    expect(findRunningLines(perPage)).toContain(header.toLowerCase());
  });

  it("recognises a footer whose page number changes", () => {
    /* The digits are blanked before comparing, so "Page 1 of 3" and
       "Page 2 of 3" are the same piece of furniture. */
    expect(findRunningLines(perPage)).toContain("page # of #");
  });

  it("takes them out of the text", () => {
    const running = findRunningLines(perPage);
    const kept = stripRunningLines(perPage[1], running);

    expect(kept.map((line) => line.text)).toEqual([
      "body of page 2, first line",
      "second line of the body",
      "third line of the body",
      "fourth line of the body",
    ]);
  });

  it("leaves the body alone on a one-page document", () => {
    expect(findRunningLines([perPage[0]]).size).toBe(0);
  });

  it("does not treat a sentence that repeats in the body as furniture", () => {
    const repeated = "This Agreement is governed by the laws of Delaware.";
    const twoPages = [1, 2].map((number) =>
      page(number, [
        ...words(header, 45, 752, 8),
        ...column(
          ["clause one", repeated, "clause three", "clause four"],
          45,
          700,
        ),
      ]),
    );

    const running = findRunningLines(twoPages.map((each) => groupIntoLines(each)));
    expect(running).not.toContain(repeated.toLowerCase());
    expect(running).toContain(header.toLowerCase());
  });
});

describe("hyphenation at a line end", () => {
  it("rejoins a word the typesetter broke", () => {
    const lines = [
      asLine("the individual signing below uncondi-", 45, 700),
      asLine("tionally guarantees every obligation.", 45, 687),
    ];

    expect(joinLines(lines).text).toBe(
      "the individual signing below unconditionally guarantees every obligation.",
    );
    expect(joinLines(lines).hyphenationsJoined).toBe(1);
  });

  it("keeps a hyphen the writer typed, when the document uses that compound", () => {
    /* "third-party" is broken at its own hyphen. The evidence that the hyphen
       belongs to the writer is that the document writes it out in full
       somewhere it did not have to break it. */
    const lines = [
      asLine("Client will reimburse travel and third-", 45, 700),
      asLine("party costs approved in advance.", 45, 687),
      asLine("A third-party claim is not covered.", 45, 661),
    ];

    const joined = joinLines(lines);
    expect(joined.text).toContain("travel and third-party costs");
    expect(joined.hyphensKept).toBe(1);
    expect(joined.hyphenationsJoined).toBe(0);
  });

  it("drops the hyphen when the document gives no such evidence", () => {
    const lines = [
      asLine("Client will reimburse travel and third-", 45, 700),
      asLine("party costs approved in advance.", 45, 687),
    ];

    expect(joinLines(lines).text).toContain("travel and thirdparty costs");
  });

  it("keeps a hyphen before a capital, which is never a broken word", () => {
    const lines = [
      asLine("governed by the law of the Anglo-", 45, 700),
      asLine("American common law tradition.", 45, 687),
    ];

    expect(joinLines(lines).text).toContain("Anglo-American");
  });

  it("collects the compounds a document writes out in full", () => {
    const compounds = hyphenatedCompounds([
      asLine("any general-purpose tools or third-party libraries", 45, 700),
      asLine("broken at a line end here: work-", 45, 687),
    ]);

    expect(compounds.has("general-purpose")).toBe(true);
    expect(compounds.has("third-party")).toBe(true);
    /* The token at a line end is the case we cannot use as evidence. */
    expect([...compounds].some((each) => each.startsWith("work"))).toBe(false);
  });
});

describe("paragraphs and page boundaries", () => {
  it("breaks a paragraph on a gap wider than the page's own leading", () => {
    const lines = [
      asLine("3.4 Contractor shall perform such additional tasks as", 45, 700),
      asLine("Client reasonably requests, at no additional charge.", 45, 687.4),
      /* A clear paragraph gap: twice the leading. */
      asLine("3.5 Client's failure to sign a change order does not", 45, 662.2),
      asLine("relieve Contractor of the obligation to continue.", 45, 649.6),
    ];

    expect(joinLines(lines).text).toBe(
      "3.4 Contractor shall perform such additional tasks as Client reasonably " +
        "requests, at no additional charge.\n\n" +
        "3.5 Client's failure to sign a change order does not relieve " +
        "Contractor of the obligation to continue.",
    );
  });

  it("carries an unfinished sentence across a page break", () => {
    const lines = [
      asLine("Client may proceed directly against that individual's", 45, 80, 1),
      asLine("personal assets without first proceeding against", 45, 700, 2),
    ];

    const joined = joinLines(lines);
    expect(joined.text).toBe(
      "Client may proceed directly against that individual's personal assets " +
        "without first proceeding against",
    );
    expect(joined.sentencesJoinedAcrossPages).toBe(1);
  });

  it("starts a new paragraph across a page break when the sentence had finished", () => {
    const lines = [
      asLine("...and to injunctive relief of any kind.", 45, 80, 1),
      asLine("13. GUARANTEE", 45, 700, 2),
    ];

    expect(joinLines(lines).text).toContain("any kind.\n\n13. GUARANTEE");
  });

  it("does not treat a line ending in an apostrophe as a finished sentence", () => {
    const lines = [
      asLine("the fees paid in the preceding thirty (30) days'", 45, 80, 1),
      asLine("notice period, whichever is the lesser.", 45, 700, 2),
    ];

    expect(joinLines(lines).text).toBe(
      "the fees paid in the preceding thirty (30) days' notice period, " +
        "whichever is the lesser.",
    );
  });

  it("names the four ways two lines can join", () => {
    const context = { medianLineGap: 12.6, compounds: new Set(["third-party"]) };

    expect(
      decideJoin(asLine("uncondi-", 45, 700), asLine("tionally", 45, 687), context),
    ).toEqual({ kind: "dehyphenate" });
    expect(
      decideJoin(asLine("third-", 45, 700), asLine("party", 45, 687), context),
    ).toEqual({ kind: "keep-hyphen" });
    expect(
      decideJoin(asLine("a sentence.", 45, 700), asLine("Another one.", 45, 660), context),
    ).toEqual({ kind: "paragraph" });
    expect(
      decideJoin(asLine("a sentence that", 45, 700), asLine("continues", 45, 687), context),
    ).toEqual({ kind: "space" });
  });
});

describe("a sentence interrupted by a running header", () => {
  /* The case the whole module exists for. A clause runs off the bottom of one
     page and picks up at the top of the next, with a header and a footer sitting
     between the two halves in the file. */
  const header = "MERIDIAN HARBOR GROUP LLC - MASTER SERVICES AGREEMENT";
  const sentence =
    "Contractor shall defend, indemnify and hold harmless Client from and " +
    "against any and all claims arising out of or in any way connected with " +
    "the Services, whether or not caused by any act or omission of Contractor.";

  const pages = [
    page(1, [
      ...words(header, 45, 752, 8),
      ...column(
        [
          "10. INDEMNIFICATION",
          "10.1 Contractor shall defend, indemnify and hold harmless Client from and",
          "against any and all claims arising out of or in any way connected with",
        ],
        45,
        700,
      ),
      ...words("Page 1 of 2", 282, 36, 8),
    ]),
    page(2, [
      ...words(header, 45, 752, 8),
      ...column(
        [
          "the Services, whether or not caused by any act or omission of Contractor.",
          "10.2 Client shall control the defence of any such claim.",
        ],
        45,
        700,
      ),
      ...words("Page 2 of 2", 282, 36, 8),
    ]),
  ];

  it("recovers the sentence whole, word for word", () => {
    const { text } = recoverText(pages);

    expect(text).toContain(`10.1 ${sentence}`);
  });

  it("does not splice the header into the middle of it", () => {
    const { text } = recoverText(pages);

    expect(text).not.toContain(header);
    expect(text).not.toContain("Page 1 of 2");
  });

  it("says what it had to repair", () => {
    const { diagnostics } = recoverText(pages);

    expect(diagnostics.pages).toBe(2);
    expect(diagnostics.sentencesJoinedAcrossPages).toBe(1);
    expect(diagnostics.runningLinesRemoved).toContain(header);
    expect(diagnostics.pagesWithoutText).toEqual([]);
  });
});

describe("ligatures", () => {
  it("come out as the characters the writer typed", () => {
    const { text, diagnostics } = recoverText([
      page(
        1,
        column(
          [
            "its aﬃliates and oﬃcers, including any ﬁnes, penalties",
            "and conﬁdential inﬂuence.",
          ],
          45,
          700,
        ),
      ),
    ]);

    expect(text).toContain("its affiliates and officers, including any fines");
    expect(text).toContain("confidential influence.");
    expect(diagnostics.ligaturesDecomposed).toBe(5);
  });
});

describe("a page with no text on it", () => {
  it("is named rather than passed over in silence", () => {
    const { diagnostics } = recoverText([
      page(1, column(["clause one"], 45, 700)),
      page(2, []),
      page(3, column(["clause three"], 45, 700)),
    ]);

    expect(diagnostics.pagesWithoutText).toEqual([2]);
  });
});
