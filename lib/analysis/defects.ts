/* Two kinds of defect, kept apart.
 *
 * A flag whose quoted sentence is not in the text is evidence that the text was
 * not recovered faithfully: the defect is behind the extraction boundary and the
 * fix belongs there, never in loosening the match (ADR 0001, `PRD.md` §4.8). A
 * flag that quotes a real sentence and says the wrong thing about it is a defect
 * in the analysis. The two have different owners and different remedies, so a
 * report that adds them together tells you to look in the wrong place.
 *
 * This module is the vocabulary both halves of the harness use, so the report
 * can group by side without either half deciding for itself what a defect means.
 */

import type { ClauseType } from "./taxonomy";

/** Which of the two seams a defect belongs behind. */
export type DefectSide = "extraction" | "analysis";

export type DefectKind =
  /** A flag's source sentence does not occur in the text it was produced from,
   *  so the flag was dropped at the citation gate. */
  | "source-sentence-not-in-the-document"
  /** A sentence the corpus records as known-present did not survive extraction
   *  intact, so no flag could ever cite it. */
  | "source-sentence-did-not-survive-extraction"
  /** The extraction boundary refused a corpus document outright. */
  | "extraction-refused"
  /** A clause the corpus labels in this document produced no flag. */
  | "labelled-clause-not-flagged"
  /** A flag for a clause type this document is not labelled as containing. */
  | "flag-for-an-unlabelled-clause-type"
  /** A flag carrying a severity other than the band the taxonomy fixes for its
   *  clause type (ADR 0003). */
  | "severity-is-not-the-taxonomy-band"
  /** No flags at all on a document labelled as carrying at least one flaggable
   *  clause: the output `PRD.md` §4.4 says must never occur. */
  | "all-clear-on-a-document-labelled-as-flagged";

export const DEFECT_SIDES: Readonly<Record<DefectKind, DefectSide>> = {
  "source-sentence-not-in-the-document": "extraction",
  "source-sentence-did-not-survive-extraction": "extraction",
  "extraction-refused": "extraction",
  "labelled-clause-not-flagged": "analysis",
  "flag-for-an-unlabelled-clause-type": "analysis",
  "severity-is-not-the-taxonomy-band": "analysis",
  "all-clear-on-a-document-labelled-as-flagged": "analysis",
};

/** Which side a kind of defect belongs to. The one place that answer is
 *  written down. */
export function defectSide(kind: DefectKind): DefectSide {
  return DEFECT_SIDES[kind];
}

export type Defect = {
  readonly kind: DefectKind;
  readonly side: DefectSide;
  /** The corpus document it was observed on. */
  readonly documentId: string;
  readonly clauseType: ClauseType | null;
  /** What was observed, flatly, in one sentence. */
  readonly statement: string;
};

export function defect(
  kind: DefectKind,
  detail: {
    readonly documentId: string;
    readonly clauseType?: ClauseType | null;
    readonly statement: string;
  },
): Defect {
  return {
    kind,
    side: defectSide(kind),
    documentId: detail.documentId,
    clauseType: detail.clauseType ?? null,
    statement: detail.statement,
  };
}

/** The defects on one side, in the order they were observed. */
export function defectsOn(
  defects: readonly Defect[],
  side: DefectSide,
): readonly Defect[] {
  return defects.filter((each) => each.side === side);
}
