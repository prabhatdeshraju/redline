# Test fixtures

Three labelled documents, each a `.txt` with a `.json` sidecar. They are the
labelled set every recall, precision and all-clear number in `PRD.md` §4 is
measured against. The prose is written for this repository; no real party,
address or email in any of them exists.

## The invariant

**Every `sourceSentence` in every sidecar occurs verbatim, exactly once, in its
`.txt`** — plain substring match, not normalised, not trimmed, not fuzzy. This is
ADR 0001 expressed as data. `negotiable-flagged.txt` clause 13.2 deliberately
contains a typographic apostrophe (U+2019) rather than an ASCII one, so the
fixture exercises the character class that silently breaks verbatim matching.

## The fixtures

### `negotiable-flagged.txt` / `.json`

A master services agreement between a client and an independent contractor, with
six clauses planted from the eight clause types in `PRD.md` §5, spanning all three
severity bands with two at the highest. The rest of the document is ordinary
contract prose — definitions, confidentiality, notices, governing law,
severability, counterparts — so the fixture tests precision as well as recall.

Consumed by: **03** (labelled corpus and citation harness), **04** (first flag
with source sentence), **05** (full taxonomy ranked), **06** (plain-English
summary), **08** (false all-clear — this document must never return an all-clear),
**09** (counter-offers).

`documentType: "negotiable"`, `expectedAllClear: false`.

### `clean.txt` / `.json`

A design and development retainer agreement containing none of the eight clause
types. It handles the risky topics fairly rather than omitting them: a mutual
liability cap applying equally to both parties, net-thirty payment terms with a
dispute process, thirty days' notice on both sides, a licence to the client
instead of an assignment of ownership, and a written change-control process. That
makes it a harder test than a document that simply says nothing about them.

The sidecar carries `checkedAndAbsent` — all eight slugs — because an all-clear
has to report what was looked for (ADR 0004). Each entry in `notes` records where
in the document the topic is handled, so the fixture can be re-checked by hand.

Consumed by: **03**, **08** (all-clear with the checked list).

`documentType: "negotiable"`, `expectedAllClear: true`, `plantedClauses: []`.

### `adhesion.txt` / `.json`

A platform terms-of-service document: acceptance by continued use, no
individually negotiated terms, unilateral amendment, termination of an account at
will, mandatory arbitration and a class-action waiver. It exists so the refusal
can be tested.

This document is never flagged, so the sidecar records no clause types and no
severities. `adhesionMarkers` lists the clauses that make it an adhesion
contract — detection signals for the classifier, not flags. `refusalReason`
carries a stable slug and the reason to give the reader: a counter-offer has
nobody who could accept it (ADR 0002).

Consumed by: **07** (adhesion contract detection and refusal).

`documentType: "adhesion"`, `expectedOutcome: "refused"`.

## Slug vocabulary

Clause types, one slug per type in `PRD.md` §5, with the severity band that type
carries. Bands are fixed per clause type and are never a per-document judgement
(ADR 0003).

| Slug | `PRD.md` §5 clause type | Severity |
|---|---|---|
| `personal-guarantee` | Personal guarantees | `highest` |
| `uncapped-indemnification` | Uncapped indemnification | `highest` |
| `non-compete-non-solicit` | Non-compete and non-solicit | `high` |
| `ip-assignment-work-for-hire` | IP assignment and work-for-hire | `high` |
| `limitation-of-liability` | Limitation of liability and remedy-stripping | `high` |
| `termination-and-notice` | Termination and notice | `medium` |
| `payment-terms` | Payment terms and nonpayment exposure | `medium` |
| `scope-and-change-control` | Scope and change control | `medium` |

Severity bands: `highest`, `high`, `medium`. No other value is valid.

## Sidecar shape

Planted clause entries carry `clauseType`, `severity`, `clauseRef` (the numbered
clause, e.g. `"12.4"`), `sourceSentence` (the single sentence a flag must quote,
byte-for-byte out of the `.txt`), and `whatItPermits` — one or two sentences on
the concrete worst case, flat about what the document says and hedged about what
it means legally, with no verdict on whether to sign (ADR 0004).

## The binary fixtures

Three files carrying the same prose as `negotiable-flagged.txt`, so the
extraction boundary can be tested against real files rather than against a
parser that was mocked out. Built once by
`tests/fixtures/build-binary-fixtures.mjs`, which is committed beside them and
documents what each one is designed to break; no dependency was added for it.
Re-run it only if the prose changes.

### `negotiable-flagged.pdf`

Three pages of the same agreement, with a real text layer, built to break
verbatim matching in every way `02` names:

- a running header on every page and a running footer carrying a page number,
  both of which interrupt a sentence at a page boundary
- clause 4.3 and clause 13.2 hyphenated at line ends (`correspo-` / `nding`,
  `individ-` / `ual`)
- four source sentences carrying the ﬁ ligature as U+FB01, via an
  `/Encoding /Differences` entry mapping a code to the `/fi` glyph
- clause 13.2's typographic apostrophe (U+2019) as WinAnsi `0x92`
- a two-column page 2, under a heading spanning both columns, whose **right
  column is written to the file before its left column** and whose running
  header is written last, so correct reading order cannot come from stream order
- clause 13.2 beginning at the foot of page 2's right column and finishing at the
  top of page 3, with a footer and a header between the two halves

Consumed by: **02** (`tests/extraction-boundary.test.ts`).

### `negotiable-flagged.docx`

The same six source sentences as Word paragraphs, one carrying the ﬁ ligature
and one the typographic apostrophe. A DOCX has no pages and no line breaks, so
this fixture tests the character rule rather than the layout repair — and it is
what proves the ligature rule is ours, since no PDF parser is involved.

Consumed by: **02**.

### `scan-no-text-layer.pdf`

Two pages, each painting one image XObject and showing no text at all: the shape
a scan has. It exists so the refusal can be tested. It must never extract.

Consumed by: **02**.
