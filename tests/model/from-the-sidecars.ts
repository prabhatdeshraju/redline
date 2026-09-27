/* Model clients for the suite, answering out of the labelled sidecars.
 *
 * This is the one thing the ticket authorises stubbing: the *model client*, so the
 * suite runs without a key. The analysis boundary is not stubbed anywhere. It is
 * handed one of these and then does its own real work on the payload — reads it,
 * rejects what is out of scope, applies the taxonomy's severity band, runs the
 * citation gate, counts what the gate dropped. Every assertion in
 * `tests/analysis-boundary.test.ts` is about that work.
 *
 * The payloads are not invented. They are built from `tests/fixtures/*.json` and
 * `tests/corpus/documents/*.json`, which already carry the exact sentences and
 * the bands, so a client here answers with what a correct model would answer for
 * whichever document text it was handed — and `fabricating` answers with something
 * a model that hallucinated would answer, which is what the citation gate is for.
 *
 * These live under `tests/` because the harness and the boundary both take their
 * model client as an argument and contain none. Nothing that ships can reach this
 * file.
 */

import { labelledClausesOf, loadCorpus, type Corpus } from "@/lib/harness/corpus";
import {
  answered,
  modelFailure,
  unavailable,
  type ModelClient,
  type ModelFailureKind,
  type ModelRequest,
} from "@/lib/model/model-client";
import type { ClauseType } from "@/lib/analysis/taxonomy";

export type ProposedEntry = {
  readonly clauseType: ClauseType;
  readonly sourceSentence: string;
  readonly whatItPermits?: string;
};

export type SidecarOptions = {
  readonly corpus?: Corpus;
  /** Entries to append to whatever the labels produced: a sentence that is not in
   *  the document, a quotation of nothing, a clause type that was not asked for. */
  readonly alsoProposing?: readonly ProposedEntry[];
  /** Somewhere to record what the boundary asked for, when a test cares. */
  readonly requests?: ModelRequest[];
};

/** Every labelled clause whose source sentence occurs in the text the boundary
 *  handed over, as the entries a correct model would answer with.
 *
 * It answers with every clause type the labels carry, not only the ones in scope.
 * That is deliberate: the boundary is the thing that has to keep an out-of-scope
 * clause type out of the analysis, and a client that filtered for it would hide
 * whether it does. */
export function entriesFromSidecars(
  corpus: Corpus,
  input: string,
): readonly ProposedEntry[] {
  const entries: ProposedEntry[] = [];
  const seen = new Set<string>();

  for (const { clause } of labelledClausesOf(corpus)) {
    if (!input.includes(clause.sourceSentence)) continue;
    const identity = `${clause.clauseType} ${clause.sourceSentence}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    entries.push({
      clauseType: clause.clauseType,
      sourceSentence: clause.sourceSentence,
      whatItPermits: clause.whatItPermits,
    });
  }

  return entries;
}

/** A model client that answers correctly for any document in the labelled set. */
export function modelClientFromSidecars(
  options: SidecarOptions = {},
): ModelClient {
  const corpus = options.corpus ?? loadCorpus();

  return async (request) => {
    options.requests?.push(request);
    return answered({
      flags: [
        ...entriesFromSidecars(corpus, request.input),
        ...(options.alsoProposing ?? []),
      ],
    });
  };
}

/** A model client answering a payload written out by the test: for the shapes the
 *  labels cannot produce — a severity the boundary must ignore, a statement in the
 *  wrong voice, a structure that is not the one that was asked for. */
export function modelClientAnswering(payload: unknown): ModelClient {
  return async () => answered(payload);
}

/** A model client that cannot answer. */
export function modelClientFailing(
  kind: ModelFailureKind,
  statement: string,
): ModelClient {
  return async () => unavailable(modelFailure(kind, statement));
}
