/* The labelled corpus, loaded and checked.
 *
 * The corpus is data under `tests/corpus/`: a manifest naming every document,
 * and one labels sidecar per document. This module is the only thing that reads
 * that shape, so a document can be added by editing the manifest rather than by
 * editing the harness (`tests/corpus/README.md` says how).
 *
 * Every label is validated on the way in. A corpus that disagrees with itself —
 * a clause type outside the eight, a severity that is not the band the taxonomy
 * fixes for that type, a planted clause that is also listed as absent — would
 * produce recall and precision numbers that look like measurements and are not,
 * so loading fails loudly rather than reporting them.
 *
 * It reads from the filesystem, so it runs in Node, in the harness and in the
 * suite. Nothing in the product's browser or server bundles imports it.
 */

import { readFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";

import {
  CLAUSE_TYPES,
  isClauseType,
  isSeverity,
  severityOf,
  type ClauseType,
  type Severity,
} from "@/lib/analysis/taxonomy";

/** Where a document came from, and therefore how much a number measured against
 *  it is worth.
 *
 * `authored-for-this-repo` is prose this repository wrote. It is weaker evidence
 * than a real negotiable document, because an authored document contains the
 * clauses its author was thinking about; see `tests/corpus/README.md`. The other
 * three are what a real document would carry. */
export type Provenance =
  | "authored-for-this-repo"
  | "public-domain"
  | "licensed"
  | "owner-supplied";

export const PROVENANCE_VALUES: readonly Provenance[] = [
  "authored-for-this-repo",
  "public-domain",
  "licensed",
  "owner-supplied",
];

/** Negotiable, or the adhesion contracts Redline refuses (ADR 0002). */
export type DocumentType = "negotiable" | "adhesion";

/** The kind of file the document is, which decides what the extraction boundary
 *  has to do with it. */
export type DocumentFormat = "plain-text" | "pdf" | "docx";

/** What a document is in the corpus for. One document can only serve one role,
 *  which keeps a report readable: a flagged document measures recall, a clean one
 *  measures the all-clear, an extraction-stress one measures whether a sentence
 *  survives the file it arrived in. */
export type CorpusRole = "flagged" | "clean" | "extraction-stress" | "adhesion";

export type LabelledClause = {
  readonly clauseType: ClauseType;
  readonly severity: Severity;
  /** The numbered clause it sits in, for a person re-checking the label by hand. */
  readonly clauseRef: string;
  /** The single sentence a flag for this clause must quote, byte for byte. */
  readonly sourceSentence: string;
  readonly whatItPermits: string;
};

export type CorpusLabels = {
  readonly title: string;
  readonly documentType: DocumentType;
  /** Whether this document should produce an all-clear. */
  readonly expectedAllClear: boolean;
  /** Whether the document is analysed at all, or refused (ADR 0002). */
  readonly expectedOutcome: "analysed" | "refused";
  readonly plantedClauses: readonly LabelledClause[];
  /** The clause types this document does not contain, which an all-clear has to
   *  be able to list (ADR 0004). */
  readonly checkedAndAbsent: readonly ClauseType[];
  /** True when the sidecar did not state the list and it was derived as the eight
   *  minus the planted types. Derived is not the same as stated: nobody has
   *  written down where the document handles the topic instead, so nobody can
   *  re-check the absence by hand. */
  readonly checkedAndAbsentDerived: boolean;
  /** Sentences known to be in the document, which must come out of extraction
   *  intact. Defaults to the planted clauses' source sentences. */
  readonly survivingSentences: readonly string[];
  /** Where each absent clause type's topic is handled instead, so a label can be
   *  re-checked by hand. */
  readonly notes: Readonly<Record<string, string>>;
};

export type CorpusDocument = {
  readonly id: string;
  /** Path from the repository root. */
  readonly path: string;
  readonly format: DocumentFormat;
  readonly documentType: DocumentType;
  readonly provenance: Provenance;
  readonly role: CorpusRole;
  /** Path of the sidecar the labels were read from. */
  readonly labelsPath: string;
  readonly note: string;
  readonly labels: CorpusLabels;
};

export type Corpus = {
  readonly corpusVersion: number;
  readonly taxonomyVersion: number;
  readonly documents: readonly CorpusDocument[];
};

export const MANIFEST_PATH = "tests/corpus/manifest.json";

/** The repository root. Both callers — the harness script and the suite — run
 *  from it; this checks that rather than assuming it, because a manifest read
 *  from the wrong directory would report an empty corpus as a passing run. */
export function repositoryRoot(from: string = process.cwd()): string {
  const root = resolve(from);
  try {
    readFileSync(join(root, MANIFEST_PATH), "utf8");
  } catch {
    throw new Error(
      `${MANIFEST_PATH} was not found under ${root}. The harness and the suite both run from the repository root.`,
    );
  }
  return root;
}

function readJson(path: string): unknown {
  const text = readFileSync(path, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${path} is not readable as JSON: ${String(error)}`);
  }
}

function asRecord(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${where} is not an object`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, where: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${where} is not a non-empty string`);
  }
  return value;
}

function asStringArray(value: unknown, where: string): readonly string[] {
  if (!Array.isArray(value)) throw new Error(`${where} is not an array`);
  return value.map((each, index) => asString(each, `${where}[${index}]`));
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  where: string,
): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new Error(`${where} is not one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function labelledClause(value: unknown, where: string): LabelledClause {
  const record = asRecord(value, where);
  const clauseType = record.clauseType;
  if (!isClauseType(clauseType)) {
    throw new Error(
      `${where}.clauseType (${String(clauseType)}) is not one of the eight clause types in PRD.md section 5`,
    );
  }
  const severity = record.severity;
  if (!isSeverity(severity)) {
    throw new Error(`${where}.severity (${String(severity)}) is not a severity band`);
  }
  /* Severity is fixed per clause type (ADR 0003). A label that disagrees with
     the taxonomy is a label that would make a correct flag look wrong. */
  if (severity !== severityOf(clauseType)) {
    throw new Error(
      `${where} labels ${clauseType} as ${severity}; the taxonomy fixes that type at ${severityOf(clauseType)}`,
    );
  }
  return {
    clauseType,
    severity,
    clauseRef: asString(record.clauseRef, `${where}.clauseRef`),
    sourceSentence: asString(record.sourceSentence, `${where}.sourceSentence`),
    whatItPermits: asString(record.whatItPermits, `${where}.whatItPermits`),
  };
}

function corpusLabels(path: string, documentType: DocumentType): CorpusLabels {
  const record = asRecord(readJson(path), path);

  const sidecarType = oneOf<DocumentType>(
    record.documentType,
    ["negotiable", "adhesion"],
    `${path}.documentType`,
  );
  if (sidecarType !== documentType) {
    throw new Error(
      `${path} says documentType ${sidecarType}; the manifest says ${documentType}`,
    );
  }

  const plantedClauses = (
    Array.isArray(record.plantedClauses) ? record.plantedClauses : []
  ).map((each, index) => labelledClause(each, `${path}.plantedClauses[${index}]`));

  const plantedTypes = new Set(plantedClauses.map((clause) => clause.clauseType));

  const checkedAndAbsentDerived = !Array.isArray(record.checkedAndAbsent);
  const checkedAndAbsent = (
    Array.isArray(record.checkedAndAbsent)
      ? asStringArray(record.checkedAndAbsent, `${path}.checkedAndAbsent`)
      : CLAUSE_TYPES.filter((clauseType) => !plantedTypes.has(clauseType))
  ).map((value, index) => {
    if (!isClauseType(value)) {
      throw new Error(
        `${path}.checkedAndAbsent[${index}] (${value}) is not one of the eight clause types`,
      );
    }
    return value;
  });

  const expectedOutcome =
    record.expectedOutcome === "refused" ? "refused" : "analysed";

  if (expectedOutcome === "analysed") {
    for (const clauseType of checkedAndAbsent) {
      if (plantedTypes.has(clauseType)) {
        throw new Error(
          `${path} lists ${clauseType} as both planted and absent`,
        );
      }
    }
    const accounted = new Set([...plantedTypes, ...checkedAndAbsent]);
    const missing = CLAUSE_TYPES.filter((clauseType) => !accounted.has(clauseType));
    if (missing.length > 0) {
      throw new Error(
        `${path} says nothing about ${missing.join(", ")}: every one of the eight is either planted or absent`,
      );
    }
  }

  const expectedAllClear = record.expectedAllClear === true;
  if (expectedOutcome === "analysed" && expectedAllClear !== (plantedClauses.length === 0)) {
    throw new Error(
      `${path} says expectedAllClear ${expectedAllClear} with ${plantedClauses.length} planted clauses`,
    );
  }

  const survivingSentences = Array.isArray(record.survivingSentences)
    ? asStringArray(record.survivingSentences, `${path}.survivingSentences`)
    : plantedClauses.map((clause) => clause.sourceSentence);

  for (const clause of plantedClauses) {
    if (!survivingSentences.includes(clause.sourceSentence)) {
      throw new Error(
        `${path} plants ${clause.clauseRef} but does not list its source sentence among the sentences that must survive extraction`,
      );
    }
  }

  const notes = asRecord(record.notes ?? {}, `${path}.notes`);
  const notesByType: Record<string, string> = {};
  for (const [key, value] of Object.entries(notes)) {
    notesByType[key] = asString(value, `${path}.notes.${key}`);
  }

  return {
    title: asString(record.title, `${path}.title`),
    documentType: sidecarType,
    expectedAllClear,
    expectedOutcome,
    plantedClauses,
    checkedAndAbsent,
    checkedAndAbsentDerived,
    survivingSentences,
    notes: notesByType,
  };
}

/** Read the manifest and every labels sidecar it names. */
export function loadCorpus(root: string = repositoryRoot()): Corpus {
  const manifestPath = join(root, MANIFEST_PATH);
  const manifest = asRecord(readJson(manifestPath), MANIFEST_PATH);
  const entries = manifest.documents;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`${MANIFEST_PATH} lists no documents`);
  }

  const seen = new Set<string>();
  const documents = entries.map((value, index) => {
    const where = `${MANIFEST_PATH}.documents[${index}]`;
    const record = asRecord(value, where);
    const id = asString(record.id, `${where}.id`);
    if (seen.has(id)) throw new Error(`${MANIFEST_PATH} uses the id ${id} twice`);
    seen.add(id);

    const documentType = oneOf<DocumentType>(
      record.documentType,
      ["negotiable", "adhesion"],
      `${where}.documentType`,
    );
    const labelsPath = asString(record.labels, `${where}.labels`);

    return {
      id,
      path: asString(record.path, `${where}.path`),
      format: oneOf<DocumentFormat>(
        record.format,
        ["plain-text", "pdf", "docx"],
        `${where}.format`,
      ),
      documentType,
      provenance: oneOf<Provenance>(
        record.provenance,
        PROVENANCE_VALUES,
        `${where}.provenance`,
      ),
      role: oneOf<CorpusRole>(
        record.role,
        ["flagged", "clean", "extraction-stress", "adhesion"],
        `${where}.role`,
      ),
      labelsPath,
      note: asString(record.note, `${where}.note`),
      labels: corpusLabels(join(root, labelsPath), documentType),
    } satisfies CorpusDocument;
  });

  return {
    corpusVersion: Number(manifest.corpusVersion ?? 0),
    taxonomyVersion: Number(manifest.taxonomyVersion ?? 0),
    documents,
  };
}

/** The document's bytes, as a `File` named the way the reader's own file would
 *  be, so the extraction boundary takes the same path it takes in the browser. */
export function corpusDocumentFile(
  document: CorpusDocument,
  root: string = repositoryRoot(),
): File {
  const path = isAbsolute(document.path)
    ? document.path
    : join(root, document.path);
  const bytes = readFileSync(path);
  return new File([new Uint8Array(bytes)], basename(document.path));
}

/** Every labelled clause in the corpus, with the document it is in. */
export function labelledClausesOf(
  corpus: Corpus,
): ReadonlyArray<{ readonly document: CorpusDocument; readonly clause: LabelledClause }> {
  return corpus.documents.flatMap((document) =>
    document.labels.plantedClauses.map((clause) => ({ document, clause })),
  );
}
