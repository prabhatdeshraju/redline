# 0003 — What gets flagged, and how it ranks

Three decisions taken together, because they share one rationale and a reader
who meets any of them will want the other two: Redline flags a clause for being
harmful rather than unusual, searches a fixed and published set of clause types,
and ranks by worst case rather than expected cost. Each exists to make the
analysis provable, which is the thing this version is for.

## The three

**Flags are for asymmetric risk, not for deviation from the norm.** A clause is
flagged because of what it does to the reader, not because it is unusual.
Mandatory arbitration is entirely standard and among the most harmful clauses
documented; a bespoke payment schedule can be unusual and perfectly fair.

**The clause taxonomy is fixed and published.** Roughly eight types survive ADR
0002: non-compete and non-solicit, payment terms and nonpayment exposure, scope
and change control, IP assignment, indemnification, limitation of liability,
personal guarantees, termination and notice. Open-ended "find anything risky"
cannot be measured — you never learn what it missed — so it cannot support a
claim that the analysis is trustworthy.

**Severity is the worst outcome a clause permits, not its expected cost.** A
personal guarantee is potentially ruinous and has no frequency data at all;
unpaid scope creep is survivable and affects 67% of freelancers. Worst-case
ranking puts the first above the second.

## Consequences

- Redline will regularly flag boilerplate, and the other side's first response
  will be "everyone signs this." That is a true statement and not a defence,
  but the product needs an answer to it ready.
- Ranking by worst case pushes the freelancer's actual recurring wound — late
  payment, scope creep — down the list, below rare catastrophes. The daily
  grind is the thing they would most readily pay to fix, and we are choosing to
  be a tool that prevents ruin instead.
- A published taxonomy tells a sophisticated other side exactly where Redline
  is not looking. Expect the list to be drafted against; treat it as an opening
  position, not a finished one.
- Every clause type needs a labelled set before we can claim any of this works.
  Per-type recall is measurable now, which is the point of fixing the list.
- We give up the cheapest and most defensible signal we had — "this is not what
  the rest of your industry signs."
