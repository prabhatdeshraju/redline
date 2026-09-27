/* @vitest-environment node
 *
 * The harness, proved against analyses that are right and analyses that are
 * wrong in specific ways.
 *
 * Nothing here is mocked. Each run is the whole harness over the whole corpus:
 * real files through the real extraction boundary, a real analyser, the real
 * citation gate, and the report a person would read. The corrupted analysers are
 * real analysers producing real analyses — one character changed in a quoted
 * sentence, a sentence lifted out of another document, an all-clear on a document
 * known to carry a personal guarantee. A harness that cannot tell those apart
 * cannot be trusted to tell anything apart.
 *
 * The distinction each corruption is here to check:
 *
 *   changed character      -> dropped at the gate, reported as an EXTRACTION defect
 *   sentence from another  -> dropped at the gate, reported as an EXTRACTION defect
 *   false all-clear        -> nothing dropped, reported as an ANALYSIS defect
 */

import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { defectsOn } from "@/lib/analysis/defects";
import { CLAUSE_TYPES } from "@/lib/analysis/taxonomy";
import { loadCorpus, repositoryRoot } from "@/lib/harness/corpus";
import { renderReport } from "@/lib/harness/report";
import { runHarness, type HarnessRun } from "@/lib/harness/run";
import { analyserFromLabels, describe as describeLabels } from "./corpus/analysers/as-labelled";
import {
  withASentenceFromAnotherDocument,
  withAnAllClearFor,
  withOneCharacterChanged,
} from "./corpus/analysers/corrupted";

const root = repositoryRoot();
const corpus = loadCorpus(root);
const perfect = analyserFromLabels(corpus);

const GUARANTEE_DOCUMENT = "equipment-lease";

function documentOf(id: string) {
  const found = corpus.documents.find((each) => each.id === id);
  if (!found) throw new Error(`no corpus document ${id}`);
  return found;
}

const guaranteeSentence = documentOf(
  GUARANTEE_DOCUMENT,
).labels.plantedClauses.find(
  (clause) => clause.clauseType === "personal-guarantee",
)!.sourceSentence;

const sentenceFromAnotherDocument = documentOf("agency-services-agreement")
  .labels.plantedClauses[0].sourceSentence;

async function run(
  analyser: Parameters<typeof runHarness>[0]["analyser"],
  description: string,
): Promise<HarnessRun> {
  return runHarness({ analyser, analyserDescription: description, corpus, root });
}

function tallyFor(result: HarnessRun, clauseType: string) {
  const tally = result.tallies.find((each) => each.clauseType === clauseType);
  if (!tally) throw new Error(`no tally for ${clauseType}`);
  return tally;
}

const perfectRun = await run(perfect, describeLabels);

describe("an analysis that is right by construction", () => {
  it("passes every gate", () => {
    expect(perfectRun.gates.map((gate) => gate.name)).toEqual([
      "Citation integrity",
      "False all-clear",
      "Extraction fidelity",
    ]);
    for (const gate of perfectRun.gates) {
      expect(gate.passed, `${gate.name}: ${gate.statement}`).toBe(true);
    }
    expect(perfectRun.passed).toBe(true);
  });

  it("drops nothing at the citation gate", () => {
    expect(perfectRun.citations.checked).toBeGreaterThan(20);
    expect(perfectRun.citations.dropped).toBe(0);
    expect(perfectRun.citations.cited).toBe(perfectRun.citations.checked);
  });

  it("reports recall and precision for every one of the eight clause types", () => {
    expect(perfectRun.tallies).toHaveLength(CLAUSE_TYPES.length);

    for (const tally of perfectRun.tallies) {
      expect(tally.labelled, tally.clauseType).toBeGreaterThan(0);
      expect(tally.recall, tally.clauseType).toBe(1);
      expect(tally.precision, tally.clauseType).toBe(1);
      expect(tally.droppedAtTheGate, tally.clauseType).toBe(0);
      expect(tally.notFlagged, tally.clauseType).toBe(0);
    }
  });

  it("finds no defect on either side", () => {
    expect(defectsOn(perfectRun.defects, "extraction")).toEqual([]);
    expect(defectsOn(perfectRun.defects, "analysis")).toEqual([]);
  });

  it("returns an all-clear for the documents labelled as carrying nothing", () => {
    const clean = perfectRun.documents.filter(
      (each) => each.document.role === "clean",
    );

    expect(clean.length).toBeGreaterThanOrEqual(2);
    for (const each of clean) expect(each.allClear, each.document.id).toBe(true);
    expect(perfectRun.falseAllClears).toEqual([]);
  });

  it("extracts every document and keeps every known sentence intact", () => {
    for (const each of perfectRun.documents) {
      expect(each.extraction.outcome, each.document.id).toBe("extracted");
      expect(each.sentencesMissing, each.document.id).toEqual([]);
    }
  });

  it("does not analyse the adhesion contract, and says so rather than skipping it silently", () => {
    const adhesion = perfectRun.documents.find(
      (each) => each.document.documentType === "adhesion",
    );

    expect(adhesion?.notAnalysed).toBe("adhesion-contract");
    expect(adhesion?.analysis).toBeNull();
    expect(renderReport(perfectRun)).toContain("not analysed (adhesion)");
  });
});

describe("one character changed in a quoted sentence", () => {
  const damaged = withOneCharacterChanged(perfect, "personal-guarantee");

  it("fails the run on that one violation", async () => {
    const result = await run(damaged, "one character changed");

    expect(result.passed).toBe(false);
    const citation = result.gates.find(
      (gate) => gate.name === "Citation integrity",
    );
    expect(citation?.passed).toBe(false);
    expect(citation?.source).toMatch(/zero tolerance/);
  });

  it("drops exactly the flags that were damaged, and keeps the rest", async () => {
    const result = await run(damaged, "one character changed");

    /* The same prose is in the corpus three times over, and the lease as well, so
       the count is the number of documents carrying a personal guarantee. */
    expect(result.citations.dropped).toBe(4);
    expect(result.citations.cited).toBe(
      result.citations.checked - result.citations.dropped,
    );
  });

  it("reports it as an extraction defect and not as a missed clause", async () => {
    const result = await run(damaged, "one character changed");
    const extraction = defectsOn(result.defects, "extraction");
    const analysis = defectsOn(result.defects, "analysis");

    expect(extraction.length).toBe(4);
    for (const each of extraction) {
      expect(each.kind).toBe("source-sentence-not-in-the-document");
      expect(each.clauseType).toBe("personal-guarantee");
    }
    /* The clause is missing from the output, but the reason is on the extraction
       side and the report must not also bill it to the analysis. */
    expect(analysis).toEqual([]);
  });

  it("counts the clause as dropped at the gate rather than as not flagged", async () => {
    const result = await run(damaged, "one character changed");
    const tally = tallyFor(result, "personal-guarantee");

    expect(tally.droppedAtTheGate).toBe(4);
    expect(tally.notFlagged).toBe(0);
    expect(tally.flagged).toBe(0);
    expect(tally.recall).toBe(0);

    /* Every other type is untouched, which is what per-type reporting is for. */
    expect(tallyFor(result, "uncapped-indemnification").recall).toBe(1);
  });

  it("prints the dropped sentence in the report", async () => {
    const result = await run(damaged, "one character changed");
    const report = renderReport(result);

    expect(report).toContain("Dropped:");
    expect(report).toContain("personal-guarantee (not-in-the-document)");
    expect(report).toContain("Run failed");
  });
});

describe("a sentence quoted from a different document", () => {
  const damaged = withASentenceFromAnotherDocument(
    perfect,
    "limitation-of-liability",
    sentenceFromAnotherDocument,
  );

  it("is dropped even though the sentence is real, because it is not in this text", async () => {
    const result = await run(damaged, "a sentence from another document");

    expect(result.passed).toBe(false);
    expect(result.citations.dropped).toBeGreaterThan(0);

    const extraction = defectsOn(result.defects, "extraction");
    expect(extraction.length).toBe(result.citations.dropped);
    for (const each of extraction) {
      expect(each.kind).toBe("source-sentence-not-in-the-document");
      expect(each.clauseType).toBe("limitation-of-liability");
    }
  });

  it("names the document it happened on and shows what was quoted", async () => {
    const result = await run(damaged, "a sentence from another document");
    const report = renderReport(result);

    expect(report).toContain("limitation-of-liability (not-in-the-document)");
    expect(report).toContain(sentenceFromAnotherDocument.slice(0, 40));
    expect(report).toContain("equipment-lease");
  });

  it("leaves the document the sentence came from measuring correctly", async () => {
    const result = await run(damaged, "a sentence from another document");
    const agency = result.documents.find(
      (each) => each.document.id === "agency-services-agreement",
    );

    /* The agency agreement has no limitation-of-liability clause to damage, so it
       is untouched: a defect on one document does not contaminate another. */
    expect(agency?.measurement?.flagsDropped).toBe(0);
    expect(agency?.defects).toEqual([]);
  });
});

describe("an all-clear on a document known to contain a personal guarantee", () => {
  const damaged = withAnAllClearFor(perfect, guaranteeSentence);

  it("fails the run", async () => {
    const result = await run(damaged, "a false all-clear");

    expect(result.passed).toBe(false);
    const gate = result.gates.find((each) => each.name === "False all-clear");
    expect(gate?.passed).toBe(false);
    expect(gate?.source).toMatch(/§4\.4/);
    expect(result.falseAllClears).toEqual([GUARANTEE_DOCUMENT]);
  });

  it("is an analysis defect, with the citation gate still passing", async () => {
    const result = await run(damaged, "a false all-clear");

    /* Nothing was dropped: every flag the analyser did produce quotes its
       document properly. The defect is that it produced none for this one, which
       is a different module's problem entirely. */
    expect(result.citations.dropped).toBe(0);
    expect(
      result.gates.find((each) => each.name === "Citation integrity")?.passed,
    ).toBe(true);

    const analysis = defectsOn(result.defects, "analysis");
    expect(defectsOn(result.defects, "extraction")).toEqual([]);
    expect(
      analysis.some(
        (each) => each.kind === "all-clear-on-a-document-labelled-as-flagged",
      ),
    ).toBe(true);
    expect(
      analysis.filter((each) => each.kind === "labelled-clause-not-flagged"),
    ).toHaveLength(documentOf(GUARANTEE_DOCUMENT).labels.plantedClauses.length);
  });

  it("counts every clause of that document as not flagged, per type", async () => {
    const result = await run(damaged, "a false all-clear");

    expect(tallyFor(result, "personal-guarantee").notFlagged).toBe(1);
    expect(tallyFor(result, "personal-guarantee").droppedAtTheGate).toBe(0);
    /* Three of the four labelled guarantees are in the other document's three
       files, which were analysed correctly. */
    expect(tallyFor(result, "personal-guarantee").flagged).toBe(3);
    expect(tallyFor(result, "personal-guarantee").recall).toBeCloseTo(0.75, 5);
  });

  it("says in the report which document came back with nothing", async () => {
    const result = await run(damaged, "a false all-clear");
    const report = renderReport(result);

    expect(report).toMatch(
      /Documents labelled as flagged that returned nothing: 1/,
    );
    expect(report).toContain(GUARANTEE_DOCUMENT);
  });
});

describe("the report", () => {
  const report = renderReport(perfectRun, { notes: ["A note from the caller"] });

  it("gives every clause type its own row rather than only an aggregate", () => {
    for (const clauseType of CLAUSE_TYPES) {
      expect(report, clauseType).toContain(clauseType);
    }
    expect(report).toContain("RECALL, PER CLAUSE TYPE");
    expect(report).toContain("PRECISION, PER CLAUSE TYPE");
  });

  it("says that recall and precision are not gated and whose number it is", () => {
    expect(report).toContain("NOT GATED");
    expect(report).toMatch(/leave every threshold unset/);
    expect(report).toMatch(/owner's to set/);
  });

  it("keeps extraction defects and analysis defects in separate sections", () => {
    expect(report.indexOf("EXTRACTION DEFECTS")).toBeGreaterThan(0);
    expect(report.indexOf("ANALYSIS DEFECTS")).toBeGreaterThan(
      report.indexOf("EXTRACTION DEFECTS"),
    );
  });

  it("records that the corpus is authored rather than real", () => {
    expect(report).toContain("authored-for-this-repo");
    expect(report).toMatch(/weaker evidence/);
  });

  it("names the analyser that produced the numbers", () => {
    expect(report).toContain(describeLabels);
    expect(report).toContain("A note from the caller");
  });

  it("uses the product's vocabulary and not the words CONTEXT.md rules out", () => {
    /* `CONTEXT.md` names these as avoid-words: a flag is a flag, and a clause
       type is a clause type. */
    expect(report).not.toMatch(/\bfindings?\b/i);
    expect(report).not.toMatch(/\bcategor(y|ies)\b/i);
    expect(report).not.toMatch(/\brisk score\b/i);
  });

  it("states what it could not measure rather than leaving it out", () => {
    expect(report).toMatch(/Counter-offer quality/);
    expect(report).toMatch(/§4\.7/);
  });
});

describe("a corpus with one document in it", () => {
  /* The case per-type reporting exists for: a clause type with nothing labelled
     must show as unmeasured rather than being averaged away. */
  it("says which clause types it has nothing labelled for", async () => {
    const clean = documentOf("clean-photography-commission");
    const result = await runHarness({
      analyser: perfect,
      analyserDescription: "one clean document only",
      corpus: { ...corpus, documents: [clean] },
      root,
    });

    expect(result.clauseTypesWithoutLabels).toEqual([...CLAUSE_TYPES]);
    for (const tally of result.tallies) {
      expect(tally.recall, tally.clauseType).toBeNull();
    }

    const report = renderReport(result);
    expect(report).toMatch(/Clause types the corpus labels no instance of/);
    expect(report).toMatch(
      /Nothing can be claimed about a clause type with nothing labelled/,
    );
    /* A run with nothing to recall still holds the gates it can hold. */
    expect(result.passed).toBe(true);
  });
});

describe("the harness script, with no analyser and no model key", () => {
  it("says what it cannot do and exits non-zero, without a stack trace", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "--import",
        "./scripts/typescript-modules.mjs",
        "scripts/harness.ts",
      ],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, OPENROUTER_API_KEY: "" },
        timeout: 120_000,
      },
    );

    expect(result.status).not.toBe(0);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Nothing was measured: no analyser was given");
    expect(result.stdout).toContain("OPENROUTER_API_KEY is not set");
    expect(result.stdout).toContain("Nothing here needs a key");
    /* Not a crash: no stack frames, and nothing on stderr but the parser's own
       warnings. */
    expect(result.stdout).not.toMatch(/^\s+at /m);
    expect(result.stdout).not.toMatch(/Cannot read propert/);
  });

  it("runs the whole corpus and exits zero when given one", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "--import",
        "./scripts/typescript-modules.mjs",
        "scripts/harness.ts",
        "--analyser",
        "tests/corpus/analysers/as-labelled.ts",
      ],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, OPENROUTER_API_KEY: "" },
        timeout: 240_000,
      },
    );

    expect(result.stdout).toContain("REDLINE CITATION HARNESS");
    expect(result.stdout).toContain("Run passed");
    expect(result.status).toBe(0);
  });
});
