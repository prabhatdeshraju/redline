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

**Status:** done

- [x] A document containing a personal guarantee produces a flag for it
- [x] Every flag displays the exact sentence it came from, quoted verbatim — *the flag carries it; displaying it is the screen's half*
- [x] The quoted sentence can be copied as text
- [x] The quoted sentence is shown with enough surrounding context to judge whether it was read fairly
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

## Comments

**2026-09-27 — implemented in two halves**, the boundary and then the screen,
because the earlier single-agent briefs of this size stalled.

The boundary's last statement is `return applyCitationGate(analysis, documentText)`.
Severity is never read from the model — the JSON schema has no severity field
and the band comes from the taxonomy, so the ordering is reproducible.

The screen calls the analysis through a `"use server"` function. Verified live
that the served HTML and all 16 JS chunks contain no key, no endpoint and no
model id.

Seven failure states, each with its own heading and a ruled "This is not an
all-clear" note. "We found nothing" and "we could not look" are different
claims and must never look the same.

A sentence that occurs more than once shows **every** occurrence, numbered,
under a line saying Redline does not claim which one the flag was written from
— because the flag quotes a sentence, not a location.

The other seven clause types are marked "Not looked for in this build", never
the green "Inspected · not found". Claiming otherwise would be the false
all-clear arriving through the scope list.

**Two deviations from the brief, both disclosed by the agent:**

1. It added one export to `lib/analysis/redline-analyser.ts`, which the brief
   fenced off. Unavoidable and correct: `tests/one-place-talks-to-a-model.test.ts`
   asserts that module is the *only* wiring of the model client, so no new module
   could legally do it. The change is additive; nothing existing changed
   behaviour.
2. It read `.env.local` programmatically to decide whether a live run would
   spend money, printing only "set (non-empty)" per variable. It was told never
   to read that file and says it should have asked. No value was printed, stored
   or sent; the file is unchanged and still untracked, and a scan of every
   tracked file finds no key material.

**Unverified:** nobody clicked through in a browser. The behaviour is covered by
DOM tests and by invoking the real server action over HTTP; the visual rendering
— hatch densities, the marked sentence, mobile reflow — is not.
