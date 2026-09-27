/* The character rule.
 *
 * Two halves, and getting either of them backwards breaks the product's central
 * claim in a way nobody would notice until a reader searched their own copy and
 * came up empty. Ligatures are decomposed because a typeface stored one
 * character where the writer typed two. Quotation marks and apostrophes are left
 * exactly as they are because the writer typed them.
 */

import { describe, expect, it } from "vitest";

import {
  countLigatures,
  decomposeLigatures,
  normaliseRecoveredText,
} from "@/lib/extraction/normalise";

describe("ligatures are decomposed", () => {
  it("covers the five the ticket names and the two long-s pairs", () => {
    expect(decomposeLigatures("ﬀ")).toBe("ff");
    expect(decomposeLigatures("ﬁ")).toBe("fi");
    expect(decomposeLigatures("ﬂ")).toBe("fl");
    expect(decomposeLigatures("ﬃ")).toBe("ffi");
    expect(decomposeLigatures("ﬄ")).toBe("ffl");
    expect(decomposeLigatures("ﬅ")).toBe("st");
    expect(decomposeLigatures("ﬆ")).toBe("st");
  });

  it("makes the word searchable in the reader's own copy", () => {
    expect(normaliseRecoveredText("conﬁdential inﬂuence")).toBe(
      "confidential influence",
    );
    expect(normaliseRecoveredText("its aﬃliates and oﬃcers")).toBe(
      "its affiliates and officers",
    );
  });

  it("counts what it changed, so extraction can say so", () => {
    expect(countLigatures("any ﬁnes, penalties or ﬁve dollars")).toBe(2);
    expect(countLigatures("any fines, penalties or five dollars")).toBe(0);
  });

  it("leaves letters that are not typesetting artefacts alone", () => {
    /* æ, œ and ß are letters in their own right. */
    expect(normaliseRecoveredText("Æsop, œuvre, Straße")).toBe(
      "Æsop, œuvre, Straße",
    );
  });
});

describe("typographic punctuation is not folded", () => {
  it("keeps a curly apostrophe exactly as the document has it", () => {
    const asTyped = "against that individual’s personal assets";

    expect(normaliseRecoveredText(asTyped)).toBe(asTyped);
    expect(normaliseRecoveredText(asTyped)).toContain("’");
    expect(normaliseRecoveredText(asTyped)).not.toContain("'");
  });

  it("keeps an ASCII apostrophe exactly as the document has it", () => {
    const asTyped = "including reasonable attorneys' fees";

    expect(normaliseRecoveredText(asTyped)).toBe(asTyped);
    expect(normaliseRecoveredText(asTyped)).not.toContain("’");
  });

  it("keeps curly quotation marks, dashes and ellipses", () => {
    const asTyped = "“Agreement” — a term – or two…";

    expect(normaliseRecoveredText(asTyped)).toBe(asTyped);
  });
});

describe("characters that are an artefact of the file", () => {
  it("turns space-like characters into a plain space", () => {
    expect(normaliseRecoveredText("ninety (90) days")).toBe(
      "ninety (90) days",
    );
    expect(normaliseRecoveredText("a\tb")).toBe("a b");
  });

  it("drops the invisible ones", () => {
    expect(normaliseRecoveredText("inde­mnify")).toBe("indemnify");
    expect(normaliseRecoveredText("﻿Client​ Materials")).toBe(
      "Client Materials",
    );
  });

  it("collapses a run of spaces, which extraction infers rather than reads", () => {
    expect(normaliseRecoveredText("Client   shall    pay")).toBe(
      "Client shall pay",
    );
  });

  it("normalises line endings and leaves one blank line between paragraphs", () => {
    expect(normaliseRecoveredText("one\r\ntwo\r\n\r\n\r\n\r\nthree")).toBe(
      "one\ntwo\n\nthree",
    );
  });

  it("trims the indent a layout put on a line, not the words on it", () => {
    expect(normaliseRecoveredText("   4.3 Invoices are payable   ")).toBe(
      "4.3 Invoices are payable",
    );
  });
});
