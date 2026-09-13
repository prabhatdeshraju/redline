# Redline — brief for the first version

This version exists to prove one thing: that the analysis can be trusted. Every
decision below is subordinate to that, including several that make the product
less impressive.

Vocabulary is defined in [CONTEXT.md](./CONTEXT.md) and the decisions behind
this brief are recorded in [docs/adr/](./docs/adr/). Where a claim rests on
research it is cited to `research/`; where nothing supports it, it says so.

---

## 1. Who this is for, and what they do today

**Freelancers and independent contractors** (72–76M in the US), and **small
business owners** (36.2M US businesses). Both are signing documents they can
still change: client contracts, statements of work, vendor and service
agreements, commercial leases.

Always the weaker party. The reader has less legal budget, less time, and less
leverage than whoever wrote the document, and usually needs the deal more than
the other side does.

**Renters are explicitly not served in this version.** See §6, call 3.

### What they do today

**Mostly, they sign it.** 77% of legal problems receive no legal support at all
(World Justice Project via Clio). The research found no evidence of any
systematic alternative in this segment — this is the realistic baseline.

Where they do act, these are the real options and prices:

| Option | Cost | Note |
|---|---|---|
| Lawyer, hourly | $162–$392/hr, median $249 | general rates (lawpay.com) |
| Contract review, hourly | $150–$500/hr | mylegalpal.com |
| Contract review, flat (5–15pp) | $300–$1,500 | mylegalpal.com |
| Residential lease review, flat | **$440 average** | contractscounsel.com |
| Commercial lease review, flat | $600–$3,000, avg $730 | contractscounsel.com |
| Human review, one-off | **$99 flat** | QwickContractReview, launched Oct 2025 |
| Fiverr contract-review gig | $20–$100 | fiverr.com |
| LegalShield, small business | $59.95–$169.95/mo | document review is the headline, tier-differentiating feature |
| Rocket Lawyer / LegalZoom | $31–$65/mo | **generates** documents from templates; does not review your upload |
| Ask a general-purpose LLM | free | see §8 — this is the most important untested threat |

Two things matter here. A competitor launched in October 2025 at **$99 for a
human review**, aimed at exactly this segment — that sets the ceiling. And a
free general-purpose model will produce a passable version of "explain this
contract and flag the risky bits" today, which sets the floor. Redline has to
justify itself in the gap between free-and-adequate and cheap-and-human.

---

## 2. The problem

People sign documents they do not understand, under pressure, and discover what
they agreed to much later — if ever.

The single genuine first-person account in the entire research set:

> "I agree. I almost didn't sign but I also couldn't afford to go without a job.
> Two years later I'm trying to figure out exactly what I signed because I
> believe it was very limiting."

And, on the same thread, on trying to obtain a copy from HR:

> "HR is unable to produce it..."

— Hacker News commenter "johnward", an employee re-papered after an acquisition.
Source: https://news.ycombinator.com/item?id=9732010

That is one data point, not a validated pattern, and the research says so
directly. Read §8 before treating the problem as established.

What *is* well evidenced is the downstream cost, for freelancers specifically
(Freelancers Union survey of NY freelancers):

- **62%** have lost wages to nonpayment at least once
- **91%** report late payment; **54%** report delays of three months or more
- **53%** have lost up to $10,000
- **67%** have done unpaid work because of scope creep

Sources: https://blog.freelancersunion.org/2022/05/12/over-60-of-ny-freelancers-report-not-being-paid-for-work-performed/ ,
https://authorsguild.org/news/survey-finds-62-percent-of-ny-freelance-workers-have-lost-wages-due-to-nonpayment/

There is also a trust problem specific to what Redline is. Users of existing
AI review tools do not believe them. A Robin AI reviewer:

> "it often misunderstands the phrasing of legal theory... it also misses some
> more subtle [issues]... we can't trust it fully and we need another layer of
> human oversight."

Source: https://www.g2.com/products/robin-2025-07-08/reviews

Redline's audience is therefore primed to distrust it before it opens. That is
why §4 exists and why it is the longest section in this brief.

---

## 3. What the first version does

1. **Accepts a negotiable document** — a contract, statement of work, vendor or
   service agreement, or lease — uploaded as a file, parsed in the browser.
   Only the extracted text leaves the browser.
2. **Produces a plain-English summary** of what the document commits the reader
   to.
3. **Flags clauses that carry asymmetric risk**, from the fixed set of eight
   clause types in §5, ranked by severity.
4. **Shows the exact source sentence** for every flag, quoted verbatim from the
   document. A flag that cannot show one is not displayed and is a bug.
5. **Drafts a counter-offer** for each flagged clause: replacement wording the
   reader can take back to the other side.
6. **Answers questions about the document**, using only the document. Where the
   text does not answer the question, it says so rather than inferring.
7. **Lets the reader declare their own thresholds** — terms they will not
   accept, in their own words — and treats a match as disqualifying regardless
   of how the clause would otherwise rank.
8. **Reports an all-clear when nothing matched**, shown together with the full
   list of clause types that were checked, never as an empty screen.
9. **Optionally saves the document to the reader's library**, off by default,
   expiring.

Nothing beyond this list. When something looks like the obvious next step and is
not on it, it gets asked about first.

---

## 4. What good looks like

The product's claim is trustworthiness, so "good" has to mean *measurably
trustworthy*, not *impressive-looking*. These are the tests. A labelled corpus
of real negotiable documents with known clauses does not exist yet and building
it is a prerequisite to all of this — see §8.

### 4.1 Citation integrity — binary, zero tolerance

Every flag's source sentence occurs **verbatim** in the extracted text of the
document it came from. Not approximately, not normalised, not fuzzy-matched.

This is a pass/fail suite gate, not a percentage to improve. A single failure is
a bug (ADR 0001). It is the cheapest thing here to test automatically and the
most important, because it is the only property a reader can verify unaided:
they search their own copy for the sentence and either find it or don't.

### 4.2 High-severity recall — prioritised over precision

On a labelled set, the share of known high-severity clauses that Redline flags.
Missing a personal guarantee is the failure the product exists to prevent, so
recall here is optimised at the cost of precision (ADR 0004).

**Threshold not yet set.** It should be set per clause type, not in aggregate —
aggregate recall hides a type the system is blind to.

### 4.3 Low-severity precision — prioritised over recall

On the same set, the share of low-severity flags that a reviewer agrees are real
risks. The error preference inverts here deliberately: noise at the bottom of
the list is what produces alarm fatigue, and alarm fatigue is how the product
stops being believed.

**Threshold not yet set.**

### 4.4 False all-clear rate — the one that ends the company

Run Redline against documents known to contain at least one flaggable clause. It
must never return an all-clear for any of them.

This needs its own test set and the heaviest coverage of anything here. A false
flag costs a reader a minute; a false all-clear is a person signing a personal
guarantee having been told the document was fine (ADR 0004).

### 4.5 Grounded Q&A — refusal is the pass condition

Ask questions whose answers are genuinely not in the document. Redline must
decline rather than infer, guess, or answer from general legal knowledge.

Test with three kinds of question: answerable from the text, answerable only
from outside knowledge, and adversarially framed to presuppose a term the
document does not contain. The second and third must produce a refusal.

### 4.6 Confidence calibration

Statements about what the document *says* are flat and unhedged. Statements
about what it *means* legally carry their uncertainty. The failure modes are
symmetrical and both are failures: hedging a direct quote, and asserting a legal
outcome as fact.

This is partly a regulatory test, not only a quality one. The FTC fined DoNotPay
$193,000, the core charge being claimed AI performance that had never been
tested (https://www.abajournal.com/news/article/robot-lawyer-website-donotpay-settles-ftc-claims-it-couldnt-deliver-on-promises).
Redline drafts counter-offers and ranks legal risk for consumers. Overclaiming
is an exposure, not a tone preference.

### 4.7 Counter-offer quality — the weakest thing here to measure

Two questions, both requiring human judgement: does the proposed wording
actually address the risk that was flagged, and is it something the other side
could plausibly accept? A counter-offer no client would ever agree to is not a
counter-offer.

There is no automated proxy for this. Say that plainly rather than inventing a
metric that looks rigorous.

### 4.8 Extraction fidelity

PDF line breaks, hyphenation and ligatures all break verbatim matching, and the
fix belongs in extraction rather than in loosening §4.1. Test against documents
that exercise each: multi-column layouts, hyphenated line ends, ligature-heavy
typefaces, and headers interrupting sentences.

---

## 5. The clauses Redline flags, and how severely

Eight clause types, fixed and **published in the product** so a reader can see
what was looked for and what was not (ADR 0003). Severity is the worst outcome a
clause permits, independent of how likely that outcome is.

A note on vocabulary: "red lines" in this project means the reader's own
declared unacceptable terms — `CONTEXT.md` calls those **thresholds**. The list
below is Redline's own flag set, which is a different thing.

### Highest severity

**Personal guarantees.** Worst case: the reader's personal assets satisfy a
business debt — deficiency judgments, and in some instruments confession of
judgment. It converts a bounded business risk into an unbounded personal one,
and a sole trader or new LLC often does not register that the document did that.
*Evidence: mechanism documented in the research; **no frequency data found**.*

**Uncapped indemnification.** Worst case: liability far exceeding the value of
the contract, triggered by a third party's claim rather than by anything the
reader did wrong. Ranked here because the ceiling is unbounded.
*Evidence: the research found **no hard statistics on indemnification
specifically**.*

### High severity

**Non-compete and non-solicit.** Worst case: barred from earning in your own
field, or from working with the clients you already have. ~30M US workers, 18%
of the workforce, are bound by non-competes (FTC). Critically: **they remain
enforceable** — the FTC's ban was blocked in August 2024 and the appeal dropped
in September 2025, so any assumption that these are dead is wrong.

**IP assignment and work-for-hire.** Worst case: the reader loses ownership of
work they expected to reuse, including portfolio rights and tooling built along
the way. Worth flagging even when common, because the research notes most
commissioned freelance work does not legally qualify as work-for-hire yet
contracts assert it anyway. *No frequency data found.*

**Limitation of liability and remedy-stripping.** Worst case: the other side is
functionally exculpated from its own wrongdoing and the reader has no remedy
worth pursuing. NACA's *Fine Print Traps* (March 2024) documents this pattern;
courts do uphold well-drafted caps.

### Medium severity

**Termination and notice.** Worst case: terminated without notice and unpaid for
work already delivered — or locked in by a notice period the reader cannot
afford to serve. Both directions matter.

**Payment terms and nonpayment exposure.** Worst case: bounded by the contract
value, which is why it ranks here. **This is the most frequent harm in the
research and it ranks mid-list**: 62% of freelancers have lost wages to
nonpayment, 91% report late payment, 53% have lost up to $10,000. That tension
is a direct consequence of worst-case ranking and is accepted knowingly
(ADR 0003).

**Scope and change control.** Worst case: unbounded unpaid work through
"reasonable revisions" or undefined deliverables. 67% of freelancers report
doing unpaid work because of scope creep.

---

## 6. The calls, and what each one cost

**1. Every flag must quote its source sentence** (ADR 0001).
*Chose against:* paraphrase, section references, and quoting whole clauses.
*Worse off:* readers whose real risk is something the document **does not say** —
no termination clause, no payment terms, no liability cap. Absence has no
sentence to quote, so it cannot be flagged. This is an unresolved hole, not an
oversight. Also worse off: anyone whose PDF extracts badly, since their flags
get dropped rather than approximated.

**2. Negotiable documents only; terms of service excluded** (ADR 0002).
*Chose against:* the four best-evidenced harms in the entire research set —
mandatory arbitration (60M+ US workers bound), auto-renewal and negative-option
traps (FTC complaints rose 42/day to 70/day between 2021 and 2024; Amazon's
$2.5B settlement), fee escalators and junk fees ($14.5B in card late fees in
2022), and unilateral amendment clauses.
*Worse off:* everyone harmed by adhesion contracts, which is the largest group
with the strongest evidence. We serve the weaker evidence because it is the only
evidence a counter-offer can act on.

**3. Freelancers and small businesses; renters excluded.**
*Chose against:* renters — 46.1M US renter households, and the $440 average
lease review that is the best value anchor in the research.
*Worse off:* renters, straightforwardly. The reason is that the research found
**zero willingness-to-pay evidence** for them and says explicitly "do not assume
this segment." The $440 figure is what a lawyer charges, not what a renter has
ever said they would pay.

**4. Harmful, not unusual** (ADR 0003).
*Chose against:* flagging deviation from market norm — cheaper to compute, and
the most defensible line available ("this is not what the rest of your industry
signs").
*Worse off:* nobody directly, but the product loses its best answer when the
other side says "everyone signs this." That objection will be true and will be
their first move.

**5. A fixed, published clause taxonomy** (ADR 0003).
*Chose against:* open-ended model judgement about what looks risky.
*Worse off:* readers facing a novel predatory clause that is not on the list. A
sophisticated other side drafting against a published list will put the damage
somewhere off it. We took provability over coverage, because an unmeasurable
system cannot support a trustworthiness claim.

**6. Severity means worst case, not expected cost** (ADR 0003).
*Chose against:* ranking by what actually happens most often.
*Worse off:* the freelancer whose real monthly wound is late payment and scope
creep, now ranked below rare catastrophes — and that grind is the thing they
would most readily have paid to fix.

**7. Over-flag at high severity; stay quiet at low** (ADR 0004).
*Chose against:* a uniform error preference.
*Worse off:* readers who get a wrong high-severity flag, in the most visible
position in the product. Accepted because the alternative is a missed
catastrophe.

**8. Certain about text, hedged about meaning** (ADR 0004).
*Chose against:* giving a verdict.
*Worse off:* every reader who wants to be told "you'll be fine" or "don't sign
this" — the sentence they actually came for. Redline describes and declines to
advise.

**9. The library is opt-in, expires, and is never trained on** (ADR 0005).
*Chose against:* a permanent archive, and any future aggregate analysis of the
corpus — clause frequency benchmarking, "most contracts in your field say X."
*Worse off:* readers who wanted a permanent record, and the company itself,
which is giving up the asset that would have made it valuable later. The reason
is that ADR 0001 forces retention of full document text — storing only flags and
quotes is not possible — so the library is a breach and discovery surface
holding the most sensitive documents a person owns.

**10. Built for the moment before signing.**
*Chose against:* the reader who has already signed and wants to know what binds
them.
*Worse off:* the one documented human being in the research. The Hacker News
commenter quoted in §2 is asking two years after signing, and Redline cannot
help him. A counter-offer is worthless once signed, so call 2 forces this. It
also means selling to someone with no felt pain yet, which makes timing and
distribution the hardest unsolved problem in the product — not a marketing
detail to be handled later.

---

## 7. What we are not building, and why

**Payments and billing.** Nothing about taking money makes the analysis more
trustworthy, and this version exists to establish that it is.

**OCR for scanned documents.** Actively undermines the product. A citation is
worthless when the text it points at was misread, and a misread character
produces a flag that is wrong in exactly the way a reader cannot detect
(ADR 0001).

**Sharing a document between users.** Adds a permissions model and a second
kind of stored data to a product whose data posture is already its largest
liability (ADR 0005).

**Terms of service and other adhesion contracts.** The counter-offer is
inapplicable and ToS;DR already grades pre-curated sites for free (ADR 0002).
Readers will still try to upload them, so it needs handling as a deliberate
case, not an error.

**Legal advice.** No "don't sign this," no enforceability predictions stated as
fact. Partly integrity, partly the DoNotPay precedent in §4.6.

**A permanent document archive.** See call 9.

**Flagging what a document omits.** Not excluded on principle — it has no source
sentence and therefore no home under ADR 0001. Genuinely open.

---

## 8. What the research could not tell us

Taken from `research/summary.md` §5 and `research/who-has-this-pain.md`. These
are gaps, not settled facts, and two of them should be closed before build.

**1. The pain is not validated.** One sourced first-person quote across the
entire research effort. Reddit was inaccessible to every agent in the run — all
fetches to reddit.com, old.reddit.com and the JSON API were blocked — so this is
a **tooling failure, not a finding**. It is not evidence the pain doesn't exist;
it is also not evidence that it does. **Close this: talk to 10–15 freelancers or
small business owners directly.**

**2. Nobody has said they would pay.** Every willingness-to-pay figure in this
brief is a *vendor's* price, not a buyer's statement. Not one dollar of stated
WTP came from a customer. A competitor at $99 proves someone *believes* in the
market; it does not prove the market.

**3. Whether anyone pays before signing is untested.** The research calls this
the question that "determines whether this is a product or a feature."
Willingness to pay peaks exactly when the product is useless — after signing.
**Close this before build.**

**4. The free alternative was never tested.** General-purpose models will do a
passable version of this today, for nothing. The research names this "the most
important untested competitive threat" and did not test it.

**5. No frequency data exists for half the flag set.** Personal guarantees, IP
assignment and work-for-hire, indemnification, and lease termination fees all
have documented *mechanisms* and no *prevalence* numbers. No dataset anywhere
tags complaints by clause type — CFPB categorises by product and issue, not
clause. The severity ranking in §5 therefore rests on reasoning about worst
cases, not on measured incidence.

**6. One competitive fact is unverified.** A single source says Robin AI wound
down in 2025–2026. Not cross-checked. Re-verify before relying on it.

### Still undecided

Not gaps in the research — decisions nobody has made yet. No number should be
inferred for any of these:

- The library's expiry window, and whether a reader can extend it per document
  (ADR 0005).
- Price, and whether per-document or subscription. The research reads the
  defensible band as $20–$99 per document or $15–$40/month, but see gap 2.
- Every threshold in §4.2 and §4.3.
- What Redline does when a reader uploads a terms of service document.
- Whether risks arising from **absence** can be surfaced at all, given ADR 0001.
