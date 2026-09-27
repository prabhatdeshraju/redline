# The labelled corpus

Every recall, precision and all-clear number in `PRD.md` §4 is a claim about a
labelled set. This is the set. `npm run harness` runs an analysis across it and
prints what it found, per clause type.

## Read this first: the documents are authored, not real

Ticket 03 asks for "real negotiable documents … public or properly licensed for
this use". **These are not those.** Every document here was written for this
repository, and every manifest entry records that as
`provenance: "authored-for-this-repo"`.

That gap is not cosmetic, and it is the most important thing on this page:

- An authored document contains the clauses its author was thinking about. Real
  contracts contain the clauses a lawyer drafting against a small business
  actually writes, in the wording they actually use, in places nobody expected.
- So a recall figure measured here is **weaker evidence** than the same figure
  measured against real documents. It shows that the analysis finds what this
  repository knew to plant. It cannot show what the analysis is blind to,
  which is the failure `PRD.md` §4.2 exists to catch.
- Precision is weaker for the same reason in the other direction: the ordinary
  prose around a planted clause was written by the same hand, so it is unlikely
  to contain the near-misses real boilerplate is full of.

**What the owner has to add to close it.** Real negotiable documents — contracts,
leases, statements of work — that are public domain, licensed for this use, or
supplied by their own owner. Roughly: several per clause type, at least one
genuinely clean document per trade, and a few from an adversarial drafter. Each
one needs its clauses labelled by hand the way the sidecars here are, and its
`provenance` set to what it actually is (`public-domain`, `licensed` or
`owner-supplied`). Until then, every number the harness prints should be read as
"against documents this repository wrote".

Nothing in the harness has to change to take them; see **Adding a document**.

## What is here

    tests/corpus/manifest.json          every document, with its provenance
    tests/corpus/documents/*.txt        the documents written for the corpus
    tests/corpus/documents/*.json       their labels, one sidecar per document
    tests/corpus/analysers/             the analysers the harness is proved with
    tests/fixtures/*                    the three labelled fixtures and the
                                        binary ones, referenced rather than copied

Ten entries: three flagged documents, two clean ones, four extraction-stress
files and one adhesion contract. The master services agreement appears three
times — as a `.txt`, a `.pdf` and a `.docx` — because the same prose in three
files is three different extraction problems. Those three share one labels
sidecar, and the report says so, because a clause labelled there is counted once
for each of them.

### The manifest

One entry per document:

| Field | What it is |
|---|---|
| `id` | Stable name. The report and every defect is keyed by it. |
| `path` | The document, from the repository root. |
| `format` | `plain-text`, `pdf` or `docx`: what the extraction boundary has to do with it. |
| `documentType` | `negotiable` or `adhesion` (`CONTEXT.md`, ADR 0002). |
| `provenance` | `authored-for-this-repo`, `public-domain`, `licensed` or `owner-supplied`. |
| `role` | `flagged`, `clean`, `extraction-stress` or `adhesion`. |
| `labels` | Path of the sidecar carrying this document's labels. |
| `note` | What this document is in the corpus for, in a sentence. |

### The labels

One sidecar per document, the same shape `tests/fixtures/README.md` established:

- `plantedClauses` — each with `clauseType`, `severity`, `clauseRef`,
  `sourceSentence` (the single sentence a flag must quote, byte for byte) and
  `whatItPermits`.
- `checkedAndAbsent` — the clause types the document does not contain, so an
  all-clear can list what was looked for (ADR 0004), with a `notes` entry for
  each saying where the document handles that topic instead. A document is
  checked against all eight: every type is either planted or absent.
- `survivingSentences` — sentences known to be in the document, which must come
  out of extraction intact. Defaults to the planted clauses' source sentences.
- `expectedAllClear`, and `expectedOutcome` (`analysed` or `refused`).

The clause-type slugs and the three severity bands are the ones in
`tests/fixtures/README.md`, which are the eight types in `PRD.md` §5. There is
one vocabulary for this and `lib/analysis/taxonomy.ts` is the code that reads it.
A label whose severity is not the band the taxonomy fixes for that clause type
is rejected when the corpus loads (ADR 0003 — severity is per type, never per
document).

## The invariant

**Every `sourceSentence` occurs verbatim in the text its document extracts to.**
Plain substring match: not normalised, not trimmed, not case-folded, not fuzzy.
This is ADR 0001 expressed as data, and it is asserted three times over —
`tests/corpus.test.ts` against the plain-text documents as committed,
`tests/extraction-boundary.test.ts` against the binary fixtures, and the harness
itself against every document in the corpus on every run.

## Adding a document

1. Put the document under `tests/corpus/documents/` (or reference a file that is
   already in the repository).
2. Write its sidecar beside it. Copy each `sourceSentence` out of the document
   rather than retyping it; the suite will tell you immediately if it does not
   occur exactly once.
3. Add an entry to `manifest.json`, with `provenance` set to what the document
   actually is.
4. Run `npm test` and `npm run harness`.

Nothing else changes. The harness reads the manifest; it has no list of documents
in it.

## Adding a clause type

Two changes, never one: `lib/analysis/taxonomy.ts` and this corpus. A clause type
with nothing labelled is a clause type nothing can be claimed about, so
`tests/corpus.test.ts` fails until the corpus has at least one instance of it,
and the harness prints the type with a recall of `-` rather than silently
averaging it away.

## Extraction gaps this corpus has found and not closed

The stress documents are here to break extraction, and two of them do. Both are
recorded rather than worked around, and neither is labelled as surviving, so the
harness stays honest about what it has proved:

- **A footnote marker raised far enough to sit between two body lines.**
  `footnoted.pdf` sets two superscript markers. The one on paragraph 5.1 is
  raised a little and lands inside its own line, and 5.1's sentence survives. The
  one on paragraph 6.1 is raised by a third of the body size — an ordinary
  superscript — and the parser reports it as a row of its own between the two
  halves of the sentence, which recovery then reads in that order: the sentence
  comes out as "… within thirty (30) days of the end 2 of that month." Paragraph
  6.1 is therefore not among the labelled sentences. Closing this is work behind
  the extraction boundary, and the label can be added when it is.
- **A table page is reported as multi-column while being read across.**
  `tabular.pdf` produces `multiColumnPages: [{ pageNumber: 1, columns: 2 }]`, and
  its rows are nonetheless read left to right, because pdf.js fills the gaps
  between cells with space runs and those runs straddle the gutter the column
  finder found. The text that comes out is right and the diagnostic is
  misleading. On a page that is genuinely two columns *and* contains a table, the
  two halves of that disagreement would not cancel out.

Neither of these is fixed here: this ticket may read `lib/extraction/` and not
change it.

## What this corpus does not measure

- **Counter-offer quality** (`PRD.md` §4.7). Needs human judgement; there is no
  automated proxy and inventing one would be worse than saying so.
- **Grounded question answering** (§4.5) and **calibration** (§4.6). Both need
  the analysis boundary's second entry point, which does not exist yet.
- **Recall and precision thresholds** (§4.2, §4.3). Unset, deliberately. The
  harness prints the numbers and gates on neither; the number is the owner's to
  set, per clause type rather than in aggregate.
- **A scanned document.** `tests/fixtures/scan-no-text-layer.pdf` is deliberately
  not in the corpus: a scan is refused at the extraction boundary and never
  reaches analysis, which is ticket 02's test rather than a labelled document.
- **What Redline shows a reader who uploads an adhesion contract.** The corpus
  carries one and the harness extracts it and reports it as not analysed. What
  the product returns for it is ticket 07's, and one of the five questions
  `PRD.md` §8 leaves open.
