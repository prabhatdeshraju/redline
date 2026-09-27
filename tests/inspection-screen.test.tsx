/* What the reader sees once they ask for the document to be inspected.
 *
 * Every analysis below comes out of the real analysis boundary — the real request
 * assembly, the real reading of the answer, the real taxonomy band, the real
 * citation gate — run over `tests/fixtures/negotiable-flagged.txt` and
 * `clean.txt`. The only thing standing in for anything is the model client, which
 * answers out of the labelled sidecars, and for the failure states the production
 * client built from an empty environment: the same value a reader gets on a
 * deployment with no key set.
 *
 * So these are screens the application serves, not screens assembled for a test.
 *
 * What each group holds:
 *
 *   the flag on the page      ticket 04 criterion 2 — the sentence, verbatim
 *   copying the sentence      criterion 3 — the control is on the page
 *   the surrounding passage   criterion 4 — enough context to judge the reading
 *   what was looked for       criterion 7 — one clause type, and it says so
 *   every failure             a designed state each, and never an all-clear
 *   dropped flags             an extraction defect, named, not fewer flags
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  InspectionView,
  stageOf,
  type InspectionStage,
} from "@/components/operate/inspection";
import { createAnalysisBoundary, type FlagAnalysis } from "@/lib/analysis/boundary";
import { CLAUSE_TYPES_IN_SCOPE } from "@/lib/analysis/clause-search";
import { CLAUSE_TAXONOMY, clauseTypeEntry } from "@/lib/analysis/taxonomy";
import { loadCorpus, repositoryRoot } from "@/lib/harness/corpus";
import { modelClientFromEnvironment } from "@/lib/model/openrouter";
import type { ModelFailureKind } from "@/lib/model/model-client";

import {
  modelClientAnswering,
  modelClientFailing,
  modelClientFromSidecars,
  type ProposedEntry,
} from "./model/from-the-sidecars";

const root = repositoryRoot();
const corpus = loadCorpus(root);

const fixture = (name: string): string =>
  readFileSync(join(root, "tests", "fixtures", name), "utf8");

const documentText = fixture("negotiable-flagged.txt");
const cleanText = fixture("clean.txt");

type Sidecar = {
  readonly plantedClauses: readonly {
    readonly clauseType: string;
    readonly sourceSentence: string;
    readonly whatItPermits: string;
  }[];
};

const guarantee = (
  JSON.parse(fixture("negotiable-flagged.json")) as Sidecar
).plantedClauses.find((clause) => clause.clauseType === "personal-guarantee");

if (guarantee === undefined) {
  throw new Error(
    "negotiable-flagged.json no longer labels a personal guarantee, so this suite is measuring nothing",
  );
}

/* ------------------------------------------------------------------ *
 * Real analyses, from the real boundary
 * ------------------------------------------------------------------ */

const onTheSidecars = (alsoProposing: readonly ProposedEntry[] = []) =>
  createAnalysisBoundary({
    model: modelClientFromSidecars({ corpus, alsoProposing }),
  });

const flagged: FlagAnalysis = await onTheSidecars().flags(documentText);
const clean: FlagAnalysis = await onTheSidecars().flags(cleanText);

/** A sentence no document in the corpus contains: what a model that invented a
 *  quotation would answer with, and what the citation gate exists to drop. */
const fabricated =
  "Contractor personally guarantees every obligation of every party to this Agreement without limitation of any kind.";

const withADrop: FlagAnalysis = await onTheSidecars([
  { clauseType: "personal-guarantee", sourceSentence: fabricated },
]).flags(documentText);

/** Nothing cited and something dropped: the shape that must never be drawn as an
 *  all-clear, because the only flag there was could not be quoted. */
const onlyADrop: FlagAnalysis = await onTheSidecars([
  { clauseType: "personal-guarantee", sourceSentence: fabricated },
]).flags(cleanText);

const view = (stage: InspectionStage, text: string = documentText): string =>
  renderToStaticMarkup(<InspectionView stage={stage} documentText={text} />);

const screen = (result: FlagAnalysis, text: string = documentText): string =>
  view(stageOf(result), text);

/** A string as it appears in rendered markup. React escapes the five characters
 *  below in a text node, so a sentence carrying an apostrophe is not in the HTML
 *  in the form the fixture spells it — the assertion has to ask for what was
 *  actually served. */
const asRendered = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

/** The screen with the endpoint's own quoted sentence taken out, so an assertion
 *  about Redline's voice is about Redline's words. */
const withoutWhatWasReported = (html: string): string =>
  html.replace(
    /<aside class="notice" aria-labelledby="reported-head">[\s\S]*?<\/aside>/,
    "",
  );

/* ------------------------------------------------------------------ *
 * The flag on the page
 * ------------------------------------------------------------------ */

describe("a flag, on the screen", () => {
  const html = screen(flagged);

  it("is the reviewed flag row: a ruled schedule, numbered, with its clause type", () => {
    expect(html).toContain('class="flags"');
    expect(html).toContain('id="flag-01"');
    expect(html).toContain('class="flag__toggle"');
    expect(html).toContain('<span class="flag__num tnum">01</span>');
    expect(html).toContain(clauseTypeEntry("personal-guarantee").title);
  });

  it("states severity twice — a named rank and a hatch density, never colour alone", () => {
    expect(html).toContain('class="sev sev--1"');
    expect(html).toContain('class="sev__hatch" aria-hidden="true"');
    expect(html).toContain("Highest severity");
    /* The three ranks and no other words for them. */
    expect(html).not.toMatch(/\bcritical\b|\bsevere\b|\bsev(erity)? 1\b/i);
  });

  it("quotes the source sentence verbatim, in the document's own voice", () => {
    expect(html).toContain(guarantee.sourceSentence);
    /* The figure the stylesheet sets in Spectral with its mark-orange top rule,
       and the caption that says what the quotation is. */
    expect(html).toContain('class="source"');
    expect(html).toContain("<blockquote>");
    expect(html).toContain("Source sentence · quoted verbatim");
  });

  it("says what the clause does to the reader, not what it is called", () => {
    expect(html).toContain("What it permits at worst");
    expect(html).toContain(asRendered(guarantee.whatItPermits));
    expect(html).toMatch(/personally responsible/i);
  });

  it("hedges what the clause would mean in law, and offers no verdict", () => {
    expect(html).toContain('class="hedge"');
    expect(html).toMatch(/whether a court would enforce it/i);
    expect(html).not.toMatch(/you should|you ought|don.t sign|do not sign/i);
    expect(html).not.toMatch(/is unenforceable|is illegal|is void/i);
  });

  it("is open on the first paint, so nothing content-bearing waits on JavaScript", () => {
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toContain('class="flag__body" id="flag-01-body" hidden');
  });

  it("uses the product's own words and none of the words it avoids", () => {
    expect(html).not.toMatch(/\bfinding(s)?\b/i);
    expect(html).not.toMatch(/\bthreshold(s)?\b/i);
    expect(html).not.toMatch(/\bcategor(y|ies)\b/i);
    expect(html).not.toMatch(/\bissue(s)?\b|\balert(s)?\b|\bwarning(s)?\b/i);
  });
});

/* ------------------------------------------------------------------ *
 * Copying it
 * ------------------------------------------------------------------ */

describe("the quoted sentence can be copied", () => {
  it("puts a real control beside the sentence", () => {
    /* That it copies the sentence byte for byte is held by
       tests/copy-the-source-sentence.test.tsx, which drives the control. */
    expect(screen(flagged)).toContain("Copy the sentence");
  });
});

/* ------------------------------------------------------------------ *
 * The surrounding passage
 * ------------------------------------------------------------------ */

describe("the sentence is shown in its surroundings", () => {
  const html = screen(flagged);

  it("names the section and marks the sentence inside the passage", () => {
    expect(html).toContain("Where it sits in your document");
    expect(html).toContain("<mark>");
    expect(html).toContain("The source sentence begins.");
    expect(html).toContain("The source sentence ends.");
  });

  it("carries the text either side of it, out of the reader's own document", () => {
    /* The clause before the guarantee and the heading after it. Both are in the
       fixture, neither is in the flag, and both are what "was it read fairly" is
       judged against. */
    expect(html).toContain("13.1 Contractor may perform the Services through");
    expect(html).toContain("14. GENERAL");
  });

  it("says when the window was cut rather than implying the document stops", () => {
    expect(html).toContain("…");
  });

  it("says where in the document it is, in figures", () => {
    expect(html).toContain("One place in your document");
  });

  it("shows every place a repeated sentence occurs, and says there was more than one", () => {
    /* A sentence the document states twice. The screen is handed a text that
       repeats the quoted sentence, which is the case a plain indexOf would answer
       with a guess. */
    const repeated = `${documentText}\n\nSCHEDULE 2 — GUARANTEE RESTATED\n\n${guarantee.sourceSentence}\n`;
    const html = screen(flagged, repeated);

    expect(html).toMatch(/occurs <span class="tnum">2<\/span>\s*times/);
    expect(html).toContain("Every place it occurs is shown");
    expect(html).toContain("does not say which of them the flag was written from");
    expect(html).toContain("2 places in your document");
    expect(html).toContain("SCHEDULE 2 — GUARANTEE RESTATED");
    /* Two marked runs, one per occurrence. */
    expect(html.match(/<mark>/g)).toHaveLength(2);
  });

  it("says so plainly when the sentence is not in the text this browser holds", () => {
    const html = screen(flagged, "A different extraction of a different file.");

    expect(html).toContain("does not occur in the text this browser is holding");
    expect(html).toContain("Not in this text");
    expect(html).not.toContain("<mark>");
  });
});

/* ------------------------------------------------------------------ *
 * What was looked for
 * ------------------------------------------------------------------ */

describe("what this build looked for", () => {
  const html = screen(flagged);

  it("publishes all eight clause types, and marks the one that was looked for", () => {
    expect(html).toContain("What was looked for");
    for (const entry of CLAUSE_TAXONOMY) {
      expect(html).toContain(entry.title);
    }
    expect(html).toContain("Flagged · highest");
  });

  it("marks the seven it does not look for as not looked for, never as absent", () => {
    const notLookedFor = html.match(/Not looked for in this build/g);

    expect(notLookedFor).toHaveLength(
      CLAUSE_TAXONOMY.length - CLAUSE_TYPES_IN_SCOPE.length,
    );
    /* The green "inspected · not found" belongs only to a clause type that was
       actually looked for. With one in scope and that one flagged, it is absent
       from this screen entirely. */
    expect(html).not.toContain("Inspected · not found");
  });

  it("states the count it searched against the count published", () => {
    expect(html).toMatch(
      /<span class="tnum">1<\/span>\s*of the <span class="tnum">8<\/span> published/,
    );
    expect(html).toContain("personal guarantees");
  });

  it("carries the key to the marks, so a hatch can always be decoded", () => {
    expect(html).toContain("Key to the marks");
    expect(html).toContain("Highest severity");
    expect(html).toContain("High severity");
    expect(html).toContain("Medium severity");
    expect(html).toContain("Denser hatch, worse worst case");
  });

  it("states the limits of the inspection, including that it is one clause type", () => {
    expect(html).toContain("Limitations of this inspection");
    expect(html).toContain("No verdict.");
    expect(html).toContain("No sentence, no flag.");
    expect(html).toContain("Silence about the rest is silence, not absence.");
  });

  it("says a risk from what the document does not say cannot be flagged at all", () => {
    expect(html).toContain("does not say");
    expect(html).toContain("has no sentence to quote");
  });
});

/* ------------------------------------------------------------------ *
 * Before, and during
 * ------------------------------------------------------------------ */

describe("before the reader asks", () => {
  const html = view({ step: "not-asked" });

  it("offers the inspection and says what will be looked for", () => {
    expect(html).toContain("Have this text inspected");
    expect(html).toContain("Inspect this document");
    expect(html).toContain("personal guarantees");
  });

  it("says what leaves the browser before anything leaves it", () => {
    expect(html).toContain("is what is sent to be inspected, and it is all");
    expect(html).toContain("The file itself stays in this browser");
    expect(html).toContain("you do not need an account");
  });
});

describe("while it is being inspected", () => {
  const html = view({ step: "inspecting" });

  it("names each step of the wait rather than spinning", () => {
    expect(html).toContain('class="analysing"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('class="step is-done"');
    expect(html).toContain('class="step is-active"');
    expect(html).toContain("Text extracted in your browser");
    expect(html).toContain("Checking every quoted sentence against your own text");
  });

  it("does not claim the other seven clause types are being looked for", () => {
    expect(html).toMatch(
      /<span class="tnum">1<\/span>\s*of <span class="tnum">8<\/span> clause types/,
    );
  });

  it("is not an all-clear and carries no flag", () => {
    expect(html).not.toContain("All clear");
    expect(html).not.toContain('class="flags"');
  });
});

/* ------------------------------------------------------------------ *
 * Every way it can fail to run
 * ------------------------------------------------------------------ */

/** The seven states the boundary can hand this screen, each reached the way the
 *  application reaches it. */
const failures: Readonly<Record<string, () => Promise<FlagAnalysis>>> = {
  /* The production client, on an environment with nothing in it: exactly what a
     reader meets on a deployment with no key. */
  "not-configured": () =>
    createAnalysisBoundary({ model: modelClientFromEnvironment({}) }).flags(
      documentText,
    ),
  "refused-by-the-endpoint": () =>
    createAnalysisBoundary({
      model: modelClientFailing(
        "refused-by-the-endpoint",
        "The model endpoint refused the request with status 402: insufficient credit. Nothing was analysed.",
      ),
    }).flags(documentText),
  "network-failure": () =>
    createAnalysisBoundary({
      model: modelClientFailing(
        "network-failure",
        "The model could not be reached: fetch failed. Nothing was analysed.",
      ),
    }).flags(documentText),
  "answer-was-empty": () =>
    createAnalysisBoundary({
      model: modelClientFailing(
        "answer-was-empty",
        "The model answered with no content. Nothing was analysed.",
      ),
    }).flags(documentText),
  "answer-was-not-json": () =>
    createAnalysisBoundary({
      model: modelClientFailing(
        "answer-was-not-json",
        "The model endpoint answered with something that was not JSON. Nothing was analysed.",
      ),
    }).flags(documentText),
  /* JSON that parsed and was not the structure asked for: read by the boundary
     itself rather than reported by the client. */
  "answer-was-not-the-shape-asked-for": () =>
    createAnalysisBoundary({
      model: modelClientAnswering({ clauses: "none that I could see" }),
    }).flags(documentText),
  "nothing-to-analyse": () => onTheSidecars().flags("   "),
};

describe("every way the inspection can fail to run", () => {
  it("covers each one the boundary can return, so none of them is unbuilt", async () => {
    const modelKinds: readonly ModelFailureKind[] = [
      "not-configured",
      "refused-by-the-endpoint",
      "network-failure",
      "answer-was-empty",
      "answer-was-not-json",
    ];

    for (const kind of [
      ...modelKinds,
      "answer-was-not-the-shape-asked-for",
      "nothing-to-analyse",
    ]) {
      expect(Object.keys(failures)).toContain(kind);
    }
  });

  for (const [kind, reach] of Object.entries(failures)) {
    describe(kind, () => {
      it("says what happened, in a heading of its own", async () => {
        const result = await reach();
        if (result.outcome !== "unavailable") {
          throw new Error(`${kind} did not produce a failure`);
        }
        const html = screen(result);

        /* A designed state, not one apology with a code in it: each has its own
           heading, and no two of these headings are the same. */
        expect(html).toContain('class="sect-head"');
        expect(html).toContain('class="summary__text"');
        /* Redline's own words explain rather than report a code. What the
           endpoint said about itself is quoted in its own words in the note this
           strips out — "fetch failed" is the network's sentence, not ours. */
        const authored = withoutWhatWasReported(html);
        expect(authored).not.toMatch(/\berror\b/i);
        expect(authored).not.toMatch(/\bfailed\b/i);
        expect(authored).not.toMatch(/try again/i);
      });

      it("is never drawn as an all-clear", async () => {
        const result = await reach();
        const html = screen(result);

        expect(html).toContain("This is not an all-clear");
        expect(html).toContain("because it could not look");
        /* None of the marks of a result: no stamp, no schedule, no scope list
           saying a clause type was inspected and not found. */
        expect(html).not.toContain('class="stamp"');
        expect(html).not.toContain('class="flags"');
        expect(html).not.toContain("Inspected · not found");
        expect(html).not.toContain("Flagged ·");
      });

      it("offers no verdict and uses none of the words the product avoids", async () => {
        const html = screen(await reach());

        expect(html).not.toMatch(/you should|don.t sign|do not sign/i);
        expect(html).not.toMatch(/\bfinding(s)?\b/i);
        expect(html).not.toMatch(/\bthreshold(s)?\b/i);
      });
    });
  }

  it("names what is missing when nothing is configured, and does not offer a retry", async () => {
    const result = await failures["not-configured"]();
    const html = screen(result);

    expect(html).toContain("No model access is configured here");
    expect(html).toContain("What was reported");
    /* The boundary's own sentence, which names the two variables. */
    expect(html).toMatch(/is not set in this environment|Neither .* nor .* is set/);
    expect(html).not.toContain("Ask for the inspection again");
    expect(html).toContain("with nowhere to send it, nothing was sent");
  });

  it("offers to ask again where asking again could answer differently", async () => {
    for (const kind of [
      "refused-by-the-endpoint",
      "network-failure",
      "answer-was-empty",
      "answer-was-not-json",
      "answer-was-not-the-shape-asked-for",
    ]) {
      const html = renderToStaticMarkup(
        <InspectionView
          stage={stageOf(await failures[kind]())}
          documentText={documentText}
          onInspect={() => {}}
        />,
      );

      expect(html, kind).toContain("Ask for the inspection again");
    }
  });

  it("gives each failure its own heading, so two are never told as one", async () => {
    const headings = new Set<string>();
    for (const reach of Object.values(failures)) {
      const html = screen(await reach());
      const heading = /<h2 class="sect-head" id="unavailable-head">([^<]+)</.exec(
        html,
      );
      expect(heading).not.toBeNull();
      headings.add(heading![1]);
    }

    expect(headings.size).toBe(Object.keys(failures).length);
  });
});

/* ------------------------------------------------------------------ *
 * Dropped flags
 * ------------------------------------------------------------------ */

describe("flags dropped at the citation gate", () => {
  it("says so plainly, with the counts, rather than showing fewer flags", () => {
    const html = screen(withADrop);

    expect(html).toContain("Extraction note");
    expect(html).toContain("One flag was dropped before reaching this page");
    expect(html).toContain("does not occur in the text recovered from your document");
    expect(html).toContain("not that the document is clean");
    /* Two produced, one cited. */
    expect(html).toMatch(/<span class="tnum">2<\/span> in all/);
    expect(html).toMatch(/<span class="tnum">1<\/span> of which could/);
  });

  it("names the clause type whose flag was dropped, so the silence is locatable", () => {
    expect(screen(withADrop)).toContain(
      clauseTypeEntry("personal-guarantee").title,
    );
  });

  it("never quotes the sentence that could not be found in the document", () => {
    expect(screen(withADrop)).not.toContain(fabricated);
  });

  it("shows no extraction note when nothing was dropped", () => {
    expect(screen(flagged)).not.toContain("Extraction note");
  });
});

describe("nothing cited, and something dropped", () => {
  /* The most dangerous shape in the product: no flags left, because the only one
     there was could not be quoted. An empty schedule here would read as a clean
     document. */
  const html = screen(onlyADrop, cleanText);

  it("is not an all-clear", () => {
    expect(html).not.toContain('class="stamp"');
    expect(html).not.toContain("Nothing of what was looked for is in this document");
    expect(html).toContain("That is not an all-clear");
  });

  it("says why there is nothing to show, and names the drop", () => {
    expect(html).toContain("No flag survived the check");
    expect(html).toContain("Extraction note");
  });
});

/* ------------------------------------------------------------------ *
 * A genuine all-clear
 * ------------------------------------------------------------------ */

describe("an all-clear", () => {
  const html = screen(clean, cleanText);

  it("is stamped, and is shown with the list of what was looked for", () => {
    expect(html).toContain('class="stamp"');
    expect(html).toContain("All clear");
    expect(html).toContain("Nothing of what was looked for is in this document");
    expect(html).toContain("What was looked for");
    expect(html).toContain("Inspected · not found");
  });

  it("does not claim the seven clause types it never looked for are absent", () => {
    expect(html).toContain("Not looked for in this build");
    expect(html).toContain("are not looked for");
  });

  it("carries no flag row and no schedule", () => {
    expect(html).not.toContain('class="flags"');
    expect(html).not.toContain('class="source"');
  });

  it("says an all-clear is the most dangerous thing it prints", () => {
    expect(html).toContain("most dangerous thing Redline can print");
  });
});
