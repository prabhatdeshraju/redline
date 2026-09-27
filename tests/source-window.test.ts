/* @vitest-environment node
 *
 * Finding a source sentence in the reader's own text, and the passage around it.
 *
 * Run against `tests/fixtures/negotiable-flagged.txt` and the sentences
 * `negotiable-flagged.json` labels in it, so what is measured is the text the
 * product analyses rather than a string written to make a function look right.
 *
 * The two things worth holding: the sentence is never altered on its way to the
 * screen, and a sentence that occurs twice produces two windows rather than one
 * guess (ticket 04 criterion 4, ADR 0001 — the citation is the sentence, never a
 * location).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { repositoryRoot } from "@/lib/harness/corpus";
import {
  CONTEXT_CHARACTERS,
  occurrencesOf,
  sourceWindows,
} from "@/lib/operate/source-window";

const root = repositoryRoot();
const fixture = (name: string): string =>
  readFileSync(join(root, "tests", "fixtures", name), "utf8");

const documentText = fixture("negotiable-flagged.txt");

type Sidecar = {
  readonly plantedClauses: readonly {
    readonly clauseType: string;
    readonly sourceSentence: string;
  }[];
};

const planted = (JSON.parse(fixture("negotiable-flagged.json")) as Sidecar)
  .plantedClauses;

const guaranteeSentence = planted.find(
  (clause) => clause.clauseType === "personal-guarantee",
)?.sourceSentence;

if (guaranteeSentence === undefined) {
  throw new Error("negotiable-flagged.json no longer labels a personal guarantee");
}

describe("locating the sentence", () => {
  it("finds every labelled sentence in the text it was labelled against", () => {
    for (const clause of planted) {
      expect(
        occurrencesOf(documentText, clause.sourceSentence),
        clause.clauseType,
      ).toHaveLength(1);
    }
  });

  it("finds a sentence the document states more than once, in document order", () => {
    const twice = `${documentText}\n\nSCHEDULE 2\n\n${guaranteeSentence}\n`;
    const at = occurrencesOf(twice, guaranteeSentence);

    expect(at).toHaveLength(2);
    expect(at[0]).toBeLessThan(at[1]);
    for (const index of at) {
      expect(twice.slice(index, index + guaranteeSentence.length)).toBe(
        guaranteeSentence,
      );
    }
  });

  it("finds nothing when the sentence is not in the text", () => {
    expect(
      occurrencesOf(documentText, "Contractor waives every right of every kind."),
    ).toEqual([]);
  });

  it("finds nothing for an empty sentence, rather than everywhere", () => {
    /* An empty string occurs at every position. Answering "position 0" would put
       a window around a sentence that does not exist. */
    expect(occurrencesOf(documentText, "")).toEqual([]);
  });

  it("matches exactly as the gate matches: no folding, no trimming", () => {
    const folded = guaranteeSentence.replace(/’/g, "'");

    expect(guaranteeSentence).toMatch(/’/);
    expect(occurrencesOf(documentText, folded)).toEqual([]);
    expect(occurrencesOf(documentText, guaranteeSentence.toLowerCase())).toEqual([]);
  });
});

describe("the passage around it", () => {
  const [window] = sourceWindows(documentText, guaranteeSentence);

  it("carries the sentence unaltered", () => {
    expect(window.sentence).toBe(guaranteeSentence);
  });

  it("reassembles the document exactly, so nothing was silently repaired", () => {
    const rebuilt = window.before + window.sentence + window.after;

    expect(documentText).toContain(rebuilt);
    expect(documentText.slice(window.index, window.index + guaranteeSentence.length)).toBe(
      guaranteeSentence,
    );
  });

  it("carries the clause before it and the clause after it", () => {
    expect(window.before).toContain(
      "13.1 Contractor may perform the Services through",
    );
    expect(window.after).toContain("14. GENERAL");
  });

  it("says that the passage was cut at both ends, because it was", () => {
    expect(window.cutBefore).toBe(true);
    expect(window.cutAfter).toBe(true);
  });

  it("stays inside the margin it was given, either side", () => {
    expect(window.before.length).toBeLessThanOrEqual(CONTEXT_CHARACTERS);
    expect(window.after.length).toBeLessThanOrEqual(CONTEXT_CHARACTERS);
    expect(window.before.length).toBeGreaterThan(0);
    expect(window.after.length).toBeGreaterThan(0);
  });

  it("opens and closes at a boundary a reader can read from", () => {
    /* Not mid-word: the character before the window and the one after it are
       whitespace or the ends of the document. */
    const before = documentText[window.index - window.before.length - 1];
    const after =
      documentText[window.index + guaranteeSentence.length + window.after.length];

    expect(before === undefined || /\s/.test(before)).toBe(true);
    expect(after === undefined || /\s/.test(after)).toBe(true);
  });

  it("opens at the start of the text when the sentence is near the top", () => {
    const opening =
      "This Master Services Agreement (this \"Agreement\") is made as of 14 March 2026";
    const [first] = sourceWindows(documentText, opening);

    expect(first.cutBefore).toBe(false);
    expect(documentText.startsWith(first.before)).toBe(true);
  });

  it("closes at the end of the text when the sentence is near the bottom", () => {
    const closing = "Individual signing as guarantor under Section 13.2";
    const [last] = sourceWindows(documentText, closing);

    expect(last.cutAfter).toBe(false);
    expect(documentText.endsWith(last.sentence + last.after)).toBe(true);
  });

  it("numbers every occurrence of a repeated sentence, and counts them", () => {
    const twice = `${documentText}\n\nSCHEDULE 2 — GUARANTEE RESTATED\n\n${guaranteeSentence}\n`;
    const windows = sourceWindows(twice, guaranteeSentence);

    expect(windows).toHaveLength(2);
    expect(windows.map((each) => each.occurrence)).toEqual([1, 2]);
    for (const each of windows) {
      expect(each.occurrences).toBe(2);
      expect(each.sentence).toBe(guaranteeSentence);
    }
    expect(windows[1].before).toContain("SCHEDULE 2 — GUARANTEE RESTATED");
  });

  it("returns nothing at all when the sentence is not in this text", () => {
    expect(sourceWindows("Some other extraction.", guaranteeSentence)).toEqual([]);
  });
});
