# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, with Supabase for auth and database, deployed on Vercel. The model is
called through OpenRouter, pinned to `anthropic/claude-opus-5`; changing the
model requires asking first. Uploaded files are parsed in the browser — only the
extracted text leaves it. Settled before init, recorded in `CLAUDE.md`, not
reopened here. Adding a dependency requires asking first.

No Supabase project, OpenRouter key, or Vercel deployment exists yet. Accounts
and cloud projects are not to be created unprompted; work that needs one stops
and asks.

## Users

**Freelancers and independent contractors** (72–76M in the US) and **small
business owners** (36.2M US businesses), at the moment before they sign a
document they still have standing to change: client contracts, statements of
work, vendor and service agreements, commercial leases.

The reader is always the weaker party — less legal budget, less time, less
leverage than whoever drafted the document, and usually needs the deal more than
the other side does. They are under time pressure and have no lawyer: 77% of
legal problems receive no legal support at all (World Justice Project via Clio).
Their realistic baseline behaviour is to sign it.

They are also primed to distrust this product before they open it, because they
have seen AI contract review fail. A Robin AI reviewer: *"we can't trust it
fully and we need another layer of human oversight."*

**Renters are explicitly not served in this version** — the research found zero
willingness-to-pay evidence for that segment and says not to assume it.
**Readers who have already signed are not served either**; a counter-offer is
worthless once signed.

## Product Purpose

Redline analyses a negotiable document someone is about to sign and shows them,
clause by clause, what could hurt them — each finding quoted verbatim from the
document itself, with replacement wording they can take back to the other side.

This first version exists to prove one thing: that the analysis can be trusted.
Every other decision is subordinate to that, including several that make the
product less impressive.

Success is *measurably trustworthy*, not *impressive-looking*. The tests are
defined in `PRD.md` §4: binary citation integrity, high-severity recall,
low-severity precision, a false all-clear rate of zero, refusal on ungrounded
questions, and calibrated confidence. A labelled corpus of real negotiable
documents does not exist yet and building it is a prerequisite to all of it.

This is being built as a real product for real readers who pay, not as a
demonstration. That makes the open validation gaps below blockers to close, not
caveats to document.

## Positioning

Redline sits in the gap between free-and-adequate and cheap-and-human. A free
general-purpose model will produce a passable "explain this contract and flag
the risky bits" today — that is the floor. A competitor launched in October 2025
at **$99 for a human review** aimed at exactly this segment — that is the
ceiling.

What a neighbouring product could not truthfully copy is the verifiability
guarantee: **every flag quotes the exact sentence it came from, and a flag that
cannot show one is not displayed.** It is the only property a reader can check
unaided — they search their own copy for the sentence and either find it or
don't. The clause set is fixed and published in the product, so a reader can see
what was looked for *and what was not*.

Two deliberate refusals define the position as much as the guarantee does:
Redline flags what is **harmful**, not what is **unusual**; and it **describes
without advising** — nobody is ever told "you'll be fine" or "don't sign this".

## Operating Context

- The decisive moment is **before signing**, while the terms can still change.
  Willingness to pay peaks after signing, exactly when the product is useless.
  Timing and distribution are therefore the hardest unsolved problem in the
  product, not a marketing detail for later.
- The reader arrives with the document as a file and leaves with wording to send
  back to the other side. The output's real destination is an email or a comment
  in someone else's draft.
- US market; the evidence base, the pricing anchors, and the enforceability
  picture are all US.
- Non-competes remain enforceable: the FTC's ban was blocked in August 2024 and
  the appeal dropped in September 2025. Any assumption that they are dead is
  wrong.
- Regulatory exposure is real and invisible in the code. The FTC fined DoNotPay
  $193,000, the core charge being claimed AI performance that had never been
  tested. Redline drafts counter-offers and ranks legal risk for consumers —
  the same blast radius. Overclaiming is an exposure, not a tone preference.
- Vocabulary is binding and defined in `CONTEXT.md`: **negotiable document**,
  **flag**, **source sentence**, **severity**, **clause type**, **asymmetric
  risk**, **counter-offer**, **all-clear**, **library**, **threshold**,
  **reader**, **other side**. Each entry carries terms to avoid; "reader" not
  "user", "flag" not "issue", "threshold" not "red line".

## Capabilities and Constraints

The first version does these nine things and stops:

1. Accepts a negotiable document uploaded as a file, parsed in the browser.
2. Produces a plain-English summary of what it commits the reader to.
3. Flags clauses carrying asymmetric risk, from a fixed set of eight clause
   types, ranked by severity.
4. Shows the exact source sentence for every flag, quoted verbatim.
5. Drafts a counter-offer for each flagged clause.
6. Answers questions using only the document, and says so when the text does
   not answer.
7. Lets the reader declare their own thresholds, treated as disqualifying
   regardless of how a clause would otherwise rank.
8. Reports an all-clear together with the full list of clause types checked —
   never an empty screen.
9. Optionally saves the document to the reader's library: off by default,
   expiring, never trained on.

**Analysis is not gated behind auth.** Upload and full analysis work
anonymously; signing in is required only to save to the library. Decided at
init.

The eight clause types, ranked by worst case rather than frequency: personal
guarantees and uncapped indemnification (highest); non-compete/non-solicit, IP
assignment and work-for-hire, limitation of liability and remedy-stripping
(high); termination and notice, payment terms and nonpayment exposure, scope and
change control (medium). Payment terms rank mid-list despite being the most
frequent harm in the research — a knowing consequence of worst-case ranking.

**Excluded on purpose:** payments and billing; OCR for scanned documents (a
citation is worthless when the text it points at was misread); sharing a
document between users; terms of service and other adhesion contracts; legal
advice; a permanent archive.

**Known holes, not oversights:**

- Risk arising from what a document **does not say** — no termination clause, no
  payment terms, no liability cap — has no sentence to quote and therefore no
  home under the citation rule. Genuinely open.
- A sophisticated other side drafting against a published clause list will put
  the damage somewhere off it. Provability was taken over coverage.
- When the other side says "everyone signs this," Redline has given up its best
  answer by flagging harm rather than deviation from market norm. That objection
  will be true and will be their first move.
- A clean run feels like nothing for the reader's money. A pricing and packaging
  problem, not one to solve with invented findings.
- Readers will upload terms of service anyway. It needs handling as a deliberate
  case, not an error.

**Explicitly undecided — no number to be inferred for any of these:**

- The library's expiry window, and whether a reader can extend it per document.
- Price, and whether per-document or subscription. The research reads the
  defensible band as $20–$99 per document or $15–$40/month, but no buyer has
  stated a figure.
- Every recall and precision threshold in `PRD.md` §4.2 and §4.3, which should
  be set per clause type rather than in aggregate.
- What Redline does when a reader uploads a terms of service document.
- Whether risks arising from absence can be surfaced at all.

## Brand Commitments

The product is named **Redline**. Note the collision the name creates: the
replacement wording Redline drafts is a **counter-offer**, never "a redline",
and the reader's own declared unacceptable terms are **thresholds**, not "red
lines".

Voice, per ADR 0004 — flat and certain about what the document *says*, hedged
about what it *means*. A source sentence is a fact and is never softened; a
legal consequence is a judgment and is where uncertainty belongs: *"This clause
makes you personally liable for the full amount. Whether a court would enforce
it depends on your state."* Hedging a direct quote and asserting a legal outcome
as fact are symmetrical failures.

No logo, wordmark, typography, colour, or other visual asset exists yet. No
visual direction has been established or made binding.

## Evidence on Hand

Real, cited, in `research/` — `summary.md`, `what-already-exists.md`,
`what-goes-wrong.md`, `who-has-this-pain.md`, `who-would-pay.md`. The brief is
`PRD.md`; decisions are in `docs/adr/0001`–`0005`.

Usable evidence:

- Freelancer harm, well sourced (Freelancers Union survey of NY freelancers):
  62% have lost wages to nonpayment, 91% report late payment, 54% report delays
  of three months or more, 53% have lost up to $10,000, 67% have done unpaid
  work because of scope creep.
- Non-competes bind ~30M US workers, 18% of the workforce (FTC).
- Competitor pricing, all vendor-stated: lawyer $162–$392/hr (median $249);
  flat contract review $300–$1,500; residential lease review $440 average;
  commercial lease review $600–$3,000 (avg $730); one-off human review $99;
  LegalShield $59.95–$169.95/mo; Rocket Lawyer / LegalZoom $31–$65/mo (which
  *generate* documents and do not review an upload).
- NACA's *Fine Print Traps* (March 2024) on remedy-stripping.

**Absences that must not be filled by invention:**

- **The pain is not validated.** One sourced first-person account exists across
  the entire research effort — a Hacker News commenter, quoted in `PRD.md` §2,
  who is asking two years *after* signing and whom Redline cannot help. Reddit
  was blocked to every research agent, so this is a tooling failure, not a
  finding. Close it by talking to 10–15 freelancers or small business owners.
- **Nobody has said they would pay.** Every willingness-to-pay figure above is a
  vendor's price. Not one dollar of stated WTP came from a buyer.
- **Whether anyone pays *before* signing is untested** — the question that
  decides whether this is a product or a feature.
- **The free alternative was never tested.** The research names a
  general-purpose model the most important untested competitive threat.
- **No frequency data exists for half the flag set.** Personal guarantees, IP
  assignment and work-for-hire, indemnification, and lease termination fees have
  documented mechanisms and no prevalence numbers; no dataset anywhere tags
  complaints by clause type. The severity ranking rests on reasoning about worst
  cases, not measured incidence.
- **One competitive fact is unverified** — a single uncorroborated source says
  Robin AI wound down in 2025–2026. Re-verify before relying on it.

No testimonials, customers, benchmarks, case studies, press, or labelled
document corpus exist. None are to be written as though they do.

## Product Principles

1. **Verifiable beats impressive.** The reader must be able to check the output
   against their own copy without help. Anything that weakens that — fuzzy
   matching, paraphrase, OCR — is not a trade to consider.
2. **Loud about catastrophe, quiet about noise.** Over-flag at high severity
   even when unsure; flag at low severity only when confident. Alarm fatigue
   destroys trust; a missed catastrophe destroys the reader.
3. **Describe, never advise.** State what the document says; hedge what it
   means; never give a verdict. Integrity and regulatory exposure point the same
   way.
4. **Provable coverage over total coverage.** A fixed, published clause set that
   can be measured beats open-ended judgement that cannot, and the reader is
   told what was not looked for.
5. **Hold as little as the guarantee allows.** Citation forces retention of full
   document text, which makes the library the largest liability in the product:
   opt-in, expiring, never trained on, never aggregated.
