# 0001 — Every flag cites its source

## Decision

Every risk flag Redline produces carries the exact sentence it came from, quoted verbatim from the
uploaded document and shown with the flag. A flag whose source sentence cannot be shown is a bug, not
a formatting preference — a defect in the analysis, not something to render with a partial citation.

## Alternatives

- **Let the model describe each risk in its own words, quoting nothing.** Cheapest, reads the most
  fluently, and leaves an invented risk looking identical to a real one.
- **Cite a location instead of text** — "Section 8.2". A pointer the reader resolves by hand, and
  section numbering is often absent, duplicated or wrong in extracted text.
- **Allow a close paraphrase rather than a verbatim match.** Saves flags whose wording we could not pin
  down, at the cost of the property that makes a citation checkable: you can search for it.
- **Quote the whole clause.** Easier to locate, but buries the sentence doing the damage.

## Why

So a reader can check our work without trusting us, and without a lawyer:

- Search their own copy for the quoted sentence and confirm it is there, word for word.
- Judge from the original wording whether our severity ranking is fair, not our characterization.
- See each counter-offer against the exact text it is meant to replace.
- Catch our mistakes — a sentence not in their document means the flag is wrong, visible to anyone.

## Consequences

- A risk that comes from what the document *does not* say — no termination clause, no payment terms —
  has no source sentence and cannot be flagged under this rule. Open question, not yet decided.
- Recall drops on purpose: an ungroundable flag is dropped rather than shown, so Redline reports fewer
  risks than a system willing to guess.
- Browser-side parsing must preserve text faithfully enough to match exactly. PDF line breaks,
  hyphenation and ligatures all break verbatim matching; the fix belongs in extraction, not in
  loosening the match.
- Citations are valid only against the extraction they were made from; re-parsing a stored document
  later can silently invalidate every flag saved against it.
- Tests assert each flag's cited sentence occurs verbatim in the source text — a suite gate, not
  something anyone eyeballs.
