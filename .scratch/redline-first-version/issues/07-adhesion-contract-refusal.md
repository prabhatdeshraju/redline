# 07: Adhesion contract detection and refusal

**What to build:** A reader uploads a terms of service, a platform agreement or
similar take-it-or-leave-it document. Redline recognises it, says it cannot
help with this kind of document and why, and shows what it does handle.

This is a distinct outcome, not an error and not an empty analysis. Readers
will try it, and a blank result would read as "nothing wrong here" — the most
dangerous thing Redline can wrongly say.

The reason to give is the honest one: the counter-offer is what makes these
documents out of scope. Nobody counter-offers a platform's terms, so the most
useful thing Redline produces is inapplicable (ADR 0002).

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] An uploaded terms of service or platform agreement is recognised as an adhesion contract
- [ ] The reader is told Redline cannot help with it, and that the counter-offer is the reason
- [ ] The refusal is a distinct outcome, never an error state and never an empty analysis
- [ ] The reader is shown which document types Redline does handle
- [ ] A negotiable document is not misclassified as an adhesion contract
