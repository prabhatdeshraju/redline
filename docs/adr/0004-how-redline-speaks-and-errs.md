# 0004 — How Redline speaks, and which way it errs

Three decisions about the output itself, grouped because they are one posture:
how much Redline asserts, which mistake it prefers, and what it says when it
finds nothing. All three exist because a reader who stops believing the output
gets no value from a correct analysis.

## Which error we prefer

Over-flag at high severity; stay quiet at low severity. A potentially ruinous
clause gets flagged even when we are unsure; a minor one only when we are
confident.

The preference is deliberately not uniform, because the costs are not. Alarm
fatigue at the bottom of the list is what destroys trust; a missed catastrophe
at the top is what destroys the reader. Note that ADR 0001 and ADR 0003 already
bias the whole system toward missing things — dropping unciteable flags, fixing
the clause list — so this is a partial counterweight to a choice already made,
not a fresh direction.

## How certain it sounds

Flat and certain about what the document says. Hedged about what it means.

A source sentence is a fact and is never softened. A legal consequence is a
judgment and is where uncertainty belongs: *"This clause makes you personally
liable for the full amount. Whether a court would enforce it depends on your
state."* This follows the standing rule that Redline states only what the
document says.

The constraint is also regulatory, which is not visible in the code: the FTC
fined DoNotPay $193,000, the core charge being claimed AI performance that had
never been tested. Redline drafts counter-offers and ranks legal risk for
consumers, which is the same blast radius. Overclaiming is an exposure, not a
tone preference.

## What a clean document produces

An all-clear, shown with the full list of clause types that were checked and
found absent — never a blank screen, and never a manufactured top three.

Padding a clean result to look useful is the precise behaviour that would
destroy the trust this version exists to establish. ADR 0003's published
taxonomy is what makes the honest version possible: "we looked for these eight
things and found none" is an answer; an empty screen is an absence.

## Consequences

- Nobody is ever told "you'll be fine" or "don't sign this" — the sentence
  readers most want. Redline describes and declines to advise.
- The top of the list will sometimes be wrong, in the most visible position in
  the product. That is the accepted cost of not missing a catastrophe.
- An all-clear is the most dangerous output we produce. A false flag wastes a
  minute; a false all-clear is the failure that ends the company. It deserves
  the most test coverage, not the least.
- A clean run feels like nothing for the reader's money. That is a pricing and
  packaging problem, and it belongs in the brief rather than being solved with
  invented findings.
