/* Redline's own analysis, built from the environment.
 *
 *     npm run harness -- --analyser lib/analysis/redline-analyser.ts
 *
 * The citation harness contains no analysis of its own; it runs the one it is
 * handed. This module is how it is handed the real one, so that when a key is
 * present the numbers in a report are measurements of the product rather than of
 * a fixture. `npm run harness` with no argument still names the label-derived
 * analyser under `tests/`, needs no key, and passes.
 *
 * It is the one production wiring of the model client: the environment in, an
 * analyser out. Everything it composes — the boundary, the taxonomy, the citation
 * gate — is the same code the product runs, and the only thing that differs
 * between a harness run and a reader's document is which text goes in.
 *
 * WHAT A RUN OF THIS MEASURES TODAY, AND WHAT IT DOES NOT
 *
 * This build searches for one of the eight clause types (`clause-search.ts`:
 * personal guarantees; the rest are ticket 05). So a corpus document whose only
 * labelled clauses are of the other seven produces no flags, and the harness will
 * report that, correctly, as a false all-clear against its labels. The gate to
 * read on this analyser today is citation integrity — every sentence it quoted
 * occurs verbatim in the text it was produced from — and per-clause-type recall
 * for the one type in scope. Both are real numbers about the shipping analysis.
 */

import { modelClientFromEnvironment, modelConfiguration } from "@/lib/model/openrouter";

import type { Analyser } from "./analysis";
import { asAnalyser, createAnalysisBoundary } from "./boundary";
import { CLAUSE_TYPES_IN_SCOPE } from "./clause-search";
import { clauseTypeEntry } from "./taxonomy";

/** What the report calls the thing that ran. */
export const describe = [
  "Redline's analysis boundary, calling a model through OpenRouter, searching for",
  CLAUSE_TYPES_IN_SCOPE.map((clauseType) => clauseTypeEntry(clauseType).title)
    .join(", ")
    .toLowerCase(),
  `(${CLAUSE_TYPES_IN_SCOPE.length} of the 8 clause types; the rest are ticket 05)`,
].join(" ");

/** The analyser, or a stated reason there is none.
 *
 * An unconfigured environment fails here, loudly, rather than producing an
 * analyser that would return nothing for every document: a run reporting
 * no flags across the corpus because no key was set would look like a measured
 * result and would not be one. */
export function createAnalyser(): Analyser {
  const configuration = modelConfiguration(process.env);
  if (configuration.outcome === "unconfigured") {
    throw new Error(
      `${configuration.statement} Nothing was measured: a run of the real analysis needs a key and a model identifier.`,
    );
  }

  return asAnalyser(
    createAnalysisBoundary({ model: modelClientFromEnvironment(process.env) }),
  );
}
