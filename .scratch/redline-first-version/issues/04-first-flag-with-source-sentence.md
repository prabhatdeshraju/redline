# 04: First flag with its verbatim source sentence

**What to build:** The tracer bullet. A reader uploads a contract containing a
personal guarantee and Redline shows one flag: what the clause does to them,
and the exact sentence from their own document it came from, quoted verbatim.
They can copy that sentence and find it in their own copy of the contract.

One clause type only. The remaining seven come in 05.

The load-bearing decision: the verbatim check runs **inside the analysis
boundary, as its last step before returning**. A flag whose quoted sentence
does not occur in the supplied text is dropped there and never crosses the
boundary. Placed at the render layer instead, a test at the seam could not
catch an ADR 0001 violation, and the gate would be worthless.

Make it structural rather than conventional — a flag that can exist without its
source sentence is one that will eventually ship without one:

    Flag {
      clauseType      ClauseType
      severity        Severity
      sourceSentence  string   // required; never optional, never nullable
    }

**Blocked by:** 02, 03.

**Status:** ready-for-agent

- [x] A document containing a personal guarantee produces a flag for it
- [x] Every flag displays the exact sentence it came from, quoted verbatim — *the flag carries it; displaying it is the screen's half*
- [ ] The quoted sentence can be copied as text
- [ ] The quoted sentence is shown with enough surrounding context to judge whether it was read fairly
- [x] A flag whose source sentence cannot be produced is dropped inside the analysis boundary and never reaches the interface
- [x] The count of dropped flags is recorded, so extraction defects stay distinguishable from analysis defects
- [x] The flag says what the clause does to the reader in concrete terms, not its category
- [x] The harness from 03 passes its citation check against this analysis
- [x] Model access goes through OpenRouter, pinned to the agreed model, from one place in the code

## Comments

**The analysis boundary is built; the screen is not.** What the screen calls:

    import { createAnalysisBoundary } from "@/lib/analysis/boundary";
    import { modelClientFromEnvironment } from "@/lib/model/openrouter";

    const boundary = createAnalysisBoundary({
      model: modelClientFromEnvironment(process.env),
    });
    const result = await boundary.flags(documentText, thresholds);

`result` is a union. `{ outcome: "analysed", analysis }` carries `analysis.flags`
— every one of which can produce its source sentence out of `documentText`,
because the gate already dropped the ones that could not — and
`analysis.citations`, which says how many were checked, cited and dropped.
`{ outcome: "unavailable", failure }` carries one sentence saying what happened.
A failure is never an empty `flags`, so it must never be rendered as an
all-clear; `isAllClear(analysis)` in `citation-gate.ts` is the only thing that
answers that question, and it answers `false` when anything was dropped.

The boundary must be reached from a server module: it holds the key. The
document text comes from the extraction boundary in the browser, so the screen
sends text, never a file (`tests/no-route-accepts-a-file.test.ts`).

Surrounding context for a quoted sentence is not on the flag. The screen has
`documentText` and the sentence, and `indexOf` locates it: that keeps the
boundary from deciding how much context is enough, which is a display question.

One clause type is searched for (`lib/analysis/clause-search.ts`:
`CLAUSE_TYPES_IN_SCOPE`). Publish what was searched from that list, not from the
taxonomy's eight, or the interface will claim coverage nothing has measured.
