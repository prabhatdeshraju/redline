/* @vitest-environment node
 *
 * The corpus is data, and these are the properties every number measured against
 * it depends on.
 *
 * The one that matters most is the last: every one of the eight clause types has
 * at least one labelled instance. A clause type with nothing labelled is a clause
 * type nothing can be claimed about, and aggregate recall would hide it — which is
 * the exact failure `PRD.md` §4.2 warns about.
 *
 * The validation in the loader is tested by handing it a corpus that disagrees
 * with itself, because validation nobody has seen reject anything is not
 * validation.
 */

import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CLAUSE_TYPES, severityOf } from "@/lib/analysis/taxonomy";
import {
  PROVENANCE_VALUES,
  labelledClausesOf,
  loadCorpus,
  type CorpusDocument,
} from "@/lib/harness/corpus";

const corpus = loadCorpus();
const plainText = corpus.documents.filter(
  (each) => each.format === "plain-text",
);

function contentsOf(document: CorpusDocument): string {
  return readFileSync(document.path, "utf8");
}

describe("the manifest", () => {
  it("enumerates documents with an id, a path, a type, a provenance and labels", () => {
    expect(corpus.documents.length).toBeGreaterThanOrEqual(10);

    for (const each of corpus.documents) {
      expect(each.id, each.id).toMatch(/^[a-z0-9-]+$/);
      expect(PROVENANCE_VALUES, each.id).toContain(each.provenance);
      expect(["negotiable", "adhesion"], each.id).toContain(each.documentType);
      expect(each.labels.title.length, each.id).toBeGreaterThan(0);
      expect(each.note.length, each.id).toBeGreaterThan(20);
      expect(() => readFileSync(each.path)).not.toThrow();
      expect(() => readFileSync(each.labelsPath)).not.toThrow();
    }
  });

  it("records every document's provenance, and says plainly that they are authored", () => {
    /* The corpus is authored for this repository rather than made of real
       negotiable documents. That is recorded per document, not only in prose, so
       a real document added later is distinguishable from one of these without
       reading the README. */
    for (const each of corpus.documents) {
      expect(each.provenance, each.id).toBe("authored-for-this-repo");
    }

    const readme = readFileSync("tests/corpus/README.md", "utf8");
    expect(readme).toMatch(/authored/i);
    expect(readme).toMatch(/weaker evidence/i);
  });

  it("gives every document a role the harness knows what to do with", () => {
    const roles = corpus.documents.map((each) => each.role);

    expect(roles).toContain("flagged");
    expect(roles).toContain("clean");
    expect(roles).toContain("extraction-stress");
    expect(roles).toContain("adhesion");
  });
});

describe("every labelled sentence is in the document it is labelled against", () => {
  it("occurs exactly once, byte for byte, in each plain-text document", () => {
    expect(plainText.length).toBeGreaterThanOrEqual(5);

    for (const document of plainText) {
      const text = contentsOf(document);
      for (const clause of document.labels.plantedClauses) {
        const occurrences = text.split(clause.sourceSentence).length - 1;

        expect(
          occurrences,
          `${document.id} clause ${clause.clauseRef}`,
        ).toBe(1);
      }
    }
  });

  it("carries a source sentence that is a sentence, not a fragment or a clause", () => {
    for (const { document, clause } of labelledClausesOf(corpus)) {
      expect(clause.sourceSentence, `${document.id} ${clause.clauseRef}`).toMatch(
        /[.!?]["'’”)]?$/,
      );
      expect(
        clause.sourceSentence.length,
        `${document.id} ${clause.clauseRef}`,
      ).toBeGreaterThan(40);
      expect(clause.sourceSentence).not.toMatch(/^\d+\.\d+\s/);
    }
  });
});

describe("the labels agree with the taxonomy", () => {
  it("uses only the eight clause types and the band each one carries", () => {
    for (const { document, clause } of labelledClausesOf(corpus)) {
      expect(CLAUSE_TYPES, document.id).toContain(clause.clauseType);
      expect(clause.severity, `${document.id} ${clause.clauseRef}`).toBe(
        severityOf(clause.clauseType),
      );
    }
  });

  it("accounts for all eight in every analysed document: planted or absent", () => {
    for (const document of corpus.documents) {
      if (document.labels.expectedOutcome !== "analysed") continue;

      const planted = new Set(
        document.labels.plantedClauses.map((clause) => clause.clauseType),
      );
      const accounted = new Set([...planted, ...document.labels.checkedAndAbsent]);

      expect([...accounted].sort(), document.id).toEqual([...CLAUSE_TYPES].sort());
      for (const absent of document.labels.checkedAndAbsent) {
        expect(planted.has(absent), `${document.id} ${absent}`).toBe(false);

        /* An all-clear has to be able to say what was looked for, and a label
           stating that a topic is absent has to say where the document handles it
           instead, or nobody can re-check the absence by hand (ADR 0004).
           `negotiable-flagged.json` predates the corpus and states no absence
           list; the loader derives one and marks it derived, and a derived entry
           carries no note to check. */
        if (document.labels.checkedAndAbsentDerived) continue;
        expect(document.labels.notes[absent], `${document.id} ${absent}`)
          .toBeDefined();
      }
    }
  });
});

describe("the all-clear documents", () => {
  const clean = corpus.documents.filter((each) => each.role === "clean");

  it("are more than one, and each is labelled as carrying none of the eight", () => {
    expect(clean.length).toBeGreaterThanOrEqual(2);

    for (const document of clean) {
      expect(document.labels.plantedClauses, document.id).toEqual([]);
      expect(document.labels.expectedAllClear, document.id).toBe(true);
      expect([...document.labels.checkedAndAbsent].sort(), document.id).toEqual(
        [...CLAUSE_TYPES].sort(),
      );
    }
  });
});

describe("the extraction-stress documents", () => {
  const stress = corpus.documents.filter(
    (each) => each.role === "extraction-stress",
  );

  it("cover multi-column, hyphenation, ligatures, footnotes and tables", () => {
    const notes = stress.map((each) => each.note.toLowerCase()).join(" ");

    expect(notes).toMatch(/multi-column/);
    expect(notes).toMatch(/hyphenat/);
    expect(notes).toMatch(/ligature/);
    expect(notes).toMatch(/footnote/);
    expect(notes).toMatch(/table/);
  });

  it("each carry sentences that must survive extraction intact", () => {
    expect(stress.length).toBeGreaterThanOrEqual(4);

    for (const document of stress) {
      expect(
        document.labels.survivingSentences.length,
        document.id,
      ).toBeGreaterThanOrEqual(4);
      for (const sentence of document.labels.survivingSentences) {
        expect(sentence.length, document.id).toBeGreaterThan(20);
      }
    }
  });

  it("include a document whose labelled clause is inside a footnote", () => {
    const footnoted = stress.find((each) => each.id === "footnoted-schedule");

    expect(footnoted).toBeDefined();
    expect(
      footnoted!.labels.plantedClauses.map((clause) => clause.clauseRef),
    ).toContain("footnote 2");
  });
});

describe("the adhesion document", () => {
  it("is labelled as refused rather than as an analysis with no flags", () => {
    const adhesion = corpus.documents.filter(
      (each) => each.documentType === "adhesion",
    );

    expect(adhesion.length).toBeGreaterThanOrEqual(1);
    for (const document of adhesion) {
      expect(document.labels.expectedOutcome, document.id).toBe("refused");
      expect(document.labels.plantedClauses, document.id).toEqual([]);
    }
  });
});

describe("no clause type is unmeasurable", () => {
  it("labels at least one instance of every one of the eight", () => {
    const labelled = new Set(
      labelledClausesOf(corpus).map(({ clause }) => clause.clauseType),
    );

    for (const clauseType of CLAUSE_TYPES) {
      expect(labelled.has(clauseType), clauseType).toBe(true);
    }
  });

  it("labels more than one instance of at least one type, so multiplicity is exercised", () => {
    /* A contract with three separate indemnities must not come back looking like
       a contract with one (spec, user story 24), which cannot be measured unless
       the corpus contains a document with two of one type. */
    const counts = new Map<string, number>();
    for (const document of corpus.documents) {
      for (const clause of document.labels.plantedClauses) {
        const key = `${document.id}/${clause.clauseType}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    expect([...counts.values()].some((count) => count > 1)).toBe(true);
  });
});

describe("the loader rejects a corpus that disagrees with itself", () => {
  function corpusWith(
    labels: unknown,
    manifestExtras: Record<string, unknown> = {},
  ): string {
    const root = mkdtempSync(join(tmpdir(), "redline-corpus-"));
    mkdirSync(join(root, "tests", "corpus"), { recursive: true });
    writeFileSync(
      join(root, "tests", "corpus", "document.txt"),
      "A sentence that is in the document.\n",
    );
    writeFileSync(
      join(root, "tests", "corpus", "labels.json"),
      JSON.stringify(labels),
    );
    writeFileSync(
      join(root, "tests", "corpus", "manifest.json"),
      JSON.stringify({
        corpusVersion: 1,
        taxonomyVersion: 1,
        documents: [
          {
            id: "under-test",
            path: "tests/corpus/document.txt",
            format: "plain-text",
            documentType: "negotiable",
            provenance: "authored-for-this-repo",
            role: "flagged",
            labels: "tests/corpus/labels.json",
            note: "A corpus built inside a test to prove the loader rejects it.",
            ...manifestExtras,
          },
        ],
      }),
    );
    return root;
  }

  const clause = {
    clauseType: "personal-guarantee",
    severity: "highest",
    clauseRef: "1.1",
    sourceSentence: "A sentence that is in the document.",
    whatItPermits: "What the document says it permits.",
  };

  const labels = {
    documentType: "negotiable",
    title: "A document under test",
    expectedAllClear: false,
    plantedClauses: [clause],
    checkedAndAbsent: CLAUSE_TYPES.filter(
      (each) => each !== "personal-guarantee",
    ),
    notes: {},
  };

  it("accepts the shape when it is consistent, so the rejections below mean something", () => {
    expect(() => loadCorpus(corpusWith(labels))).not.toThrow();
  });

  it("rejects a severity that is not the band the taxonomy fixes", () => {
    const root = corpusWith({
      ...labels,
      plantedClauses: [{ ...clause, severity: "medium" }],
    });

    expect(() => loadCorpus(root)).toThrow(/taxonomy fixes that type at highest/);
  });

  it("rejects a clause type outside the eight", () => {
    const root = corpusWith({
      ...labels,
      plantedClauses: [{ ...clause, clauseType: "mandatory-arbitration" }],
    });

    expect(() => loadCorpus(root)).toThrow(/not one of the eight clause types/);
  });

  it("rejects a clause that is both planted and absent", () => {
    const root = corpusWith({ ...labels, checkedAndAbsent: CLAUSE_TYPES });

    expect(() => loadCorpus(root)).toThrow(/both planted and absent/);
  });

  it("rejects a document that says nothing about one of the eight", () => {
    const root = corpusWith({ ...labels, checkedAndAbsent: [] });

    expect(() => loadCorpus(root)).toThrow(/says nothing about/);
  });

  it("rejects an all-clear label on a document with a planted clause", () => {
    const root = corpusWith({ ...labels, expectedAllClear: true });

    expect(() => loadCorpus(root)).toThrow(/expectedAllClear true with 1 planted/);
  });

  it("rejects a provenance that is not one of the four", () => {
    const root = corpusWith(labels, { provenance: "found-on-the-internet" });

    expect(() => loadCorpus(root)).toThrow(/provenance is not one of/);
  });
});
