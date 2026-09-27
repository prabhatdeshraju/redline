/* The citation gate: the thing ADR 0001 is about.
 *
 *     applyCitationGate(analysis, documentText) -> CitedAnalysis
 *
 * Every flag's source sentence must occur verbatim in the text the analysis was
 * produced from. Verbatim means a plain substring match of the sentence exactly
 * as the flag carries it: not normalised, not trimmed, not case-folded, not
 * fuzzy, no punctuation folded, no whitespace collapsed. That is the whole
 * check, and its cheapness is the point — it is the only property of the output
 * a reader can verify unaided, by searching their own copy for the sentence
 * (`PRD.md` §4.1).
 *
 * A flag that fails is dropped, and the drop is counted. Nothing is repaired
 * here: when a sentence fails to match because the text was mangled on the way
 * in, the fix belongs behind the extraction boundary, never in loosening this
 * match (ADR 0001, `PRD.md` §4.8).
 *
 * WHY THE SIGNATURE IS SHAPED THIS WAY
 *
 * It takes a whole analysis and the whole text, and returns the analysis that is
 * allowed to cross the boundary. That makes it callable as the last statement of
 * the analysis boundary — `return applyCitationGate(analysis, documentText)` —
 * which is where the spec puts it, and which is the placement that makes a test
 * at the seam able to catch an ADR 0001 violation.
 *
 * A gate shaped for the renderer would look different: a predicate over one
 * flag, or a filter the view calls while drawing a list. Either would leave an
 * unciteable flag in the value the boundary returns, where the suite gate cannot
 * see it, and would have to be called again by every other consumer — the
 * library, the counter-offer drafter, the saved analysis reopened a week later.
 * The gate takes the pair because the pair is what the invariant is about: this
 * analysis, against this text.
 */

import type { Analysis, Flag } from "./analysis";

export type CitationDropReason =
  /** The sentence does not occur in the document text. */
  | "not-in-the-document"
  /** The flag quoted nothing at all. */
  | "empty-source-sentence";

export type CitationDrop = {
  readonly flag: Flag;
  readonly reason: CitationDropReason;
};

/** What the gate saw, kept for diagnostics. A document producing many drops is
 *  an extraction defect rather than an analysis defect, and the two have to stay
 *  distinguishable (spec, "The citation gate lives inside the analysis
 *  boundary"). */
export type CitationRecord = {
  /** Flags the analyser produced. */
  readonly checked: number;
  /** Flags whose source sentence was found, and which therefore survive. */
  readonly cited: number;
  readonly dropped: readonly CitationDrop[];
};

/** An analysis that has been through the gate. Every flag in it can produce its
 *  source sentence out of the text it was analysed against. */
export type CitedAnalysis = {
  readonly flags: readonly Flag[];
  readonly citations: CitationRecord;
};

/** True when this flag's source sentence occurs in this text, exactly as the
 *  flag carries it.
 *
 * A sentence that is empty or nothing but spaces is not citable: an empty string
 * occurs in every text, so accepting one would let a flag quote nothing and pass.
 * That is a check for whether there is a sentence at all, not a normalisation of
 * the comparison — the sentence itself is never altered before matching. */
export function citationReason(
  sourceSentence: string,
  documentText: string,
): CitationDropReason | null {
  /* The type says this is a string. At run time the value arrives from a model's
     JSON, where the type is a claim rather than a guarantee, and a flag with no
     sentence at all has to be dropped rather than throw past the gate. */
  if (typeof sourceSentence !== "string" || sourceSentence.trim().length === 0) {
    return "empty-source-sentence";
  }
  if (!documentText.includes(sourceSentence)) return "not-in-the-document";
  return null;
}

/** The last step before an analysis is returned. Flags that cannot produce their
 *  source sentence out of `documentText` are dropped here and never cross the
 *  boundary; the count of them is recorded. */
export function applyCitationGate(
  analysis: Analysis,
  documentText: string,
): CitedAnalysis {
  const flags: Flag[] = [];
  const dropped: CitationDrop[] = [];

  for (const flag of analysis.flags) {
    const reason = citationReason(flag.sourceSentence, documentText);
    if (reason === null) {
      flags.push(flag);
    } else {
      dropped.push({ flag, reason });
    }
  }

  return {
    flags,
    citations: {
      checked: analysis.flags.length,
      cited: flags.length,
      dropped,
    },
  };
}

/** True when this analysis is an all-clear: nothing was flagged, and nothing was
 *  dropped on the way.
 *
 * The second half is not a detail. An analysis whose every flag was dropped at
 * the gate has no flags left in it, and reporting that as an all-clear would turn
 * an extraction defect into the single most dangerous output the product can
 * produce (`PRD.md` §4.4, ADR 0004). */
export function isAllClear(analysis: CitedAnalysis): boolean {
  return analysis.flags.length === 0 && analysis.citations.dropped.length === 0;
}
