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

**Status:** ready-for-agent

- [ ] A corpus of real negotiable documents exists, each labelled with the clause types it contains and where they appear
- [ ] The corpus includes documents deliberately free of flaggable clauses, for the all-clear case
- [ ] The corpus includes documents that stress extraction: multi-column, hyphenated, ligature-heavy, footnoted, tabular
- [ ] The harness runs an analysis across the corpus and reports per clause type, not only in aggregate
- [ ] The harness asserts every quoted sentence occurs verbatim in its source text, and fails the run on a single violation
- [ ] Extraction defects and analysis defects are distinguishable in the report
- [ ] Documents in the corpus are public or properly licensed for this use
