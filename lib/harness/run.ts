/* The harness: one analysis across the whole labelled corpus.
 *
 *     runHarness({ analyser, ... }) -> HarnessRun
 *
 * The analyser is handed in. This is the architecture of the thing rather than a
 * convenience: the harness exists to measure the analysis the product ships, so
 * it must not contain an analysis of its own. Ticket 04 passes the real one;
 * `tests/corpus/analysers/` holds the ones that exist only to prove the harness
 * catches what it claims to catch, and they live under `tests/` because that is
 * what they are.
 *
 * What each document goes through is the path the product's own document takes,
 * in the same order:
 *
 *   1. the extraction boundary, over the real file — the .txt, .pdf or .docx as
 *      committed. Nothing reads a corpus document straight off the disk as text,
 *      because then the harness would be measuring an analysis of a text the
 *      product never sees.
 *   2. the sentences the corpus records as known-present, checked against what
 *      came out. A sentence that did not survive is an extraction defect, and no
 *      flag could ever cite it (`PRD.md` §4.8).
 *   3. the analyser.
 *   4. the citation gate, exactly where the analysis boundary will place it
 *      (spec, "The citation gate lives inside the analysis boundary").
 *   5. the comparison against the labels.
 *
 * Adhesion contracts stop after step 2. They are out of scope for analysis
 * (ADR 0002) and what Redline returns for one is ticket 07's decision and one of
 * the five questions `PRD.md` §8 leaves open, so the harness reports them as not
 * analysed rather than inventing an expectation for them.
 */

import {
  applyCitationGate,
  isAllClear,
  type CitedAnalysis,
} from "@/lib/analysis/citation-gate";
import {
  NO_THRESHOLDS,
  checkedAndAbsent,
  type Analyser,
  type Flag,
  type Threshold,
} from "@/lib/analysis/analysis";
import { defect, defectsOn, type Defect } from "@/lib/analysis/defects";
import { CLAUSE_TAXONOMY_VERSION, type ClauseType } from "@/lib/analysis/taxonomy";
import { extractDocument } from "@/lib/extraction/extract";

import {
  corpusDocumentFile,
  loadCorpus,
  repositoryRoot,
  type Corpus,
  type CorpusDocument,
} from "./corpus";
import {
  measureAgainstLabels,
  tallyByClauseType,
  type ClauseTypeTally,
  type DocumentMeasurement,
} from "./measure";

export type HarnessOptions = {
  /** The analysis under measurement. */
  readonly analyser: Analyser;
  /** What ran, in words, for the top of the report. The reader of a report has
   *  to be able to tell which analyser produced the numbers in it. */
  readonly analyserDescription: string;
  /** The reader's thresholds. Empty for every run here: a threshold is the
   *  reader's own limit rather than a property of a document (ticket 11). */
  readonly thresholds?: readonly Threshold[];
  readonly corpus?: Corpus;
  readonly root?: string;
};

export type ExtractionResult =
  | {
      readonly outcome: "extracted";
      readonly characters: number;
      readonly pages: number;
      readonly repairs: readonly string[];
    }
  | { readonly outcome: "refused"; readonly reason: string };

export type DocumentRun = {
  readonly document: CorpusDocument;
  readonly extraction: ExtractionResult;
  /** Why the document was not analysed, or null when it was. */
  readonly notAnalysed: "adhesion-contract" | "extraction-refused" | null;
  readonly sentencesChecked: number;
  readonly sentencesMissing: readonly string[];
  readonly analysis: CitedAnalysis | null;
  readonly measurement: DocumentMeasurement | null;
  readonly allClear: boolean;
  readonly defects: readonly Defect[];
};

export type Gate = {
  readonly name: string;
  /** Where the decision to gate on this comes from. */
  readonly source: string;
  readonly passed: boolean;
  readonly statement: string;
};

export type HarnessRun = {
  readonly analyserDescription: string;
  readonly corpusVersion: number;
  readonly taxonomyVersion: number;
  readonly documents: readonly DocumentRun[];
  readonly tallies: readonly ClauseTypeTally[];
  readonly citations: {
    readonly checked: number;
    readonly cited: number;
    readonly dropped: number;
  };
  readonly defects: readonly Defect[];
  readonly falseAllClears: readonly string[];
  /** Clause types the corpus labels no instance of. Reported because a type with
   *  nothing labelled is a type nothing can be claimed about (`PRD.md` §4.2). */
  readonly clauseTypesWithoutLabels: readonly ClauseType[];
  readonly gates: readonly Gate[];
  readonly passed: boolean;
};

async function extract(
  document: CorpusDocument,
  root: string,
): Promise<{ readonly result: ExtractionResult; readonly text: string }> {
  const outcome = await extractDocument({
    kind: "file",
    file: corpusDocumentFile(document, root),
  });

  if (outcome.outcome === "refused") {
    return {
      result: { outcome: "refused", reason: outcome.refusal.reason },
      text: "",
    };
  }

  const { extraction } = outcome;
  const diagnostics = extraction.diagnostics;
  const repairs: string[] = [];
  if (diagnostics.hyphenationsJoined > 0) {
    repairs.push(`${diagnostics.hyphenationsJoined} hyphenations rejoined`);
  }
  if (diagnostics.ligaturesDecomposed > 0) {
    repairs.push(`${diagnostics.ligaturesDecomposed} ligatures decomposed`);
  }
  if (diagnostics.runningLinesRemoved.length > 0) {
    repairs.push(
      `${diagnostics.runningLinesRemoved.length} running lines removed`,
    );
  }
  if (diagnostics.multiColumnPages.length > 0) {
    repairs.push(
      `${diagnostics.multiColumnPages.length} multi-column ${diagnostics.multiColumnPages.length === 1 ? "page" : "pages"}`,
    );
  }
  if (diagnostics.sentencesJoinedAcrossPages > 0) {
    repairs.push(
      `${diagnostics.sentencesJoinedAcrossPages} ${diagnostics.sentencesJoinedAcrossPages === 1 ? "sentence" : "sentences"} rejoined across a page`,
    );
  }

  return {
    result: {
      outcome: "extracted",
      characters: extraction.characters,
      pages: diagnostics.pages,
      repairs,
    },
    text: extraction.text,
  };
}

export async function runHarness(
  options: HarnessOptions,
): Promise<HarnessRun> {
  const root = options.root ?? repositoryRoot();
  const corpus = options.corpus ?? loadCorpus(root);
  const thresholds = options.thresholds ?? NO_THRESHOLDS;

  const documents: DocumentRun[] = [];
  const citedFlagsByDocument = new Map<string, readonly Flag[]>();

  for (const document of corpus.documents) {
    const { result, text } = await extract(document, root);
    const defects: Defect[] = [];

    if (result.outcome === "refused") {
      defects.push(
        defect("extraction-refused", {
          documentId: document.id,
          statement: `The extraction boundary refused this document: ${result.reason}. Nothing downstream of it can be measured.`,
        }),
      );
      documents.push({
        document,
        extraction: result,
        notAnalysed: "extraction-refused",
        sentencesChecked: 0,
        sentencesMissing: [],
        analysis: null,
        measurement: null,
        allClear: false,
        defects,
      });
      continue;
    }

    /* Step 2. Plain substring match, the same one the citation gate performs:
       if a sentence known to be in the document is not in the extracted text,
       a flag quoting it would be dropped and the reader would be shown less
       than their document contains. */
    const missing = document.labels.survivingSentences.filter(
      (sentence) => !text.includes(sentence),
    );
    for (const sentence of missing) {
      defects.push(
        defect("source-sentence-did-not-survive-extraction", {
          documentId: document.id,
          statement: `A sentence the corpus records as present did not come out of extraction intact: "${sentence.slice(0, 90)}${sentence.length > 90 ? "..." : ""}"`,
        }),
      );
    }

    if (document.documentType === "adhesion") {
      documents.push({
        document,
        extraction: result,
        notAnalysed: "adhesion-contract",
        sentencesChecked: document.labels.survivingSentences.length,
        sentencesMissing: missing,
        analysis: null,
        measurement: null,
        allClear: false,
        defects,
      });
      continue;
    }

    let produced;
    try {
      produced = await options.analyser(text, thresholds);
    } catch (error) {
      throw new Error(
        `the analyser threw on ${document.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const analysis = applyCitationGate(produced, text);
    const measurement = measureAgainstLabels(document, analysis);
    citedFlagsByDocument.set(document.id, analysis.flags);

    documents.push({
      document,
      extraction: result,
      notAnalysed: null,
      sentencesChecked: document.labels.survivingSentences.length,
      sentencesMissing: missing,
      analysis,
      measurement,
      allClear: isAllClear(analysis),
      defects: [...defects, ...measurement.defects],
    });
  }

  const measurements = documents
    .map((each) => each.measurement)
    .filter((each): each is DocumentMeasurement => each !== null);

  const tallies = tallyByClauseType(measurements, citedFlagsByDocument);
  const defects = documents.flatMap((each) => each.defects);

  const citations = {
    checked: measurements.reduce((total, each) => total + each.flagsProduced, 0),
    cited: measurements.reduce((total, each) => total + each.flagsCited, 0),
    dropped: measurements.reduce((total, each) => total + each.flagsDropped, 0),
  };

  const falseAllClears = documents
    .filter((each) => each.measurement?.falseAllClear === true)
    .map((each) => each.document.id);

  const extractionFailures = defectsOn(defects, "extraction").filter(
    (each) => each.kind !== "source-sentence-not-in-the-document",
  );

  const gates: Gate[] = [
    {
      name: "Citation integrity",
      source: "ADR 0001, PRD.md §4.1 — binary, zero tolerance",
      passed: citations.dropped === 0,
      statement:
        citations.dropped === 0
          ? `Every one of the ${citations.checked} flags produced quotes a sentence that occurs verbatim in the text it was produced from.`
          : `${citations.dropped} of ${citations.checked} flags quoted a sentence that does not occur in the text they were produced from. One is enough to fail this run.`,
    },
    {
      name: "False all-clear",
      source: "PRD.md §4.4 — must never occur",
      passed: falseAllClears.length === 0,
      statement:
        falseAllClears.length === 0
          ? "No document labelled as carrying a flaggable clause came back with nothing flagged."
          : `${falseAllClears.length} document(s) labelled as carrying a flaggable clause came back with nothing flagged: ${falseAllClears.join(", ")}.`,
    },
    {
      name: "Extraction fidelity",
      source: "PRD.md §4.8 — the sentences a flag would have to quote",
      passed: extractionFailures.length === 0,
      statement:
        extractionFailures.length === 0
          ? "Every document extracted, and every sentence the corpus records as present came out intact."
          : `${extractionFailures.length} document(s) either would not extract or lost a sentence the corpus records as present.`,
    },
  ];

  const clauseTypesWithoutLabels = tallies
    .filter((tally) => tally.labelled === 0)
    .map((tally) => tally.clauseType);

  return {
    analyserDescription: options.analyserDescription,
    corpusVersion: corpus.corpusVersion,
    taxonomyVersion: corpus.taxonomyVersion,
    documents,
    tallies,
    citations,
    defects,
    falseAllClears,
    clauseTypesWithoutLabels,
    gates,
    passed: gates.every((gate) => gate.passed),
  };
}

/** The clause types an all-clear on this document would have to list, which is
 *  derived from the flags that survived the gate rather than reported alongside
 *  them (ADR 0004). Exported because the report prints it for a clean document. */
export function allClearList(run: DocumentRun): readonly ClauseType[] {
  return checkedAndAbsent(run.analysis?.flags ?? []);
}

export const HARNESS_TAXONOMY_VERSION = CLAUSE_TAXONOMY_VERSION;
