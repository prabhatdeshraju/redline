/* The harness, from a terminal.
 *
 *     npm run harness
 *     npm run harness -- --analyser <path to a module>
 *
 * It needs an analyser, and it has none of its own. A module named with
 * `--analyser` supplies one, by exporting either
 *
 *     export const analyse: Analyser
 *     export function createAnalyser(context: { corpus, root }): Analyser
 *
 * and optionally `export const describe: string`, which is what the report prints
 * as the thing that ran. `npm run harness` names the analyser built out of the
 * corpus's own labels, which measures the harness rather than Redline; ticket 04's
 * analysis boundary is named the same way once it exists.
 *
 * It needs no model and no key. Given neither an analyser nor a key it says so and
 * stops, because a run that quietly measured nothing would look like a pass.
 */

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import type { Analyser } from "@/lib/analysis/analysis";
import { loadCorpus, repositoryRoot, type Corpus } from "@/lib/harness/corpus";
import { renderReport } from "@/lib/harness/report";
import { runHarness } from "@/lib/harness/run";

type Arguments = {
  readonly analyserPath: string | null;
  readonly help: boolean;
};

function parseArguments(argv: readonly string[]): Arguments {
  let analyserPath: string | null = null;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      help = true;
    } else if (argument === "--analyser" || argument === "--analyzer") {
      /* The last one wins, so `npm run harness -- --analyser x` overrides the one
         the package script names rather than being ignored behind it. */
      analyserPath = argv[index + 1] ?? null;
      index += 1;
    } else if (argument.startsWith("--analyser=")) {
      analyserPath = argument.slice("--analyser=".length);
    }
  }

  return { analyserPath, help };
}

const USAGE = `Runs one analysis across the labelled corpus and prints what it found.

  npm run harness                          the analyser built from the corpus labels
  npm run harness -- --analyser <module>   any module exporting analyse or createAnalyser

The module is a path from the repository root. It must export one of:

  export const analyse: Analyser                         (documentText, thresholds) => Analysis
  export function createAnalyser({ corpus, root }): Analyser

and may export:

  export const describe: string                          what the report calls it
`;

type AnalyserModule = {
  readonly analyse?: Analyser;
  readonly createAnalyser?: (context: {
    readonly corpus: Corpus;
    readonly root: string;
  }) => Analyser | Promise<Analyser>;
  readonly describe?: string;
};

async function loadAnalyser(
  path: string,
  context: { readonly corpus: Corpus; readonly root: string },
): Promise<{ readonly analyser: Analyser; readonly description: string }> {
  const absolute = resolve(context.root, path);
  let loaded: AnalyserModule;
  try {
    loaded = (await import(pathToFileURL(absolute).href)) as AnalyserModule;
  } catch (error) {
    throw new Error(
      `the analyser module ${path} would not load: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const description = loaded.describe ?? path;

  if (typeof loaded.createAnalyser === "function") {
    return { analyser: await loaded.createAnalyser(context), description };
  }
  if (typeof loaded.analyse === "function") {
    return { analyser: loaded.analyse, description };
  }
  throw new Error(
    `${path} exports neither analyse nor createAnalyser, so there is no analysis to run`,
  );
}

async function main(): Promise<number> {
  const { analyserPath, help } = parseArguments(process.argv.slice(2));

  if (help) {
    process.stdout.write(USAGE);
    return 0;
  }

  /* Presence only. The value of a key is never read here and never printed. */
  const hasModelKey = (process.env.OPENROUTER_API_KEY ?? "").length > 0;

  if (analyserPath === null) {
    process.stdout.write(
      [
        "REDLINE CITATION HARNESS",
        "",
        "Nothing was measured: no analyser was given.",
        "",
        "The harness does not contain an analysis of its own. It runs the one it is",
        "handed, so that what it measures is the analysis the product ships.",
        hasModelKey
          ? "OPENROUTER_API_KEY is set in this environment, which is not enough on its own:"
          : "OPENROUTER_API_KEY is not set in this environment, and no analyser was named:",
        "the analysis boundary that calls a model is ticket 04's work and is not",
        "wired up yet. Nothing here needs a key.",
        "",
        USAGE,
      ].join("\n"),
    );
    return 1;
  }

  const root = repositoryRoot();
  const corpus = loadCorpus(root);
  const { analyser, description } = await loadAnalyser(analyserPath, {
    corpus,
    root,
  });

  const run = await runHarness({
    analyser,
    analyserDescription: description,
    corpus,
    root,
  });

  process.stdout.write(
    renderReport(run, {
      notes: [
        `Analyser module  ${analyserPath}`,
        hasModelKey
          ? "OPENROUTER_API_KEY is set; this run did not use it"
          : "OPENROUTER_API_KEY is not set; this run did not need one",
      ],
    }),
  );

  return run.passed ? 0 : 1;
}

/* A failure in the harness itself is reported as a sentence, not a stack trace:
   whoever runs this needs to know what could not be done. */
main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stdout.write(
      `The harness could not complete: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  },
);
