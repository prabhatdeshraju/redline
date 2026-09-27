/* Comparing one analysis against one document's labels.
 *
 * Two rules shape everything here.
 *
 * The first is that a clause the corpus labels can go missing for two different
 * reasons, and they are not the same defect. If the analyser produced a flag for
 * it and the citation gate dropped that flag, the quoted sentence was not in the
 * text: the defect is behind the extraction boundary (`PRD.md` §4.8). If no flag
 * was produced at all, the analysis missed it. Recall counts neither as found,
 * and the report keeps them in separate columns, because adding them together
 * sends whoever reads it to the wrong module.
 *
 * The second is that nothing here gates. Recall and precision are measured and
 * printed; `PRD.md` §4.2 and §4.3 leave every threshold unset and the spec says
 * an agent reaching one should stop rather than choose a number. The only gate in
 * the harness is the citation check, which is binary and already decided by
 * ADR 0001.
 */

import type { CitedAnalysis } from "@/lib/analysis/citation-gate";
import type { Flag } from "@/lib/analysis/analysis";
import { defect, type Defect } from "@/lib/analysis/defects";
import {
  CLAUSE_TAXONOMY,
  severityOf,
  type ClauseType,
  type Severity,
} from "@/lib/analysis/taxonomy";

import type { CorpusDocument, LabelledClause } from "./corpus";

export type ClauseOutcome =
  /** A flag for this clause survived the citation gate. */
  | "flagged"
  /** A flag for it was produced and dropped at the gate: its quoted sentence was
   *  not in the text it was produced from. */
  | "dropped-at-the-gate"
  /** No flag for it was produced at all. */
  | "not-flagged";

export type ClauseMatch = {
  readonly clause: LabelledClause;
  readonly outcome: ClauseOutcome;
  /** Whether the flag quoted the sentence the corpus labels this clause with. A
   *  flag can be citable and quote a different sentence of the same document; that
   *  is recorded rather than judged, because another sentence of the same clause
   *  may be a fair citation. */
  readonly quotedTheLabelledSentence: boolean;
};

export type DocumentMeasurement = {
  readonly documentId: string;
  readonly matches: readonly ClauseMatch[];
  /** Flags that survived the gate and match no labelled clause. */
  readonly unmatchedFlags: readonly Flag[];
  readonly flagsProduced: number;
  readonly flagsCited: number;
  readonly flagsDropped: number;
  /** Nothing was flagged, on a document labelled as carrying at least one
   *  flaggable clause: the output `PRD.md` §4.4 says must never occur. */
  readonly falseAllClear: boolean;
  readonly defects: readonly Defect[];
};

function take(
  pool: Flag[],
  predicate: (flag: Flag) => boolean,
): Flag | undefined {
  const index = pool.findIndex(predicate);
  if (index === -1) return undefined;
  return pool.splice(index, 1)[0];
}

/** Compare a cited analysis against what the corpus says the document contains.
 *
 * Several instances of one clause type are matched one flag to one clause rather
 * than collapsed, because a contract with three separate indemnities must not
 * look like a contract with one (spec, user story 24). */
export function measureAgainstLabels(
  document: CorpusDocument,
  analysis: CitedAnalysis,
): DocumentMeasurement {
  const cited = [...analysis.flags];
  const dropped = analysis.citations.dropped.map((each) => each.flag);
  const defects: Defect[] = [];

  /* Every drop is an extraction-side defect, whether or not it lines up with a
     labelled clause. */
  for (const drop of analysis.citations.dropped) {
    defects.push(
      defect("source-sentence-not-in-the-document", {
        documentId: document.id,
        clauseType: drop.flag.clauseType,
        statement:
          drop.reason === "empty-source-sentence"
            ? `A ${drop.flag.clauseType} flag quoted no sentence at all, so it was dropped.`
            : `A ${drop.flag.clauseType} flag quoted a sentence that does not occur in this document's text, so it was dropped: "${shorten(drop.flag.sourceSentence)}"`,
      }),
    );
  }

  const matches: ClauseMatch[] = document.labels.plantedClauses.map((clause) => {
    const exact = take(
      cited,
      (flag) =>
        flag.clauseType === clause.clauseType &&
        flag.sourceSentence === clause.sourceSentence,
    );
    if (exact) {
      return { clause, outcome: "flagged", quotedTheLabelledSentence: true };
    }

    const sameType = take(cited, (flag) => flag.clauseType === clause.clauseType);
    if (sameType) {
      return { clause, outcome: "flagged", quotedTheLabelledSentence: false };
    }

    const droppedForThisClause = take(
      dropped,
      (flag) => flag.clauseType === clause.clauseType,
    );
    if (droppedForThisClause) {
      return {
        clause,
        outcome: "dropped-at-the-gate",
        quotedTheLabelledSentence: false,
      };
    }

    defects.push(
      defect("labelled-clause-not-flagged", {
        documentId: document.id,
        clauseType: clause.clauseType,
        statement: `Clause ${clause.clauseRef} is labelled ${clause.clauseType} (${clause.severity}) and produced no flag.`,
      }),
    );
    return { clause, outcome: "not-flagged", quotedTheLabelledSentence: false };
  });

  for (const flag of cited) {
    defects.push(
      defect("flag-for-an-unlabelled-clause-type", {
        documentId: document.id,
        clauseType: flag.clauseType,
        statement: `A ${flag.clauseType} flag quotes a sentence of this document, which the corpus does not label as containing that clause type: "${shorten(flag.sourceSentence)}"`,
      }),
    );
  }

  for (const flag of analysis.flags) {
    if (flag.severity !== severityOf(flag.clauseType)) {
      defects.push(
        defect("severity-is-not-the-taxonomy-band", {
          documentId: document.id,
          clauseType: flag.clauseType,
          statement: `A ${flag.clauseType} flag carries severity ${flag.severity}; the taxonomy fixes that clause type at ${severityOf(flag.clauseType)}.`,
        }),
      );
    }
  }

  const labelled = document.labels.plantedClauses.length;
  const falseAllClear = labelled > 0 && analysis.flags.length === 0;
  if (falseAllClear && analysis.citations.dropped.length === 0) {
    defects.push(
      defect("all-clear-on-a-document-labelled-as-flagged", {
        documentId: document.id,
        clauseType: null,
        statement: `This document is labelled as carrying ${labelled} flaggable ${labelled === 1 ? "clause" : "clauses"} and the analysis returned none.`,
      }),
    );
  }

  return {
    documentId: document.id,
    matches,
    unmatchedFlags: cited,
    flagsProduced: analysis.citations.checked,
    flagsCited: analysis.citations.cited,
    flagsDropped: analysis.citations.dropped.length,
    falseAllClear,
    defects,
  };
}

export type ClauseTypeTally = {
  readonly clauseType: ClauseType;
  readonly severity: Severity;
  /** Labelled instances of this clause type across the documents that were
   *  analysed. */
  readonly labelled: number;
  readonly flagged: number;
  readonly droppedAtTheGate: number;
  readonly notFlagged: number;
  /** Flags of this type that survived the gate. */
  readonly flagsCited: number;
  readonly flagsMatchingALabel: number;
  /** Share of labelled instances that produced a surviving flag, or null when the
   *  corpus labels none of this type — which is itself the thing `PRD.md` §4.2
   *  warns about, and is why this is reported per type. */
  readonly recall: number | null;
  /** Share of surviving flags that match a labelled instance, or null when none
   *  were raised. */
  readonly precision: number | null;
};

export function tallyByClauseType(
  measurements: readonly DocumentMeasurement[],
  citedFlagsByDocument: ReadonlyMap<string, readonly Flag[]>,
): readonly ClauseTypeTally[] {
  return CLAUSE_TAXONOMY.map((entry) => {
    const matches = measurements.flatMap((measurement) =>
      measurement.matches.filter(
        (match) => match.clause.clauseType === entry.clauseType,
      ),
    );
    const flagged = matches.filter((match) => match.outcome === "flagged").length;
    const droppedAtTheGate = matches.filter(
      (match) => match.outcome === "dropped-at-the-gate",
    ).length;
    const notFlagged = matches.filter(
      (match) => match.outcome === "not-flagged",
    ).length;

    let flagsCited = 0;
    for (const flags of citedFlagsByDocument.values()) {
      flagsCited += flags.filter(
        (flag) => flag.clauseType === entry.clauseType,
      ).length;
    }

    const unmatched = measurements.flatMap((measurement) =>
      measurement.unmatchedFlags.filter(
        (flag) => flag.clauseType === entry.clauseType,
      ),
    ).length;
    const flagsMatchingALabel = flagsCited - unmatched;

    return {
      clauseType: entry.clauseType,
      severity: entry.severity,
      labelled: matches.length,
      flagged,
      droppedAtTheGate,
      notFlagged,
      flagsCited,
      flagsMatchingALabel,
      recall: matches.length === 0 ? null : flagged / matches.length,
      precision: flagsCited === 0 ? null : flagsMatchingALabel / flagsCited,
    };
  });
}

function shorten(sentence: string): string {
  const flat = sentence.replace(/\s+/g, " ").trim();
  return flat.length <= 90 ? flat : `${flat.slice(0, 87)}...`;
}
