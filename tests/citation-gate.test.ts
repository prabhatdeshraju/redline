/* @vitest-environment node
 *
 * The citation gate, against a real document and real labelled clauses.
 *
 * Nothing here is mocked, and nothing is a toy string: the text is a corpus
 * document as committed, and the flags are built from that document's own labels,
 * which is what a correct analysis of it would produce. The corruptions are real
 * inputs — one character changed, a sentence lifted out of another document —
 * because the gate's whole job is to tell those from a sentence that is there.
 *
 * The five ways a match could be loosened are each asserted to fail: case,
 * leading and trailing space, an apostrophe folded to ASCII, whitespace
 * collapsed, and an empty quotation. Every one of them is a way a reader could
 * search their own copy and not find the sentence they were shown (ADR 0001).
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import type { Analysis, Flag } from "@/lib/analysis/analysis";
import {
  applyCitationGate,
  citationReason,
  isAllClear,
} from "@/lib/analysis/citation-gate";
import { defectSide } from "@/lib/analysis/defects";
import { loadCorpus } from "@/lib/harness/corpus";

const corpus = loadCorpus();

function document(id: string) {
  const found = corpus.documents.find((each) => each.id === id);
  if (!found) throw new Error(`no corpus document ${id}`);
  return found;
}

function textOf(id: string): string {
  return readFileSync(document(id).path, "utf8");
}

/** The analysis a correct reading of this document would produce. */
function analysisOf(id: string): Analysis {
  return {
    flags: document(id).labels.plantedClauses.map((clause) => ({
      clauseType: clause.clauseType,
      severity: clause.severity,
      sourceSentence: clause.sourceSentence,
      whatItPermits: clause.whatItPermits,
    })),
  };
}

const LEASE = "equipment-lease";
const leaseText = textOf(LEASE);
const leaseAnalysis = analysisOf(LEASE);

function corrupt(
  analysis: Analysis,
  index: number,
  change: (sentence: string) => string,
): Analysis {
  return {
    flags: analysis.flags.map((flag, at) =>
      at === index
        ? { ...flag, sourceSentence: change(flag.sourceSentence) }
        : flag,
    ),
  };
}

describe("a correct analysis passes through unchanged", () => {
  it("keeps every flag and records that it checked them", () => {
    const gated = applyCitationGate(leaseAnalysis, leaseText);

    expect(leaseAnalysis.flags.length).toBeGreaterThanOrEqual(5);
    expect(gated.flags).toEqual(leaseAnalysis.flags);
    expect(gated.citations.checked).toBe(leaseAnalysis.flags.length);
    expect(gated.citations.cited).toBe(leaseAnalysis.flags.length);
    expect(gated.citations.dropped).toEqual([]);
  });

  it("does not alter the analysis it was given", () => {
    const before = JSON.stringify(leaseAnalysis);
    applyCitationGate(leaseAnalysis, leaseText);

    expect(JSON.stringify(leaseAnalysis)).toBe(before);
  });
});

describe("a flag whose sentence is not in the text is dropped and counted", () => {
  it("drops the one character that changed and keeps the rest", () => {
    const damaged = corrupt(leaseAnalysis, 0, (sentence) => {
      const at = Math.floor(sentence.length / 2);
      return `${sentence.slice(0, at)}${sentence[at] === "e" ? "a" : "e"}${sentence.slice(at + 1)}`;
    });

    const gated = applyCitationGate(damaged, leaseText);

    expect(gated.citations.checked).toBe(damaged.flags.length);
    expect(gated.citations.cited).toBe(damaged.flags.length - 1);
    expect(gated.citations.dropped).toHaveLength(1);
    expect(gated.citations.dropped[0].reason).toBe("not-in-the-document");
    expect(gated.citations.dropped[0].flag.clauseType).toBe(
      leaseAnalysis.flags[0].clauseType,
    );
    expect(gated.flags).not.toContain(damaged.flags[0]);
  });

  it("drops a sentence quoted verbatim out of a different document", () => {
    /* A real sentence, out of a real document, which is not this document. */
    const fromElsewhere =
      document("agency-services-agreement").labels.plantedClauses[0]
        .sourceSentence;
    expect(textOf("agency-services-agreement")).toContain(fromElsewhere);
    expect(leaseText).not.toContain(fromElsewhere);

    const damaged = corrupt(leaseAnalysis, 1, () => fromElsewhere);
    const gated = applyCitationGate(damaged, leaseText);

    expect(gated.citations.dropped).toHaveLength(1);
    expect(gated.citations.dropped[0].reason).toBe("not-in-the-document");
  });

  it("drops every flag when none of them quotes this document", () => {
    const otherText = textOf("agency-services-agreement");
    const gated = applyCitationGate(leaseAnalysis, otherText);

    expect(gated.flags).toEqual([]);
    expect(gated.citations.dropped).toHaveLength(leaseAnalysis.flags.length);
  });
});

describe("the match is not loosened in any of the ways that would break it", () => {
  const first = leaseAnalysis.flags[0].sourceSentence;

  it("is case-sensitive", () => {
    expect(citationReason(first.toLowerCase(), leaseText)).toBe(
      "not-in-the-document",
    );
    expect(citationReason(first.toUpperCase(), leaseText)).toBe(
      "not-in-the-document",
    );
  });

  it("does not trim", () => {
    expect(citationReason(`${first} `, leaseText)).toBe("not-in-the-document");
    expect(citationReason(`\t${first}`, leaseText)).toBe("not-in-the-document");

    /* One leading space is the exception that shows the rule: the clause number
       precedes the sentence in the document, so " Each individual..." really is
       in the text. The match is literal in both directions. */
    expect(citationReason(` ${first}`, leaseText)).toBeNull();
  });

  it("does not collapse whitespace", () => {
    expect(citationReason(first.replace(" ", "  "), leaseText)).toBe(
      "not-in-the-document",
    );
  });

  it("does not fold a typographic apostrophe to an ASCII one", () => {
    /* The master services agreement's guarantee carries U+2019 deliberately. A
       flag that quoted it with an ASCII apostrophe would be a sentence the reader
       could not find by searching their own copy. */
    const withCurly = document("msa-flagged-text").labels.plantedClauses.find(
      (clause) => clause.sourceSentence.includes("’"),
    );
    expect(withCurly).toBeDefined();
    const text = textOf("msa-flagged-text");

    expect(citationReason(withCurly!.sourceSentence, text)).toBeNull();
    expect(
      citationReason(withCurly!.sourceSentence.replace("’", "'"), text),
    ).toBe("not-in-the-document");
  });

  it("drops a flag that quotes nothing, which would otherwise match everything", () => {
    expect(citationReason("", leaseText)).toBe("empty-source-sentence");
    expect(citationReason("   \n ", leaseText)).toBe("empty-source-sentence");

    const gated = applyCitationGate(
      { flags: [{ ...leaseAnalysis.flags[0], sourceSentence: "" }] },
      leaseText,
    );
    expect(gated.flags).toEqual([]);
    expect(gated.citations.dropped[0].reason).toBe("empty-source-sentence");
  });
});

describe("an analysis emptied by the gate is not an all-clear", () => {
  it("is an all-clear when nothing was flagged and nothing was dropped", () => {
    const gated = applyCitationGate({ flags: [] }, leaseText);

    expect(isAllClear(gated)).toBe(true);
  });

  it("is not an all-clear when every flag was dropped", () => {
    const gated = applyCitationGate(
      leaseAnalysis,
      textOf("agency-services-agreement"),
    );

    expect(gated.flags).toEqual([]);
    expect(isAllClear(gated)).toBe(false);
  });
});

describe("a drop is an extraction defect, not an analysis defect", () => {
  it("puts a dropped citation behind the extraction boundary", () => {
    expect(defectSide("source-sentence-not-in-the-document")).toBe("extraction");
    expect(defectSide("source-sentence-did-not-survive-extraction")).toBe(
      "extraction",
    );
  });

  it("puts a wrong-but-citable flag on the analysis side", () => {
    expect(defectSide("flag-for-an-unlabelled-clause-type")).toBe("analysis");
    expect(defectSide("labelled-clause-not-flagged")).toBe("analysis");
    expect(defectSide("all-clear-on-a-document-labelled-as-flagged")).toBe(
      "analysis",
    );
  });
});

describe("the flag type cannot carry a missing source sentence", () => {
  it("requires the field, which a compile-time check is the only way to state", () => {
    /* `sourceSentence` is a required string on Flag. This asserts the runtime
       consequence the type is there to guarantee: a value built without one does
       not survive the gate, whatever it claimed at the type level. */
    const { sourceSentence, ...withoutASentence } = leaseAnalysis.flags[0];
    expect(sourceSentence.length).toBeGreaterThan(0);

    const gated = applyCitationGate(
      { flags: [withoutASentence as unknown as Flag] },
      leaseText,
    );

    expect(gated.flags).toEqual([]);
    expect(gated.citations.dropped).toHaveLength(1);
  });
});
