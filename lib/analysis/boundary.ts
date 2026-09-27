/* The analysis boundary.
 *
 *     createAnalysisBoundary({ model })
 *       .flags(documentText, thresholds) -> Promise<FlagAnalysis>
 *
 * Document text and the reader's thresholds in, the analysis out. Pure with
 * respect to storage: it neither reads nor writes the library, so the decision to
 * persist stays visible at the call site (spec, "The two seams").
 *
 * WHERE THE CITATION GATE SITS
 *
 * At the end, and nothing after it. `flags` finishes with
 *
 *     return { outcome: "analysed", analysis: applyCitationGate(analysis, documentText) };
 *
 * so a flag whose quoted sentence does not occur in the supplied text is dropped
 * inside this module and never crosses the seam. That placement is the decision
 * rather than an implementation detail: at the render layer instead, a test at
 * this boundary could not catch an ADR 0001 violation and the gate would be
 * worthless. The count of what was dropped is carried out on the analysis, in
 * `citations`, because a document producing many drops is an extraction defect
 * rather than an analysis defect and the two have to stay distinguishable
 * (`PRD.md` §4.8).
 *
 * WHY THE MODEL CLIENT IS HANDED IN
 *
 * The boundary imports the `ModelClient` type and no implementation. Production
 * hands it one built from the environment (`lib/analysis/redline-analyser.ts`);
 * the suite hands it one that answers out of the labelled sidecars. The boundary
 * itself is never stubbed — on either client it does the same real work: assemble
 * the request from the taxonomy, read the answer, apply the severity band, drop
 * what cannot be cited, count the drops.
 *
 * WHY A FAILURE IS NOT AN EMPTY ANALYSIS
 *
 * `FlagAnalysis` is a union, and no failure is expressible as flags. An
 * unconfigured key, a refused request, a network that did not answer, an answer
 * that was not JSON: each comes back as `unavailable` carrying one sentence
 * saying what happened. None of them may arrive as `{ flags: [] }`, because an
 * empty analysis reads as an all-clear and a false all-clear is the most
 * dangerous output this product can produce (`PRD.md` §4.4, ADR 0004).
 *
 * THE OTHER ENTRY POINT
 *
 * The spec gives this boundary two: one that produces flags, and one that answers
 * a reader's question or refuses. Only the first is built here. The second is
 * ticket 10 and the summary is ticket 06; both arrive as further members of
 * `AnalysisBoundary` and further `ModelPurpose` values, calling the same injected
 * client.
 */

import {
  applyCitationGate,
  type CitedAnalysis,
} from "./citation-gate";
import {
  NO_THRESHOLDS,
  type Analyser,
  type Analysis,
  type Flag,
  type Threshold,
} from "./analysis";
import { CLAUSE_TYPES_IN_SCOPE, flagRequest } from "./clause-search";
import {
  clauseTypeEntry,
  isClauseType,
  severityOf,
  type ClauseType,
} from "./taxonomy";
import type { ModelClient, ModelFailure } from "@/lib/model/model-client";

export type AnalysisFailureKind =
  /** The model could not be called, or could not be understood. The model's own
   *  account of it is carried alongside. */
  | "model-unavailable"
  /** The model answered JSON that was not the structure that was asked for, so
   *  there are no flags to read out of it. */
  | "answer-was-not-the-shape-asked-for"
  /** There was no document text to analyse. */
  | "nothing-to-analyse";

export type AnalysisFailure = {
  readonly kind: AnalysisFailureKind;
  /** One sentence stating what happened, flat, safe to show a reader. Never an
   *  all-clear and never advice. */
  readonly statement: string;
  /** The model client's own failure, when there was one. */
  readonly modelFailure: ModelFailure | null;
};

/** What the model proposed, before the citation gate. Reached directly only by
 *  something whose job is to measure the gate: the product calls `flags`. */
export type FlagProposal =
  | { readonly outcome: "proposed"; readonly flags: readonly Flag[] }
  | { readonly outcome: "unavailable"; readonly failure: AnalysisFailure };

/** What crosses the boundary. */
export type FlagAnalysis =
  | { readonly outcome: "analysed"; readonly analysis: CitedAnalysis }
  | { readonly outcome: "unavailable"; readonly failure: AnalysisFailure };

export type AnalysisBoundary = {
  /** The clause types this boundary searches for, for the interface to publish
   *  and for the all-clear to list (ADR 0003, ADR 0004). */
  readonly clauseTypesSearched: readonly ClauseType[];
  /** The entry point the product calls. Gated. */
  readonly flags: (
    documentText: string,
    thresholds?: readonly Threshold[],
  ) => Promise<FlagAnalysis>;
  /** The same work, stopping one statement short of the gate. It exists so the
   *  gate can be measured rather than assumed: a caller that applies the identical
   *  gate in the identical position can count what it dropped, which is invisible
   *  to anything downstream of `flags`. */
  readonly proposeFlags: (
    documentText: string,
    thresholds?: readonly Threshold[],
  ) => Promise<FlagProposal>;
};

export type AnalysisBoundaryOptions = {
  /** The one thing in this product that talks to a model. Injected. */
  readonly model: ModelClient;
  /** Which of the eight to search for. Defaults to what this build has been
   *  measured against. */
  readonly clauseTypes?: readonly ClauseType[];
};

function failure(
  kind: AnalysisFailureKind,
  statement: string,
  modelFailure: ModelFailure | null = null,
): AnalysisFailure {
  return { kind, statement, modelFailure };
}

/** Verdicts and advice, which ADR 0004 puts out of bounds: Redline describes and
 *  declines to advise. A legal outcome asserted as a fact is the same defect in
 *  the other direction, and `PRD.md` §4.6 fails a run for either. */
const VERDICTS: readonly RegExp[] = [
  /\byou should\b/i,
  /\byou ought\b/i,
  /\bdo not sign\b/i,
  /\bdon['’]t sign\b/i,
  /\bwe recommend\b/i,
  /\bi recommend\b/i,
  /\bwe advise\b/i,
  /\bis unenforceable\b/i,
  /\bis illegal\b/i,
  /\bis void\b/i,
  /\bwill not be enforced\b/i,
  /\bwill be enforced\b/i,
];

/** The fewest words that can say what a clause does to a reader rather than name
 *  its category. "This is a personal guarantee." is five. */
const FEWEST_WORDS = 8;

function saysWhatItDoes(statement: string): boolean {
  if (statement.split(/\s+/).length < FEWEST_WORDS) return false;
  return !VERDICTS.some((verdict) => verdict.test(statement));
}

/** What the flag tells the reader the clause does to them.
 *
 * The model's own sentences when they say something concrete and stay inside ADR
 * 0004's voice. Otherwise the taxonomy's own statement of the worst outcome the
 * clause type permits, which is written to that standard and is true of every
 * instance of the type. Never a category name, never empty, and never a verdict:
 * a flag that has passed the citation gate quotes a real sentence out of the
 * reader's document, and dropping it over the wording of its explanation would
 * hide a real risk (ADR 0004 prefers over-flagging at the highest band). */
export function whatItPermits(
  offered: unknown,
  clauseType: ClauseType,
): string {
  const statement = typeof offered === "string" ? offered.trim() : "";
  if (statement.length > 0 && saysWhatItDoes(statement)) return statement;
  return clauseTypeEntry(clauseType).worstCase;
}

type ReadFlags =
  | { readonly read: true; readonly flags: readonly Flag[] }
  | { readonly read: false; readonly why: string };

/** The model's answer, read into flags.
 *
 * Per-entry defects are not repaired and not silently dropped. A missing or
 * non-string sentence becomes an empty one, which the citation gate drops and
 * counts as `empty-source-sentence`: the drop is the record that the model
 * produced something unciteable, and swallowing it here would make the analysis
 * look cleaner than it was.
 *
 * A clause type outside what was asked for is left out. The enum in the schema
 * already forbids it; if one arrives anyway it is a type this build has not been
 * measured against, and reporting it would claim coverage the harness cannot
 * substantiate (ADR 0003). */
function readFlags(
  payload: unknown,
  clauseTypes: readonly ClauseType[],
): ReadFlags {
  if (typeof payload !== "object" || payload === null) {
    return {
      read: false,
      why: "the answer was not an object",
    };
  }
  const offered = (payload as { flags?: unknown }).flags;
  if (!Array.isArray(offered)) {
    return {
      read: false,
      why: "the answer carried no list of flags",
    };
  }

  const inScope = new Set(clauseTypes);
  const flags: Flag[] = [];
  const seen = new Set<string>();

  for (const entry of offered) {
    if (typeof entry !== "object" || entry === null) continue;
    const clauseType = (entry as { clauseType?: unknown }).clauseType;
    if (!isClauseType(clauseType) || !inScope.has(clauseType)) continue;

    const offeredSentence = (entry as { sourceSentence?: unknown })
      .sourceSentence;
    const sourceSentence =
      typeof offeredSentence === "string" ? offeredSentence : "";

    /* Two entries quoting the same sentence for the same clause type are one
       flag. Two instances of the same clause type in different sentences are two
       flags, which is what a contract with three separate indemnities needs. */
    const identity = `${clauseType} ${sourceSentence}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    flags.push({
      clauseType,
      /* From the taxonomy, every time. The model is never asked for a severity
         and one would be ignored if it sent it (ADR 0003). */
      severity: severityOf(clauseType),
      sourceSentence,
      whatItPermits: whatItPermits(
        (entry as { whatItPermits?: unknown }).whatItPermits,
        clauseType,
      ),
    });
  }

  return { read: true, flags };
}

export function createAnalysisBoundary(
  options: AnalysisBoundaryOptions,
): AnalysisBoundary {
  const clauseTypes = options.clauseTypes ?? CLAUSE_TYPES_IN_SCOPE;

  async function proposeFlags(
    documentText: string,
    thresholds: readonly Threshold[] = NO_THRESHOLDS,
  ): Promise<FlagProposal> {
    if (documentText.trim().length === 0) {
      return {
        outcome: "unavailable",
        failure: failure(
          "nothing-to-analyse",
          "There was no document text to analyse, so nothing was looked for. This is not an all-clear.",
        ),
      };
    }

    const spoken = await options.model(
      flagRequest(documentText, thresholds, clauseTypes),
    );

    if (spoken.outcome === "unavailable") {
      return {
        outcome: "unavailable",
        failure: failure(
          "model-unavailable",
          `The analysis did not run. ${spoken.failure.statement}`,
          spoken.failure,
        ),
      };
    }

    const read = readFlags(spoken.payload, clauseTypes);
    if (!read.read) {
      return {
        outcome: "unavailable",
        failure: failure(
          "answer-was-not-the-shape-asked-for",
          `The analysis did not run: ${read.why}, so there are no findings to report. This is not an all-clear.`,
        ),
      };
    }

    return { outcome: "proposed", flags: read.flags };
  }

  async function flags(
    documentText: string,
    thresholds: readonly Threshold[] = NO_THRESHOLDS,
  ): Promise<FlagAnalysis> {
    const proposal = await proposeFlags(documentText, thresholds);
    if (proposal.outcome === "unavailable") return proposal;

    const analysis: Analysis = { flags: proposal.flags };

    /* The gate, and then nothing. Every flag beyond this line can produce its
       source sentence out of the text it was analysed against, and what was
       dropped on the way is counted in `citations`. */
    return {
      outcome: "analysed",
      analysis: applyCitationGate(analysis, documentText),
    };
  }

  return { clauseTypesSearched: clauseTypes, flags, proposeFlags };
}

/** The boundary in the shape a caller that gates for itself takes: the flags as
 *  proposed, before the gate.
 *
 * This is how the citation harness runs the real analysis path. The harness
 * applies the same `applyCitationGate` at the same point, so what it measures is
 * what the boundary would have done — and because it gates the proposal itself it
 * can report how many flags were dropped, which is the number the citation gate
 * exists to keep at zero. Handing it the already-gated analysis would make that
 * number zero by construction and the measurement worthless.
 *
 * A failure is raised rather than returned, because this shape has nowhere to put
 * one: whoever calls it reports the sentence. */
export function asAnalyser(boundary: AnalysisBoundary): Analyser {
  return async (documentText, thresholds) => {
    const proposal = await boundary.proposeFlags(documentText, thresholds);
    if (proposal.outcome === "unavailable") {
      throw new Error(proposal.failure.statement);
    }
    return { flags: proposal.flags };
  };
}
