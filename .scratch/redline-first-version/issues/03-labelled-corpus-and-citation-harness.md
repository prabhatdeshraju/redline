# 03: Labelled corpus and citation-gate harness

**What to build:** A corpus of real negotiable documents whose clauses are
known and labelled, plus a harness that runs an analysis across them and
reports results per clause type. Running the harness produces a report a person
can read.

Nothing in the spec's "what good looks like" can be measured without this. It
is the first piece of work rather than a step inside a feature: recall,
precision and the false all-clear rate are all claims about a labelled set, and
until one exists they are opinions.

The harness carries the citation check too — every quoted sentence occurs
verbatim in the text it came from — so the gate exists before there is a flag
to run it against.

**Blocked by:** 02.

**Status:** done (criteria 1 and 7 partial — see comments)

- [~] A corpus of real negotiable documents exists, each labelled with the clause types it contains and where they appear — labelling complete and validated; the documents are **authored for this repository**, not real. See BUILD-REPORT.md decision 12
- [x] The corpus includes documents deliberately free of flaggable clauses, for the all-clear case
- [x] The corpus includes documents that stress extraction: multi-column, hyphenated, ligature-heavy, footnoted, tabular
- [x] The harness runs an analysis across the corpus and reports per clause type, not only in aggregate
- [x] The harness asserts every quoted sentence occurs verbatim in its source text, and fails the run on a single violation
- [x] Extraction defects and analysis defects are distinguishable in the report — separate sections and columns; a gate drop is never also billed as a missed clause
- [ ] Documents in the corpus are public or properly licensed for this use — **not met as written**: authored for this repo

## Comments

**2026-09-26 — implemented.** The citation gate is
`applyCitationGate(analysis, documentText): CitedAnalysis` — it takes a whole
analysis and the whole text, so ticket 04's last statement can be
`return applyCitationGate(analysis, documentText)`. A renderer-shaped gate (a
predicate over one flag, or a filter applied while drawing) would leave
unciteable flags inside the value the boundary returns, where a seam test cannot
see them, and every later consumer — the library, a saved analysis reopened next
week — would have to re-run it.

`isAllClear` requires zero flags **and** zero drops, so an analysis emptied by
the gate can never be reported as an all-clear. That is the false-all-clear
failure arriving by a side door, and it is closed structurally.

The harness takes its analyser by injection, reports per clause type, and
enforces three binary gates: citation integrity, false all-clear, extraction
fidelity. Recall and precision are printed and gated on nothing, because
PRD.md §4.2 and §4.3 leave those thresholds unset and they are the owner's to
set.

`tests/no-route-accepts-a-file.test.ts` was narrowed to exclude `lib/harness`
alongside `lib/extraction`, because the harness runs each corpus document
through the real extraction boundary and so constructs a `File`. Four new
assertions earn that exclusion: the excluded trees are imported by nothing that
ships, touch no network, must exist and contain modules, and the scan must still
find server modules to check. A safety test that quietly stops covering things
would be worse than none.

**Two extraction defects the stress fixtures found, recorded and not worked
around** (this ticket may read `lib/extraction/` and not change it):

- A superscript footnote marker raised by about a third of the body size is
  reported as its own row between the halves of a sentence, so that sentence
  extracts with the marker's digit inside it. A marker raised less lands in-line
  and its sentence survives. Both cases are in `footnoted.pdf`.
- `tabular.pdf` reports two columns while correctly reading its rows across,
  because pdf.js fills inter-cell gaps with space runs that straddle the gutter.
  The text is right and the diagnostic is wrong; on a page that is genuinely two
  columns *and* holds a table, those would not cancel.
