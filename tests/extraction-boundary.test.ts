/* @vitest-environment node
 *
 * The extraction boundary, end to end, against real files.
 *
 * Real pdf.js parses a real PDF; real mammoth parses a real DOCX. Nothing is
 * mocked — a test that mocked the parser would prove the wiring and nothing
 * about the guarantee, and the guarantee is the whole point of this boundary.
 *
 * The assertion that matters is the last one the product makes: every source
 * sentence in `negotiable-flagged.json` occurs verbatim in the extracted text,
 * byte for byte, including clause 13.2's typographic apostrophe. If this suite
 * fails, a flag citing that sentence would have been dropped at the analysis
 * boundary and the reader would have been shown less than their document
 * contains (ADR 0001).
 *
 * The fixtures were built by `tests/fixtures/build-binary-fixtures.mjs`, which
 * records what each one is designed to break.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { extractDocument, formatOfFile } from "@/lib/extraction/extract";
import {
  MAX_EXTRACTED_CHARACTERS,
  maxExtractedCharacters,
} from "@/lib/extraction/limits";
import type { Extraction } from "@/lib/extraction/outcome";
import sidecar from "@/tests/fixtures/negotiable-flagged.json";

const SOURCE_SENTENCES = sidecar.plantedClauses.map(
  (clause) => clause.sourceSentence,
);

function fixture(name: string): File {
  const bytes = readFileSync(`tests/fixtures/${name}`);
  return new File([new Uint8Array(bytes)], name);
}

async function extracted(file: File): Promise<Extraction> {
  const outcome = await extractDocument({ kind: "file", file });
  if (outcome.outcome !== "extracted") {
    throw new Error(
      `expected an extraction, got a refusal: ${outcome.refusal.reason}`,
    );
  }
  return outcome.extraction;
}

describe("a PDF with a real text layer", () => {
  it("carries every source sentence through verbatim", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.pdf"));

    /* The same plain substring match the analysis boundary performs. */
    for (const sentence of SOURCE_SENTENCES) {
      expect(extraction.text).toContain(sentence);
    }
    expect(SOURCE_SENTENCES).toHaveLength(6);
  });

  it("keeps clause 13.2's typographic apostrophe rather than folding it", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.pdf"));

    expect(extraction.text).toContain("individual’s personal assets");
    expect(extraction.text).not.toContain("individual's personal assets");
  });

  it("rejoins the words the typesetter broke at a line end", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.pdf"));

    expect(extraction.diagnostics.hyphenationsJoined).toBeGreaterThan(0);
    /* "corresponding" is split as "correspo-" / "nding" in the fixture. */
    expect(extraction.text).toContain("of the corresponding deliverable");
    expect(extraction.text).not.toContain("correspo- nding");
    expect(extraction.text).not.toContain("correspo-nding");
  });

  it("reads the two-column page in column order, not stream order", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.pdf"));

    expect(extraction.diagnostics.multiColumnPages).toEqual([
      { pageNumber: 2, columns: 2 },
    ]);
    /* The fixture writes the right column to the file before the left one. */
    expect(extraction.text.indexOf("7.2 All deliverables")).toBeLessThan(
      extraction.text.indexOf("10.1 Contractor shall defend"),
    );
  });

  it("takes the running header and footer out", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.pdf"));

    expect(extraction.text).not.toContain("MERIDIAN HARBOR GROUP LLC -");
    expect(extraction.text).not.toMatch(/Page \d of 3/);
    expect(extraction.diagnostics.runningLinesRemoved).toContain(
      "MERIDIAN HARBOR GROUP LLC - MASTER SERVICES AGREEMENT",
    );
  });

  it("carries the sentence that runs across a page boundary", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.pdf"));

    /* Clause 13.2 begins at the foot of page 2's right column and finishes at
       the top of page 3, with a footer and a header between the halves. */
    expect(extraction.diagnostics.sentencesJoinedAcrossPages).toBeGreaterThan(0);
    expect(extraction.text).toContain(
      "in the capacity of principal, member or officer of that entity personally",
    );
  });

  it("decomposes the ligatures the fixture's typeface stores", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.pdf"));

    expect(extraction.diagnostics.ligaturesDecomposed).toBeGreaterThan(0);
    expect(extraction.text).not.toMatch(/[ﬀ-ﬆ]/);
    expect(extraction.text).toContain("damages, fines, penalties");
  });

  it("reports what it read and how much of it", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.pdf"));

    expect(extraction.format).toBe("pdf");
    expect(extraction.diagnostics.pages).toBe(3);
    expect(extraction.characters).toBe(extraction.text.length);
    expect(extraction.characters).toBeGreaterThan(4000);
    expect(extraction.diagnostics.imageOnlyPages).toEqual([]);
  });
});

describe("a DOCX", () => {
  it("carries every source sentence through verbatim", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.docx"));

    for (const sentence of SOURCE_SENTENCES) {
      expect(extraction.text).toContain(sentence);
    }
  });

  it("decomposes a ligature Word stored, and keeps the curly apostrophe", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.docx"));

    expect(extraction.text).not.toMatch(/[ﬀ-ﬆ]/);
    expect(extraction.text).toContain("configurations, tooling");
    expect(extraction.text).toContain("individual’s personal assets");
  });

  it("says it came from a DOCX, and how long it is", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.docx"));

    expect(extraction.format).toBe("docx");
    expect(extraction.documentName).toBe("negotiable-flagged.docx");
    expect(extraction.characters).toBe(extraction.text.length);
  });
});

describe("an image-only PDF", () => {
  it("is refused, and never extracted", async () => {
    const outcome = await extractDocument({
      kind: "file",
      file: fixture("scan-no-text-layer.pdf"),
    });

    expect(outcome.outcome).toBe("refused");
    if (outcome.outcome !== "refused") return;
    expect(outcome.refusal.reason).toBe("no-text-layer");
  });

  it("says why, in terms a reader can act on", async () => {
    const outcome = await extractDocument({
      kind: "file",
      file: fixture("scan-no-text-layer.pdf"),
    });
    if (outcome.outcome !== "refused") throw new Error("expected a refusal");

    expect(outcome.refusal.heading).toBe("This document is a scan");
    expect(outcome.refusal.explanation).toContain("Every page in this file is an image");
    expect(outcome.refusal.whatToDo).toContain("Reading a character wrongly");
    /* No verdict, no error code, and no offer to read it anyway. */
    expect(outcome.refusal.whatToDo).not.toMatch(/try again|error|OCR/i);
  });

  it("names the pages that have no text on them", async () => {
    const outcome = await extractDocument({
      kind: "file",
      file: fixture("scan-no-text-layer.pdf"),
    });
    if (outcome.outcome !== "refused") throw new Error("expected a refusal");

    expect(outcome.refusal.imageOnlyPages).toEqual([1, 2]);
    expect(outcome.refusal.pages).toBe(2);
  });
});

describe("pasted text", () => {
  const pasted = readFileSync("tests/fixtures/negotiable-flagged.txt", "utf8");

  it("carries every source sentence through verbatim", async () => {
    const outcome = await extractDocument({
      kind: "pasted-text",
      text: pasted,
    });
    if (outcome.outcome !== "extracted") throw new Error("expected a extraction");

    for (const sentence of SOURCE_SENTENCES) {
      expect(outcome.extraction.text).toContain(sentence);
    }
    expect(outcome.extraction.format).toBe("pasted-text");
    expect(outcome.extraction.documentName).toBeNull();
  });

  it("reports its length, which is what the reader is shown", async () => {
    const outcome = await extractDocument({
      kind: "pasted-text",
      text: "4.3 Invoices are payable ninety (90) days after receipt.",
    });
    if (outcome.outcome !== "extracted") throw new Error("expected an extraction");

    expect(outcome.extraction.characters).toBe(56);
  });

  it("is refused when there is nothing in it", async () => {
    const outcome = await extractDocument({ kind: "pasted-text", text: "   \n\n " });

    expect(outcome.outcome).toBe("refused");
    if (outcome.outcome !== "refused") return;
    expect(outcome.refusal.reason).toBe("no-text-in-the-document");
  });
});

describe("a document too long to carry", () => {
  it("is refused rather than truncated", async () => {
    const text = "a".repeat(400);
    const outcome = await extractDocument(
      { kind: "pasted-text", text },
      { maxCharacters: 250 },
    );

    expect(outcome.outcome).toBe("refused");
    if (outcome.outcome !== "refused") return;
    expect(outcome.refusal.reason).toBe("too-long");
  });

  it("states the document's length and the limit, both", async () => {
    const outcome = await extractDocument(
      { kind: "pasted-text", text: "a".repeat(400) },
      { maxCharacters: 250 },
    );
    if (outcome.outcome !== "refused") throw new Error("expected a refusal");

    expect(outcome.refusal.characters).toBe(400);
    expect(outcome.refusal.limit).toBe(250);
    expect(outcome.refusal.explanation).toContain("400");
    expect(outcome.refusal.explanation).toContain("250");
    expect(outcome.refusal.whatToDo).toContain("Nothing has been cut short");
  });

  it("accepts a document exactly at the limit", async () => {
    const outcome = await extractDocument(
      { kind: "pasted-text", text: "a".repeat(250) },
      { maxCharacters: 250 },
    );

    expect(outcome.outcome).toBe("extracted");
  });

  it("caps at 250,000 characters unless the deployment says otherwise", () => {
    expect(MAX_EXTRACTED_CHARACTERS).toBe(250_000);
    /* No override is set in the suite, so the deployment runs the constant. */
    expect(maxExtractedCharacters()).toBe(250_000);
  });
});

describe("a file Redline does not read", () => {
  it("recognises the three kinds it does", () => {
    expect(formatOfFile(new File([], "agreement.pdf"))).toBe("pdf");
    expect(formatOfFile(new File([], "agreement.docx"))).toBe("docx");
    expect(formatOfFile(new File([], "agreement.txt"))).toBe("plain-text");
    expect(formatOfFile(new File([], "agreement.md"))).toBe("plain-text");
    expect(
      formatOfFile(new File([], "agreement", { type: "application/pdf" })),
    ).toBe("pdf");
  });

  it("refuses the rest by name, and says what to bring", async () => {
    const outcome = await extractDocument({
      kind: "file",
      file: new File([new Uint8Array([1, 2, 3])], "scan.jpeg", {
        type: "image/jpeg",
      }),
    });
    if (outcome.outcome !== "refused") throw new Error("expected a refusal");

    expect(outcome.refusal.reason).toBe("unsupported-file");
    expect(outcome.refusal.explanation).toContain("scan.jpeg");
    expect(outcome.refusal.whatToDo).toContain("paste the text");
  });

  it("refuses a file that will not open as the kind it claims to be", async () => {
    const outcome = await extractDocument({
      kind: "file",
      file: new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00])], "broken.docx"),
    });
    if (outcome.outcome !== "refused") throw new Error("expected a refusal");

    expect(outcome.refusal.reason).toBe("file-would-not-open");
    expect(outcome.refusal.whatToDo).toContain("Nothing has been sent");
  });
});

describe("a plain text file", () => {
  it("is read as it stands", async () => {
    const extraction = await extracted(fixture("negotiable-flagged.txt"));

    expect(extraction.format).toBe("plain-text");
    for (const sentence of SOURCE_SENTENCES) {
      expect(extraction.text).toContain(sentence);
    }
  });
});
