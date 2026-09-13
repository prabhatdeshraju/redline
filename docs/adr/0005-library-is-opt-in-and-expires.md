# 0005 — The library is opt-in, expires, and is never trained on

Saving a document is opt-in rather than automatic, every stored document expires
by default, and the corpus is never used to train or evaluate a model. The
saved library was specified as a feature; it is primarily a liability, and this
is the smallest version of it that still serves the reader.

## Why

Redline would hold the text of people's client contracts, leases and employment
agreements — among the most sensitive documents they own. ADR 0001 makes this
sharper rather than softer: a citation is valid only against the extraction it
was made from, so the library has to retain the **full extracted text** or every
saved flag silently breaks. Storing only the flags and their quoted sentences is
not available to us.

So the architecture requires retaining whole documents indefinitely unless we
decide otherwise. That is a breach surface holding exactly what an attacker
would want, a discovery surface (one party's contract corpus is subpoenable),
and a retention policy that nobody had written. "Only text is stored" was framed
as a privacy measure; the text is the problem.

## Consequences

- We give up the library as a retention and engagement mechanism. Documents
  leaving on their own is the opposite of a reason to come back.
- We give up any future aggregate analysis of the corpus — clause frequency
  data, benchmarking, "most contracts in your field say X." That is precisely
  the asset that would have made this company valuable later, and choosing this
  now is choosing not to build it.
- Expiry has to be honest about ADR 0001: when a document's text expires, the
  flags saved against it can no longer show their source sentences, so they
  expire with it. A flag without its source is a bug, so the record goes too.
- **Still undecided:** the actual expiry window, and whether the reader can
  extend it per document. Both belong in the brief. No number has been chosen
  yet — do not infer one.
