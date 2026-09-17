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

- [ ] A document containing a personal guarantee produces a flag for it
- [ ] Every flag displays the exact sentence it came from, quoted verbatim
- [ ] The quoted sentence can be copied as text
- [ ] The quoted sentence is shown with enough surrounding context to judge whether it was read fairly
- [ ] A flag whose source sentence cannot be produced is dropped inside the analysis boundary and never reaches the interface
- [ ] The count of dropped flags is recorded, so extraction defects stay distinguishable from analysis defects
- [ ] The flag says what the clause does to the reader in concrete terms, not its category
- [ ] The harness from 03 passes its citation check against this analysis
- [ ] Model access goes through OpenRouter, pinned to the agreed model, from one place in the code
