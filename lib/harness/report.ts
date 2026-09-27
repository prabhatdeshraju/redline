/* The report, as text a person reads.
 *
 * Three rules, all from ADR 0004. It is flat about what happened: counts, ids and
 * sentences, with no adjectives. It is hedged about what a number means, because
 * a recall figure measured against authored documents is weaker evidence than the
 * same figure against real ones and the report has to say so. And it reaches no
 * verdict beyond the two gates that are already decided — it prints the recall and
 * precision numbers and states plainly that the threshold for them is not set and
 * is the owner's to set (`PRD.md` §4.2, §4.3).
 *
 * Extraction defects and analysis defects are printed in separate sections and
 * never added together. They have different owners: a dropped citation means the
 * text was not recovered faithfully and the fix is behind the extraction boundary
 * (`PRD.md` §4.8); a wrong-but-citable flag means the analysis read a real
 * sentence wrongly.
 */

import { defectsOn, type Defect } from "@/lib/analysis/defects";

import type { DocumentRun, HarnessRun } from "./run";
import type { ClauseTypeTally } from "./measure";

const RULE = "-".repeat(78);

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

function padLeft(text: string, width: number): string {
  return text.length >= width ? text : " ".repeat(width - text.length) + text;
}

function ratio(value: number | null): string {
  return value === null ? "-" : value.toFixed(2);
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function shorten(sentence: string, width = 66): string {
  const flat = sentence.replace(/\s+/g, " ").trim();
  return flat.length <= width ? flat : `${flat.slice(0, width - 3)}...`;
}

function heading(title: string): string[] {
  return ["", title.toUpperCase(), RULE];
}

function recallTable(tallies: readonly ClauseTypeTally[]): string[] {
  const lines = [
    pad("CLAUSE TYPE", 32) +
      pad("BAND", 9) +
      padLeft("LABELLED", 9) +
      padLeft("FLAGGED", 9) +
      padLeft("DROPPED", 9) +
      padLeft("MISSED", 8) +
      padLeft("RECALL", 8),
  ];
  for (const tally of tallies) {
    lines.push(
      pad(tally.clauseType, 32) +
        pad(tally.severity, 9) +
        padLeft(String(tally.labelled), 9) +
        padLeft(String(tally.flagged), 9) +
        padLeft(String(tally.droppedAtTheGate), 9) +
        padLeft(String(tally.notFlagged), 8) +
        padLeft(ratio(tally.recall), 8),
    );
  }
  return lines;
}

function precisionTable(tallies: readonly ClauseTypeTally[]): string[] {
  const lines = [
    pad("CLAUSE TYPE", 32) +
      pad("BAND", 9) +
      padLeft("FLAGS", 8) +
      padLeft("MATCHED", 9) +
      padLeft("UNMATCHED", 11) +
      padLeft("PRECISION", 11),
  ];
  for (const tally of tallies) {
    lines.push(
      pad(tally.clauseType, 32) +
        pad(tally.severity, 9) +
        padLeft(String(tally.flagsCited), 8) +
        padLeft(String(tally.flagsMatchingALabel), 9) +
        padLeft(String(tally.flagsCited - tally.flagsMatchingALabel), 11) +
        padLeft(ratio(tally.precision), 11),
    );
  }
  return lines;
}

function documentLine(run: DocumentRun): string {
  const extraction =
    run.extraction.outcome === "refused"
      ? `refused: ${run.extraction.reason}`
      : `${run.extraction.characters} chars`;

  const analysis =
    run.notAnalysed === "adhesion-contract"
      ? "not analysed (adhesion)"
      : run.notAnalysed === "extraction-refused"
        ? "not analysed"
        : run.allClear
          ? "all-clear"
          : `${plural(run.measurement?.flagsCited ?? 0, "flag")}, ${run.measurement?.flagsDropped ?? 0} dropped`;

  return (
    pad(run.document.id, 30) +
    pad(run.document.role, 18) +
    pad(extraction, 16) +
    analysis
  );
}

function defectLines(defects: readonly Defect[]): string[] {
  if (defects.length === 0) return ["None."];
  return defects.map((each) => `${each.documentId}: ${each.statement}`);
}

export type ReportContext = {
  /** Facts about the environment this run happened in, printed at the top. */
  readonly notes?: readonly string[];
};

export function renderReport(
  run: HarnessRun,
  context: ReportContext = {},
): string {
  const lines: string[] = [];
  const analysed = run.documents.filter((each) => each.notAnalysed === null);

  lines.push("REDLINE CITATION HARNESS");
  lines.push(RULE);
  lines.push(`Analyser        ${run.analyserDescription}`);
  lines.push(
    `Corpus          version ${run.corpusVersion}, ${run.documents.length} documents, ${analysed.length} analysed`,
  );
  lines.push(`Taxonomy        version ${run.taxonomyVersion}, eight clause types`);
  for (const note of context.notes ?? []) {
    lines.push(`                ${note}`);
  }

  lines.push(...heading("What ran"));
  lines.push(
    pad("DOCUMENT", 30) + pad("ROLE", 18) + pad("EXTRACTION", 16) + "ANALYSIS",
  );
  for (const each of run.documents) lines.push(documentLine(each));

  lines.push("");
  lines.push("Provenance of every document in the corpus:");
  const byProvenance = new Map<string, number>();
  for (const each of run.documents) {
    byProvenance.set(
      each.document.provenance,
      (byProvenance.get(each.document.provenance) ?? 0) + 1,
    );
  }
  for (const [provenance, count] of byProvenance) {
    lines.push(`  ${count} ${provenance}`);
  }
  if (byProvenance.has("authored-for-this-repo")) {
    lines.push(
      "  Documents authored for this repository are weaker evidence than real",
    );
    lines.push(
      "  negotiable documents: an authored document contains the clauses its",
    );
    lines.push(
      "  author was thinking about. See tests/corpus/README.md.",
    );
  }

  const sharedLabels = new Map<string, string[]>();
  for (const each of run.documents) {
    const sharing = sharedLabels.get(each.document.labelsPath) ?? [];
    sharing.push(each.document.id);
    sharedLabels.set(each.document.labelsPath, sharing);
  }
  for (const [path, ids] of sharedLabels) {
    if (ids.length > 1) {
      lines.push("");
      lines.push(
        `${ids.length} entries carry the same prose in different files, and share`,
      );
      lines.push(`  one labels sidecar (${path}):`);
      for (const id of ids) lines.push(`    ${id}`);
      lines.push("  A clause labelled there is counted once for each of them.");
    }
  }

  lines.push(...heading("Extraction"));
  for (const each of run.documents) {
    const survived = each.sentencesChecked - each.sentencesMissing.length;
    const repairs =
      each.extraction.outcome === "extracted" && each.extraction.repairs.length > 0
        ? `; ${each.extraction.repairs.join(", ")}`
        : "";
    const survival =
      each.sentencesChecked === 0
        ? "no sentences recorded as known-present"
        : `${survived}/${each.sentencesChecked} known sentences intact`;
    lines.push(`${pad(each.document.id, 30)}${survival}${repairs}`);
  }

  lines.push(...heading("Citation gate"));
  lines.push(
    `Flags produced by the analyser      ${padLeft(String(run.citations.checked), 5)}`,
  );
  lines.push(
    `Flags quoting a sentence found      ${padLeft(String(run.citations.cited), 5)}`,
  );
  lines.push(
    `Flags dropped, never returned       ${padLeft(String(run.citations.dropped), 5)}`,
  );
  lines.push("");
  lines.push(
    "The check is a plain substring match of the sentence exactly as the flag",
  );
  lines.push(
    "carries it: not normalised, not trimmed, not case-folded, not fuzzy.",
  );
  if (run.citations.dropped > 0) {
    lines.push("");
    lines.push("Dropped:");
    for (const each of run.documents) {
      for (const drop of each.analysis?.citations.dropped ?? []) {
        lines.push(
          `  ${each.document.id} / ${drop.flag.clauseType} (${drop.reason})`,
        );
        lines.push(`    quoted: "${shorten(drop.flag.sourceSentence)}"`);
      }
    }
  }

  lines.push(...heading("Recall, per clause type"));
  lines.push(
    "LABELLED is the instances the corpus labels across the documents analysed.",
  );
  lines.push(
    "DROPPED is instances a flag was produced for and the gate then dropped: an",
  );
  lines.push(
    "extraction defect. MISSED is instances no flag was produced for at all: an",
  );
  lines.push("analysis defect. RECALL counts FLAGGED only.");
  lines.push("");
  lines.push(...recallTable(run.tallies));
  if (run.clauseTypesWithoutLabels.length > 0) {
    lines.push("");
    lines.push(
      `Clause types the corpus labels no instance of: ${run.clauseTypesWithoutLabels.join(", ")}.`,
    );
    lines.push(
      "Nothing can be claimed about a clause type with nothing labelled.",
    );
  }

  lines.push(...heading("Precision, per clause type"));
  lines.push(
    "FLAGS is the flags that survived the gate. MATCHED is those that line up",
  );
  lines.push(
    "with a labelled instance. UNMATCHED quotes a real sentence of the document",
  );
  lines.push("and is not a clause the corpus labels.");
  lines.push("");
  lines.push(...precisionTable(run.tallies));

  lines.push(...heading("Extraction defects"));
  lines.push(
    "A flag whose sentence is not in the text, or a known sentence that did not",
  );
  lines.push(
    "survive: the text was not recovered faithfully and the fix belongs behind",
  );
  lines.push("the extraction boundary, never in loosening the match (ADR 0001).");
  lines.push("");
  lines.push(...defectLines(defectsOn(run.defects, "extraction")));

  lines.push(...heading("Analysis defects"));
  lines.push(
    "A clause no flag was produced for, a flag for a clause type the document is",
  );
  lines.push(
    "not labelled with, or a severity that is not the taxonomy's band. These",
  );
  lines.push("quote real sentences and read them wrongly.");
  lines.push("");
  lines.push(...defectLines(defectsOn(run.defects, "analysis")));

  lines.push(...heading("All-clear"));
  const allClearDocuments = run.documents.filter((each) => each.allClear);
  lines.push(
    `Documents labelled as carrying no flaggable clause: ${run.documents.filter((each) => each.document.labels.expectedAllClear).length}`,
  );
  lines.push(`Documents that returned an all-clear: ${allClearDocuments.length}`);
  lines.push(
    `Documents labelled as flagged that returned nothing: ${run.falseAllClears.length}`,
  );
  if (run.falseAllClears.length > 0) {
    for (const id of run.falseAllClears) lines.push(`  ${id}`);
  }

  lines.push(...heading("Gates"));
  for (const gate of run.gates) {
    lines.push(`${gate.passed ? "PASS" : "FAIL"}  ${gate.name} — ${gate.source}`);
    lines.push(`      ${gate.statement}`);
  }

  lines.push(...heading("Not gated"));
  lines.push(
    "Recall and precision above are measured and printed. No pass or fail is",
  );
  lines.push(
    "applied to either: PRD.md §4.2 and §4.3 leave every threshold unset, and",
  );
  lines.push(
    "the number is the owner's to set. It belongs per clause type rather than in",
  );
  lines.push("aggregate, which is why there is a row for each of the eight.");
  lines.push("");
  lines.push(
    "Counter-offer quality (PRD.md §4.7) is not measured here and has no",
  );
  lines.push(
    "automated proxy. Grounded question answering (§4.5) and calibration (§4.6)",
  );
  lines.push("are not measured here either.");

  lines.push("");
  lines.push(RULE);
  lines.push(
    run.passed
      ? "Run passed: every gate above held."
      : `Run failed: ${run.gates.filter((gate) => !gate.passed).length} of ${run.gates.length} gates did not hold.`,
  );

  return `${lines.join("\n")}\n`;
}
