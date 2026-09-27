/* What crosses the analysis boundary.
 *
 * A flag cannot exist without the sentence it came from. `sourceSentence` is a
 * required string — never optional, never nullable — because a flag that can be
 * constructed without one is a flag that will eventually ship without one
 * (ADR 0001, and the spec's "citation gate lives inside the analysis boundary").
 *
 * The list of clause types checked and found absent is derived from the flags
 * rather than reported alongside them, and derived *after* the citation gate has
 * run. An analyser that returned its own list could disagree with its own flags,
 * and a flag dropped at the gate would leave that list stating the opposite of
 * what the reader is shown (ADR 0004).
 */

import {
  CLAUSE_TYPES,
  severityRank,
  type ClauseType,
  type Severity,
} from "./taxonomy";

/** One identified risk in a document: the unit of Redline's output
 *  (CONTEXT.md: flag). */
export type Flag = {
  readonly clauseType: ClauseType;
  /** The band the taxonomy gives this clause type. Carried on the flag because
   *  it is what the flag is ranked by; it is not a per-document judgement. */
  readonly severity: Severity;
  /** The sentence, quoted verbatim from the document, that this flag came from.
   *  Required. */
  readonly sourceSentence: string;
  /** What the clause does to the reader, in concrete terms rather than as a
   *  category: flat about what the document says, hedged about what it means
   *  legally, with no verdict on whether to sign (ADR 0004). */
  readonly whatItPermits: string;
};

/** An analysis as an analyser produced it, before the citation gate has run. */
export type Analysis = {
  readonly flags: readonly Flag[];
};

/** A term the reader has declared unacceptable, in their own words
 *  (CONTEXT.md: threshold). The harness runs with none set: a threshold is the
 *  reader's own limit rather than a property of the document, and `PRD.md` §4.2
 *  and §4.3 measure the analysis itself. */
export type Threshold = string;

export const NO_THRESHOLDS: readonly Threshold[] = [];

/** The seam the harness is built around: document text and the reader's
 *  thresholds in, an analysis out.
 *
 * Ticket 04 supplies the implementation that calls a model. The harness never
 * contains one — it is handed one — so that what the harness measures is the
 * analysis the product ships rather than a fixture standing in for it. */
export type Analyser = (
  documentText: string,
  thresholds: readonly Threshold[],
) => Analysis | Promise<Analysis>;

/** The clause types that were searched for and not found, given the flags that
 *  survived the citation gate. An all-clear is reported alongside this list
 *  rather than as an empty screen (ADR 0004). */
export function checkedAndAbsent(
  flags: readonly Flag[],
): readonly ClauseType[] {
  const present = new Set(flags.map((flag) => flag.clauseType));
  return CLAUSE_TYPES.filter((clauseType) => !present.has(clauseType));
}

/** Flags in the order they are shown: worst case first, and within a band the
 *  order the taxonomy publishes. Stable, so the same document produces the same
 *  ordering across runs (ADR 0003). */
export function rankedBySeverity(flags: readonly Flag[]): readonly Flag[] {
  const published = new Map(
    CLAUSE_TYPES.map((clauseType, index) => [clauseType, index]),
  );
  return [...flags].sort((a, b) => {
    const band = severityRank(a.severity) - severityRank(b.severity);
    if (band !== 0) return band;
    return (
      (published.get(a.clauseType) ?? 0) - (published.get(b.clauseType) ?? 0)
    );
  });
}
