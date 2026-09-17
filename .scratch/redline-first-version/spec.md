# Spec: Redline, first version

Status: ready-for-agent

Scope: all nine capabilities from `PRD.md` §3. Vocabulary is `CONTEXT.md`;
decisions are `docs/adr/0001`–`0005` and are binding, not advisory.

---

## Problem Statement

A freelancer or small business owner is sent a contract, statement of work,
vendor agreement or lease and is expected to sign it. They have less legal
budget, less time and less leverage than whoever wrote it, and they usually need
the deal more than the other side does.

So they sign it. 77% of legal problems receive no legal support at all. The
alternatives are a lawyer at $150–$500 an hour, a flat review at $300–$1,500, or
a human one-off at $99 — all of which cost more than the reader is willing to
spend on a document they assume is standard.

Then the cost arrives later: 62% of freelancers have lost wages to nonpayment,
67% have done unpaid work because of scope creep, 53% have lost up to $10,000.
The reader finds out what they agreed to long after they could have changed it,
and sometimes cannot find out at all.

The alternative that already exists — asking a general-purpose model — produces
something plausible and unverifiable. The reader cannot tell which parts came
from their document and which the model made up, so a confident answer and a
fabricated one look identical. Readers of existing AI review tools say exactly
this: *"we can't trust it fully and we need another layer of human oversight."*

## Solution

The reader uploads the document before signing. Redline returns a plain-English
summary, the clauses that carry asymmetric risk ranked by severity, and — for
every single flag — the exact sentence from their own document that it came
from, quoted verbatim. For each flagged clause it drafts a counter-offer they
can take back to the other side. They can ask questions and get answers drawn
only from the document. They can declare their own thresholds up front, and a
clause that crosses one is treated as disqualifying regardless of how it would
otherwise rank.

The reader can verify the work without trusting Redline and without a lawyer:
search their own copy for the quoted sentence. It is there, word for word, or
Redline is wrong — and that is visible to anyone, expertise or not.

When nothing matched, Redline says so and shows what it looked for.

---

## User Stories

### Uploading and extraction

1. As a reader, I want to upload a contract as a PDF, so that I can use the file the other side actually sent me.
2. As a reader, I want to upload a DOCX, so that I don't have to convert a file the other side sent me in Word.
3. As a reader, I want to paste text directly, so that I can check terms that arrived in an email body rather than as an attachment.
4. As a reader, I want my file parsed in my own browser, so that the document never leaves my machine as a file.
5. As a reader, I want to be told plainly that only the extracted text is sent onward, so that I can decide whether to proceed knowing what leaves my machine.
6. As a reader, I want to be told when my document appears to be a scan rather than text, so that I don't receive an analysis based on characters that were never read correctly.
7. As a reader, I want extraction to preserve the document's sentences faithfully across page breaks, columns and hyphenation, so that the sentences Redline quotes back to me match what is on my page.
8. As a reader, I want to see how much text was extracted before analysis runs, so that I can spot a file that failed to parse rather than waiting for a confusing result.
9. As a reader, I want a document that is too long to be rejected clearly rather than silently truncated, so that I never get an analysis that quietly ignored half my contract.

### Document type

10. As a reader, I want Redline to tell me when I have uploaded a terms of service or other adhesion contract, so that I understand why it cannot help rather than assuming it found nothing.
11. As a reader uploading an adhesion contract, I want to be told specifically that the counter-offer is the reason it is out of scope, so that the refusal makes sense to me.
12. As a reader, I want to see which document types Redline does handle, so that I know what to bring it next time.

### Summary

13. As a reader, I want a plain-English summary of what the document commits me to, so that I understand the deal before I look at individual risks.
14. As a reader, I want the summary to state my obligations and the other side's separately, so that I can see the asymmetry of the deal at a glance.
15. As a reader, I want the summary to name the money, the dates and the duration, so that I can check the commercial terms against what was agreed verbally.
16. As a reader, I want the summary to avoid legal jargon, so that I don't need a lawyer to read the thing that was supposed to replace one.

### Flags

17. As a reader, I want clauses that shift risk onto me to be flagged, so that I know which parts of the document are working against me.
18. As a reader, I want each flag to say what the clause does to me in concrete terms, so that I understand the consequence rather than the category.
19. As a reader, I want flags ranked by severity, so that I spend my limited negotiating capital on what matters most.
20. As a reader, I want severity to mean the worst outcome a clause permits, so that a rare catastrophe outranks a frequent nuisance.
21. As a reader, I want a clause flagged because it is harmful and not because it is unusual, so that standard-but-damaging boilerplate does not get a pass.
22. As a reader, I want to see the full list of clause types Redline searched for, so that I know the boundaries of what I was told.
23. As a reader, I want to know that a clause type was checked and not found, so that silence on a topic means something.
24. As a reader, I want multiple instances of the same clause type flagged separately, so that a contract with three separate indemnities does not look like one.

### Source sentences

25. As a reader, I want every flag to show the exact sentence from my document it came from, so that I can confirm Redline is describing my contract and not a generic one.
26. As a reader, I want the quoted sentence to be word-for-word, so that I can search my own copy for it and find it.
27. As a reader, I want to see the quoted sentence in its surrounding context, so that I can judge whether Redline read it fairly.
28. As a reader, I want to be able to copy the quoted sentence, so that I can paste it into an email to the other side.
29. As a reader, I want no flag shown to me that cannot produce its source sentence, so that everything I am shown is checkable.
30. As a maintainer, I want the test suite to fail outright when any flag's quoted sentence does not occur verbatim in the extracted text, so that the product's central claim cannot regress silently.

### Counter-offers

31. As a reader, I want replacement wording drafted for each flagged clause, so that I have something to send rather than only a worry.
32. As a reader, I want the counter-offer shown next to the original wording, so that I can see exactly what I am asking to change.
33. As a reader, I want the counter-offer to address the specific risk that was flagged, so that I am not proposing an unrelated edit.
34. As a reader, I want the counter-offer to be something the other side could plausibly accept, so that I don't damage the relationship by asking for the impossible.
35. As a reader, I want to copy a counter-offer as text, so that I can put it in my reply.
36. As a reader, I want to understand that a counter-offer is a starting position and not legal advice, so that I don't over-rely on it.

### Questions

37. As a reader, I want to ask questions about my document in my own words, so that I can check the specific thing I am worried about.
38. As a reader, I want answers drawn only from my document, so that I can trust that what I am told is in the text I uploaded.
39. As a reader, I want to be told when my document does not answer my question, so that I don't mistake a guess for a term.
40. As a reader asking something the document is silent on, I want a refusal rather than a plausible inference, so that I don't act on something nobody wrote.
41. As a reader, I want answers to quote the passage they rest on, so that I can verify an answer the same way I verify a flag.
42. As a reader asking a question that presupposes a term my document doesn't contain, I want that premise corrected, so that I don't proceed on a false assumption.

### Thresholds

43. As a reader, I want to write down terms I will not accept, in my own words, so that the analysis reflects my situation rather than a generic risk model.
44. As a reader, I want a clause that crosses one of my thresholds surfaced as disqualifying, so that my own limits outrank Redline's ranking.
45. As a reader, I want to edit my thresholds and re-run the analysis, so that I can refine them as I learn what matters to me.
46. As a reader, I want my thresholds to persist between documents, so that I don't retype them for every contract.
47. As a reader, I want to see which threshold a clause crossed and why, so that I can tell whether the match was right.
48. As a reader with no thresholds set, I want the analysis to work anyway, so that I am not forced to configure something before getting value.

### All-clear

49. As a reader whose document is genuinely fine, I want to be told so plainly, so that I can sign with confidence.
50. As a reader receiving an all-clear, I want to see every clause type that was checked and found absent, so that the result reads as work done rather than nothing found.
51. As a reader, I want Redline never to invent a concern to appear useful, so that a flag always means something.
52. As a maintainer, I want the suite to fail if a document with a known flaggable clause ever returns an all-clear, so that the most dangerous output the product can produce is the most heavily tested.

### Library

53. As a reader, I want saving a document to be off unless I turn it on, so that nothing sensitive is retained by default.
54. As a reader, I want to be told before saving what is retained and for how long, so that I can make an informed choice.
55. As a reader, I want to see my previously analysed documents, so that I can return to an analysis I did not finish acting on.
56. As a reader, I want a saved analysis to still show its source sentences when I come back to it, so that it is as checkable later as it was on the day.
57. As a reader, I want to delete a saved document immediately and completely, so that I can withdraw it when circumstances change.
58. As a reader, I want stored documents to expire on their own, so that forgetting to clean up is not a permanent exposure.
59. As a reader, I want to be told that my documents are never used to train a model, so that I am not paying for a service by supplying it with my contracts.
60. As a reader whose document has expired, I want its flags to have gone with it, so that I am never shown a finding I can no longer verify.

### Accounts and cross-cutting

61. As a reader, I want to sign in, so that my library and thresholds are mine and nobody else's.
62. As a reader, I want to analyse a document without an account, so that I can judge whether Redline is worth signing up for.
63. As a reader, I want to be told what Redline is certain of and what it is not, so that I can tell a quote from a judgement.
64. As a reader, I want Redline never to tell me whether to sign, so that I am not taking legal advice from a tool that cannot give it.
65. As a reader on a phone, I want the analysis to be readable, so that I can check a contract when it arrives rather than when I next reach a desk.
66. As a reader, I want to know when analysis is still running, so that I don't mistake a partial result for a complete one.
67. As a reader, I want a failed analysis to say what failed, so that I know whether to retry or to change the file.

---

## Implementation Decisions

### The two seams

Two module boundaries, both new. Every test in `PRD.md` §4 lands on one of them.

**Extraction boundary.** Takes a file, returns the document's text. Runs in the
browser; the file itself never leaves the reader's machine (ADR: `CLAUDE.md`
settled decisions). Owns everything about faithful text recovery — page breaks,
column order, hyphenation at line ends, ligatures, headers interrupting
sentences. When verbatim matching later fails because the text was mangled, the
fix belongs here, never in loosening the match (ADR 0001).

**Analysis boundary.** Takes document text and the reader's thresholds; returns
the analysis. Exposes two entry points, because both are the same underlying
discipline — never assert beyond the text:

- one that produces the summary, flags, severities, source sentences and
  counter-offers
- one that answers a reader's question, or refuses

Both are pure with respect to storage: neither reads nor writes the library. The
caller decides whether to persist, which keeps ADR 0005's opt-in default a
visible decision at the call site rather than a behaviour buried in analysis,
and keeps the seam testable without a database.

### The citation gate lives inside the analysis boundary

The verbatim check is the **last step before the analysis is returned**. A flag
whose source sentence does not occur verbatim in the supplied text is dropped
there and never crosses the boundary.

This placement is the decision, not an implementation detail. At the render
layer instead, a test at the analysis seam could not catch an ADR 0001
violation, and the suite gate would be worthless. The invariant has to hold at
the boundary for the boundary to be worth testing.

Make it structural rather than conventional — a flag that can exist without its
source sentence is a flag that will eventually ship without one:

```
Flag {
  clauseType     ClauseType      // one of the fixed eight
  severity       Severity
  sourceSentence string          // required; never optional, never nullable
  ...
}
```

The dropped-flag count is recorded for diagnostics: a document producing many
drops is an extraction defect (§4.8), not an analysis defect, and the two must
be distinguishable.

### Clause taxonomy is data, not prose

The eight clause types from `PRD.md` §5 are an enumerated, versioned list the
product reads — because it is published in the interface, drives per-type recall
thresholds (§4.2), and populates the all-clear's checked list (§4.4). Each entry
carries its type, severity band, and the reader-facing description of what the
clause does to them. Adding a type is a data change plus a labelled-set change,
never a prose edit in a prompt.

### Severity is worst-case and fixed per clause type

Severity bands come from the taxonomy, not from per-document model judgement, so
ranking is reproducible across runs of the same document (ADR 0003). A crossed
threshold is surfaced as disqualifying and outranks the severity ordering
without altering it.

### Model access

All model calls go through OpenRouter, pinned to `anthropic/claude-opus-5`. The
model identifier lives in one place. Changing it requires asking first
(`CLAUDE.md`).

The analysis boundary is the only caller. Nothing else in the product talks to a
model, so there is exactly one place where grounding discipline has to hold.

### Storage

Supabase for auth and for the library. Only extracted text and analyses are
stored, never the uploaded file.

ADR 0005 forces retention of **full document text** for any saved analysis,
because a citation is valid only against the extraction it was made from.
Storing flags and their quoted sentences alone is not possible. Two consequences
for the schema:

- An analysis references the exact extraction it was produced from. Re-parsing a
  document later produces a new extraction and does not silently re-point
  existing flags at it.
- Expiry removes the extracted text and the analyses derived from it together. A
  flag cannot outlive the text it quotes, because a flag without a verifiable
  source is a bug (ADR 0001).

Anonymous analysis is supported and stores nothing.

### Adhesion contracts

Classified at the analysis boundary and returned as a distinct outcome — not an
error, and not an empty analysis. Readers will upload terms of service (ADR
0002); the response explains that the counter-offer is what makes them out of
scope.

### Voice

Statements about what the document says are flat and unhedged. Statements about
what a clause means legally carry their uncertainty. No verdict on whether to
sign (ADR 0004). This is a regulatory constraint as much as a stylistic one —
see Further Notes.

---

## Testing Decisions

### What makes a good test here

Assert on what crosses a seam, never on how the module got there. Prompt
wording, retry behaviour and internal decomposition must all be replaceable
without touching a test. There is no prior art in this repo — this is the first
code — so these seams set the pattern for everything after.

The unusual property of this product is that its most important test is cheap
and mechanical: **does this quoted string occur in that input string.** Spend
the effort on corpora instead.

### Against the extraction boundary

Deterministic and fast, no model involved. A corpus of documents chosen to break
verbatim matching: multi-column layouts, hyphenated line ends, ligature-heavy
typefaces, headers interrupting sentences, footnotes mid-paragraph, tables. For
each, assert that known sentences are recovered intact.

Also: a scanned image-only PDF is detected and reported, never analysed.

### Against the analysis boundary

- **Citation integrity (§4.1).** Every flag's source sentence occurs verbatim in
  the input text. Binary, zero tolerance, whole suite fails on one violation. No
  model needed to check it — it runs over recorded analyses.
- **High-severity recall (§4.2).** Per clause type, not aggregate; aggregate
  recall hides a type the system is blind to. Thresholds are unset — see Further
  Notes.
- **Low-severity precision (§4.3).** Error preference inverts here deliberately.
  Thresholds unset.
- **False all-clear (§4.4).** Its own corpus: documents each known to contain at
  least one flaggable clause. An all-clear on any of them fails. Heaviest
  coverage of anything in the suite.
- **Grounded Q&A (§4.5).** Three question classes — answerable from the text,
  answerable only from outside knowledge, and adversarially presupposing an
  absent term. The second and third must refuse. Refusal is the pass condition.
- **Calibration (§4.6).** Both directions are failures: a hedged direct quote,
  and a legal outcome asserted as fact.
- **Reproducibility.** The same document and thresholds produce the same
  severity ordering across runs.

### Not automatable

**Counter-offer quality (§4.7).** Does the wording address the flagged risk, and
could the other side plausibly accept it? Both need human judgement. Record it
as a review checklist against a fixed document set; do not invent a metric that
looks rigorous.

### Prerequisite

A labelled corpus of real negotiable documents with known clauses **does not
exist and nothing in §4 can be measured without it.** Building it is the first
piece of work, not a step inside the first feature. Treat it as a blocking
dependency for every recall and precision number in this spec.

---

## Out of Scope

From `PRD.md` §7, all deliberate:

- **Payments and billing.** Nothing about taking money makes the analysis more
  trustworthy.
- **OCR for scanned documents.** Actively undermines the product: a citation is
  worthless when the text it points at was misread, and the error is invisible
  to the reader (ADR 0001).
- **Sharing a document between users.** A permissions model on top of the
  product's largest liability (ADR 0005).
- **Terms of service and adhesion contracts** as analysable input. Detected and
  refused, not analysed (ADR 0002).
- **Legal advice.** No "don't sign this", no enforceability stated as fact.
- **A permanent archive.** Everything expires (ADR 0005).
- **Flagging what a document omits.** No missing termination clause, no absent
  payment terms, no missing liability cap. This is **open, not decided** — such
  a risk has no source sentence and therefore no home under ADR 0001. Do not
  implement it under this spec; it needs a decision first.

Also out of scope for the build, and prior to it:

- **Closing PRD §8 gaps 1 and 3.** Nobody has spoken to a freelancer or small
  business owner, and nobody has tested whether a person pays before signing.
  The research calls the second one the question that "determines whether this
  is a product or a feature." Neither is engineering work and neither is done.

---

## Further Notes

**Five things are undecided and no value should be inferred for any of them**
(`PRD.md` §8):

1. Every threshold in §4.2 and §4.3. Recall and precision gates cannot be
   written until someone sets them.
2. The library's expiry window, and whether a reader can extend it per document.
3. Price, and whether per-document or subscription.
4. What exactly Redline shows a reader who uploads a terms of service document,
   beyond the fact that it refuses.
5. Whether risks arising from absence can be surfaced at all.

Items 1 and 2 block parts of this spec. An implementing agent that reaches one
should stop and ask rather than choose a number.

**The regulatory constraint is not visible in the code.** The FTC fined DoNotPay
$193,000, the core charge being claimed AI performance that had never been
tested. Redline drafts counter-offers and ranks legal risk for consumers, which
is the same blast radius. §4.6 is therefore a compliance test as much as a
quality one, and every product claim has to be one the suite can substantiate.

**Three decisions deliberately reduce recall** — dropping unciteable flags (ADR
0001), fixing and publishing the clause taxonomy (ADR 0003), and narrowing the
document types (ADR 0002). Over-flagging at high severity (ADR 0004) is a
partial counterweight, not a reversal. Redline will report fewer risks than a
system willing to guess. That is the bet, and it should not be "fixed" by a
later change that loosens any of the three.

**The published taxonomy is an opening position.** A sophisticated other side
drafting against a known list will put the damage somewhere off it. Expect the
list to be attacked and versioned.
