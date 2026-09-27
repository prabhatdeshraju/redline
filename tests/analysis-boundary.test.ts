/* @vitest-environment node
 *
 * The analysis boundary, on a model client that answers out of the labelled
 * sidecars.
 *
 * The client is the only thing standing in for anything. The boundary itself does
 * all of its own work in every test below: it assembles the request from the
 * taxonomy, reads the answer, keeps the clause types this build searches for and
 * drops the rest, takes the severity band from the taxonomy rather than from the
 * answer, runs the citation gate as its last step, and counts what the gate
 * dropped. The payloads are not invented either — `tests/fixtures/*.json` and
 * `tests/corpus/documents/*.json` already carry the exact sentences and bands.
 *
 * What each group is here to hold:
 *
 *   a flag, and its sentence   ticket 04 criteria 1 and 5, ADR 0001
 *   the gate, from inside      the drop happens in the boundary, not at the screen
 *   the drop count             extraction defects stay distinguishable (§4.8)
 *   severity from the taxonomy ADR 0003 — never a per-document judgement
 *   what it does to the reader criterion 7, ADR 0004's voice
 *   when it cannot run         a stated outcome, never an empty analysis (§4.4)
 *   through the harness        criterion 8 — the citation check against this path
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  asAnalyser,
  createAnalysisBoundary,
  whatItPermits,
  type FlagAnalysis,
} from "@/lib/analysis/boundary";
import { isAllClear } from "@/lib/analysis/citation-gate";
import {
  CLAUSE_TYPES_IN_SCOPE,
  flagResponseSchema,
  flagRequest,
} from "@/lib/analysis/clause-search";
import { clauseTypeEntry, severityOf } from "@/lib/analysis/taxonomy";
import { loadCorpus, repositoryRoot } from "@/lib/harness/corpus";
import { runHarness } from "@/lib/harness/run";
import {
  createOpenRouterClient,
  modelClientFromEnvironment,
  type Send,
} from "@/lib/model/openrouter";
import type { ModelRequest } from "@/lib/model/model-client";

import {
  modelClientAnswering,
  modelClientFailing,
  modelClientFromSidecars,
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
    readonly severity: string;
    readonly sourceSentence: string;
    readonly whatItPermits: string;
  }[];
};

const sidecar = JSON.parse(fixture("negotiable-flagged.json")) as Sidecar;
const guarantee = sidecar.plantedClauses.find(
  (clause) => clause.clauseType === "personal-guarantee",
);

if (guarantee === undefined) {
  throw new Error(
    "negotiable-flagged.json no longer labels a personal guarantee, so this suite is measuring nothing",
  );
}

const boundaryOnTheSidecars = (
  options: Parameters<typeof modelClientFromSidecars>[0] = {},
) =>
  createAnalysisBoundary({
    model: modelClientFromSidecars({ corpus, ...options }),
  });

const analysed = (result: FlagAnalysis) => {
  if (result.outcome !== "analysed") {
    throw new Error(
      `expected an analysis, got: ${result.failure.kind} — ${result.failure.statement}`,
    );
  }
  return result.analysis;
};

describe("a document containing a personal guarantee produces a flag for it", () => {
  it("flags it, once, with the band the taxonomy fixes for it", async () => {
    const analysis = analysed(await boundaryOnTheSidecars().flags(documentText));

    expect(analysis.flags).toHaveLength(1);
    const [flag] = analysis.flags;
    expect(flag.clauseType).toBe("personal-guarantee");
    expect(flag.severity).toBe("highest");
    expect(flag.severity).toBe(severityOf("personal-guarantee"));
  });

  it("quotes the sentence it came from, verbatim, out of the reader's own text", async () => {
    const analysis = analysed(await boundaryOnTheSidecars().flags(documentText));
    const [flag] = analysis.flags;

    expect(flag.sourceSentence).toBe(guarantee.sourceSentence);
    /* The whole claim, in one line: the reader can search their own copy for this
       and find it. The sentence carries a typographic apostrophe, which is the
       character class that silently breaks a match that has been loosened. */
    expect(documentText.includes(flag.sourceSentence)).toBe(true);
    expect(flag.sourceSentence).toMatch(/’/);
  });

  it("says what the clause does to the reader rather than naming its category", async () => {
    const analysis = analysed(await boundaryOnTheSidecars().flags(documentText));
    const [flag] = analysis.flags;

    expect(flag.whatItPermits).toBe(guarantee.whatItPermits);
    expect(flag.whatItPermits).not.toBe(
      clauseTypeEntry("personal-guarantee").title,
    );
    expect(flag.whatItPermits).toMatch(/personally responsible/i);
    expect(flag.whatItPermits).toMatch(/own assets/i);
    /* Flat about the document, hedged about the law (ADR 0004). */
    expect(flag.whatItPermits).toMatch(/depends on the jurisdiction/i);
  });

  it("reports nothing it was not asked to look for", async () => {
    /* The client answers with all six clause types the sidecar labels, because a
       client that filtered would hide whether the boundary does. This build
       searches for one of the eight; claiming the other five would be claiming
       coverage nothing has measured (ADR 0003). */
    const boundary = boundaryOnTheSidecars();
    const analysis = analysed(await boundary.flags(documentText));

    expect(boundary.clauseTypesSearched).toEqual(CLAUSE_TYPES_IN_SCOPE);
    expect(analysis.flags.map((flag) => flag.clauseType)).toEqual([
      "personal-guarantee",
    ]);
  });

  it("produces the same analysis twice", async () => {
    const boundary = boundaryOnTheSidecars();

    expect(analysed(await boundary.flags(documentText))).toEqual(
      analysed(await boundary.flags(documentText)),
    );
  });
});

describe("the citation gate runs inside the boundary", () => {
  const fabricated =
    "Contractor personally guarantees every obligation of every party to this Agreement without limitation of any kind.";

  it("drops a flag whose sentence is not in the supplied text", async () => {
    expect(documentText.includes(fabricated)).toBe(false);

    const analysis = analysed(
      await boundaryOnTheSidecars({
        alsoProposing: [
          {
            clauseType: "personal-guarantee",
            sourceSentence: fabricated,
            whatItPermits: guarantee.whatItPermits,
          },
        ],
      }).flags(documentText),
    );

    /* The fabricated flag never crosses the seam. It is not filtered at a screen
       and it is not returned for a caller to check: it is gone from the value the
       boundary returned. */
    expect(analysis.flags).toHaveLength(1);
    expect(analysis.flags[0].sourceSentence).toBe(guarantee.sourceSentence);
    for (const flag of analysis.flags) {
      expect(documentText.includes(flag.sourceSentence)).toBe(true);
    }
  });

  it("records the drop, so an extraction defect stays distinguishable", async () => {
    const analysis = analysed(
      await boundaryOnTheSidecars({
        alsoProposing: [
          {
            clauseType: "personal-guarantee",
            sourceSentence: fabricated,
            whatItPermits: guarantee.whatItPermits,
          },
        ],
      }).flags(documentText),
    );

    expect(analysis.citations.checked).toBe(2);
    expect(analysis.citations.cited).toBe(1);
    expect(analysis.citations.dropped).toHaveLength(1);
    expect(analysis.citations.dropped[0].reason).toBe("not-in-the-document");
    expect(analysis.citations.dropped[0].flag.sourceSentence).toBe(fabricated);
  });

  it("drops a flag that quoted nothing, and counts that separately", async () => {
    const analysis = analysed(
      await boundaryOnTheSidecars({
        alsoProposing: [
          { clauseType: "personal-guarantee", sourceSentence: "" },
        ],
      }).flags(documentText),
    );

    expect(analysis.flags).toHaveLength(1);
    expect(analysis.citations.dropped).toHaveLength(1);
    expect(analysis.citations.dropped[0].reason).toBe("empty-source-sentence");
  });

  it("drops a flag whose sentence arrived as something other than a string", async () => {
    /* The schema says string. At run time that is a claim about a value that came
       over a network, and the gate is what makes it true of everything that leaves
       the boundary. */
    const analysis = analysed(
      await createAnalysisBoundary({
        model: modelClientAnswering({
          flags: [
            {
              clauseType: "personal-guarantee",
              sourceSentence: null,
              whatItPermits: guarantee.whatItPermits,
            },
          ],
        }),
      }).flags(documentText),
    );

    expect(analysis.flags).toHaveLength(0);
    expect(analysis.citations.dropped).toHaveLength(1);
    expect(analysis.citations.dropped[0].reason).toBe("empty-source-sentence");
    /* And an analysis whose every flag was dropped is not an all-clear. */
    expect(isAllClear(analysis)).toBe(false);
  });

  it("reports an honest all-clear on a document that has none", async () => {
    const analysis = analysed(await boundaryOnTheSidecars().flags(cleanText));

    expect(analysis.flags).toHaveLength(0);
    expect(analysis.citations.dropped).toHaveLength(0);
    expect(isAllClear(analysis)).toBe(true);
  });
});

describe("severity comes from the taxonomy and nowhere else", () => {
  it("ignores a severity the model supplied", async () => {
    const analysis = analysed(
      await createAnalysisBoundary({
        model: modelClientAnswering({
          flags: [
            {
              clauseType: "personal-guarantee",
              severity: "medium",
              sourceSentence: guarantee.sourceSentence,
              whatItPermits: guarantee.whatItPermits,
            },
          ],
        }),
      }).flags(documentText),
    );

    expect(analysis.flags[0].severity).toBe("highest");
  });

  it("does not ask for one: the schema has no severity field", () => {
    const schema = flagResponseSchema();
    const item = (
      (schema.properties as Record<string, { items: { properties: object; required: string[] } }>)
        .flags
    ).items;

    expect(Object.keys(item.properties)).toEqual([
      "clauseType",
      "sourceSentence",
      "whatItPermits",
    ]);
    expect(item.required).not.toContain("severity");
  });

  it("asks only for the clause types this build searches for", () => {
    const schema = flagResponseSchema();
    const item = (
      (schema.properties as Record<
        string,
        { items: { properties: { clauseType: { enum: string[] } } } }
      >).flags
    ).items;

    expect(item.properties.clauseType.enum).toEqual([...CLAUSE_TYPES_IN_SCOPE]);
  });
});

describe("what the flag says the clause does to the reader", () => {
  const worstCase = clauseTypeEntry("personal-guarantee").worstCase;

  it("keeps a concrete statement in the right voice", () => {
    expect(whatItPermits(guarantee.whatItPermits, "personal-guarantee")).toBe(
      guarantee.whatItPermits,
    );
  });

  it("falls back to the taxonomy rather than naming the category", () => {
    expect(whatItPermits("Personal guarantee.", "personal-guarantee")).toBe(
      worstCase,
    );
    expect(whatItPermits("", "personal-guarantee")).toBe(worstCase);
    expect(whatItPermits(undefined, "personal-guarantee")).toBe(worstCase);
  });

  it("refuses a verdict and an asserted legal outcome (ADR 0004)", () => {
    expect(
      whatItPermits(
        "You should not sign this, because the guarantee reaches your house and your savings.",
        "personal-guarantee",
      ),
    ).toBe(worstCase);
    expect(
      whatItPermits(
        "This guarantee is unenforceable and the client will not be able to collect anything at all.",
        "personal-guarantee",
      ),
    ).toBe(worstCase);
  });

  it("keeps the flag when the statement was unusable, rather than dropping it", async () => {
    /* The sentence is real and citable, so the risk is real. Dropping the flag
       over the wording of its explanation would hide a highest-band clause, which
       is the error ADR 0004 says not to prefer. */
    const analysis = analysed(
      await createAnalysisBoundary({
        model: modelClientAnswering({
          flags: [
            {
              clauseType: "personal-guarantee",
              sourceSentence: guarantee.sourceSentence,
              whatItPermits: "You should not sign it.",
            },
          ],
        }),
      }).flags(documentText),
    );

    expect(analysis.flags).toHaveLength(1);
    expect(analysis.flags[0].whatItPermits).toBe(worstCase);
  });
});

describe("the request the boundary makes", () => {
  it("carries the document and the instructions separately", async () => {
    const requests: ModelRequest[] = [];
    await boundaryOnTheSidecars({ requests }).flags(documentText);

    expect(requests).toHaveLength(1);
    const [request] = requests;
    expect(request.purpose).toBe("flags");
    expect(request.input).toContain(guarantee.sourceSentence);
    expect(request.instructions).not.toContain(guarantee.sourceSentence);
  });

  it("names the clause types out of the taxonomy rather than in prose", () => {
    const request = flagRequest(documentText, []);

    for (const clauseType of CLAUSE_TYPES_IN_SCOPE) {
      const entry = clauseTypeEntry(clauseType);
      expect(request.instructions).toContain(entry.clauseType);
      expect(request.instructions).toContain(entry.worstCase);
    }
  });

  it("carries the reader's own thresholds when they set any", () => {
    const withNone = flagRequest(documentText, []);
    const withOne = flagRequest(documentText, [
      "I will not sign anything that makes me personally liable.",
    ]);

    expect(withNone.instructions).not.toMatch(/personally liable/);
    expect(withOne.instructions).toContain(
      "I will not sign anything that makes me personally liable.",
    );
  });
});

describe("when the analysis cannot run, it says so", () => {
  const sendReturning = (status: number, body: string): Send =>
    async () => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
    });

  const KEY = "sk-not-a-real-key-0123456789";
  const clientWith = (send: Send) =>
    createOpenRouterClient({ apiKey: KEY, modelId: "a-model-id", send });

  const cases: readonly (readonly [
    string,
    () => ReturnType<typeof createAnalysisBoundary>,
    string,
  ])[] = [
    [
      "there is no key",
      () =>
        createAnalysisBoundary({
          model: modelClientFromEnvironment({ OPENROUTER_MODEL: "a-model-id" }),
        }),
      "OPENROUTER_API_KEY",
    ],
    [
      "there is no model identifier",
      () =>
        createAnalysisBoundary({
          model: modelClientFromEnvironment({ OPENROUTER_API_KEY: KEY }),
        }),
      "OPENROUTER_MODEL",
    ],
    [
      "the endpoint refuses",
      () =>
        createAnalysisBoundary({
          model: clientWith(sendReturning(429, '{"error":"rate limited"}')),
        }),
      "429",
    ],
    [
      "the network does not answer",
      () =>
        createAnalysisBoundary({
          model: clientWith(async () => {
            throw new Error("socket hang up");
          }),
        }),
      "socket hang up",
    ],
    [
      "the endpoint answers something that is not JSON",
      () =>
        createAnalysisBoundary({
          model: clientWith(sendReturning(200, "<html>bad gateway</html>")),
        }),
      "not JSON",
    ],
    [
      "the model answers prose instead of the structure asked for",
      () =>
        createAnalysisBoundary({
          model: clientWith(
            sendReturning(
              200,
              JSON.stringify({
                choices: [{ message: { content: "I am unable to help." } }],
              }),
            ),
          ),
        }),
      "rather than the JSON structure",
    ],
    [
      "the model answers with nothing at all",
      () =>
        createAnalysisBoundary({
          model: clientWith(sendReturning(200, JSON.stringify({ choices: [] }))),
        }),
      "no content",
    ],
    [
      "the answer is JSON of the wrong shape",
      () =>
        createAnalysisBoundary({
          model: modelClientAnswering({ findings: [] }),
        }),
      "no list of flags",
    ],
    [
      "there is no document text",
      () => boundaryOnTheSidecars(),
      "no document text to analyse",
    ],
  ];

  for (const [when, build, expected] of cases) {
    it(`states the outcome when ${when}, and never returns an analysis`, async () => {
      const text = when === "there is no document text" ? "   " : documentText;
      const result = await build().flags(text);

      expect(result.outcome).toBe("unavailable");
      if (result.outcome !== "unavailable") return;
      expect(result.failure.statement).toContain(expected);
      /* Not a crash, and not an empty analysis: there is no `flags` here at all,
         so nothing downstream can render this as an all-clear (§4.4). */
      expect(result).not.toHaveProperty("analysis");
      expect(result.failure.statement.length).toBeGreaterThan(20);
    });
  }

  it("never puts the key in a statement", async () => {
    for (const [, build] of cases) {
      const result = await build().flags(documentText);
      if (result.outcome !== "unavailable") continue;
      expect(result.failure.statement).not.toContain(KEY);
    }
  });

  it("carries the model client's own account of a failure", async () => {
    const result = await createAnalysisBoundary({
      model: modelClientFailing("network-failure", "The model could not be reached."),
    }).flags(documentText);

    expect(result.outcome).toBe("unavailable");
    if (result.outcome !== "unavailable") return;
    expect(result.failure.kind).toBe("model-unavailable");
    expect(result.failure.modelFailure?.kind).toBe("network-failure");
  });
});

describe("the boundary through the citation harness", () => {
  /* Criterion 8. The harness runs the real analysis path over the real corpus:
     every document through the extraction boundary as a file, then this boundary,
     then the same citation gate in the same position. It is handed the flags as
     proposed rather than the gated analysis, so the number of drops it reports is
     a measurement rather than zero by construction. */
  it("passes the citation check on every document in the corpus", async () => {
    const run = await runHarness({
      analyser: asAnalyser(boundaryOnTheSidecars()),
      analyserDescription: "the analysis boundary, on a client answering from the sidecars",
      corpus,
      root,
    });

    const citation = run.gates.find((gate) => gate.name === "Citation integrity");
    expect(citation?.passed).toBe(true);
    expect(run.citations.dropped).toBe(0);
    expect(run.citations.cited).toBeGreaterThan(0);
    expect(run.citations.cited).toBe(run.citations.checked);

    const extraction = run.gates.find(
      (gate) => gate.name === "Extraction fidelity",
    );
    expect(extraction?.passed).toBe(true);
  });

  it("recalls every personal guarantee the corpus labels", async () => {
    const run = await runHarness({
      analyser: asAnalyser(boundaryOnTheSidecars()),
      analyserDescription: "the analysis boundary, on a client answering from the sidecars",
      corpus,
      root,
    });

    const guarantees = run.tallies.find(
      (tally) => tally.clauseType === "personal-guarantee",
    );
    expect(guarantees?.labelled).toBeGreaterThan(0);
    expect(guarantees?.recall).toBe(1);
    expect(guarantees?.precision).toBe(1);
  });

  it("reports the documents this build's one clause type cannot cover", async () => {
    /* Not a defect in the boundary: a document whose only labelled clauses are of
       the other seven types comes back with nothing, and the harness is right to
       call that a false all-clear against its labels. It is the measured shape of
       a build that searches for one of eight, and ticket 05 is what closes it.
       Recorded here so the number cannot quietly change meaning. */
    const run = await runHarness({
      analyser: asAnalyser(boundaryOnTheSidecars()),
      analyserDescription: "the analysis boundary, on a client answering from the sidecars",
      corpus,
      root,
    });

    expect(run.falseAllClears).toEqual([
      "footnoted-schedule",
      "tabular-schedule",
      "agency-services-agreement",
    ]);
    for (const documentId of run.falseAllClears) {
      const document = corpus.documents.find((each) => each.id === documentId);
      expect(
        document?.labels.plantedClauses.map((clause) => clause.clauseType),
      ).not.toContain("personal-guarantee");
    }
  });

  it("stops rather than measuring nothing when the analysis cannot run", async () => {
    /* A run that swallowed a missing key would report an all-clear on every
       document and read as a pass. */
    await expect(
      runHarness({
        analyser: asAnalyser(
          createAnalysisBoundary({ model: modelClientFromEnvironment({}) }),
        ),
        analyserDescription: "an unconfigured environment",
        corpus,
        root,
      }),
    ).rejects.toThrow(/OPENROUTER_API_KEY/);
  });
});
