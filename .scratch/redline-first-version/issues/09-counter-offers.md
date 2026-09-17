# 09: Counter-offers

**What to build:** For each flagged clause, a reader gets replacement wording
they can send back to the other side, shown against the original so they can
see exactly what they are asking to change. They can copy it into an email.

A counter-offer has two jobs and fails if it misses either: it must address the
specific risk that was flagged, and it must be something the other side could
plausibly accept. Wording no client would ever agree to is not a counter-offer.

This is also the product's most distinctive output and the reason adhesion
contracts are out of scope at all (ADR 0002).

It is not legal advice, and the interface should not let a reader mistake it
for legal advice.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Every flagged clause carries drafted replacement wording
- [ ] The counter-offer is shown against the original wording it would replace
- [ ] The counter-offer can be copied as text
- [ ] The counter-offer addresses the specific risk that was flagged, not a general improvement
- [ ] The reader understands this is a starting position, not legal advice
- [ ] A review checklist exists for judging counter-offer quality by hand, against a fixed document set — there is no automated proxy for this, and none should be invented
