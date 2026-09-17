# 08: All-clear with the checked list

**What to build:** A reader whose document is genuinely fine is told so
plainly, and shown every clause type Redline checked and did not find. Not a
blank screen, and never a manufactured concern invented to look useful.

Most documents are fine. A tool that always finds something stops being
believed, and padding a clean result is the precise behaviour that would
destroy the trust this version exists to establish (ADR 0004).

The all-clear is also the most dangerous output Redline produces. A false flag
costs a reader a minute; a false all-clear is a person signing a personal
guarantee having been told the document was fine. It deserves the heaviest test
coverage in the product, not the lightest.

**Blocked by:** 05.

**Status:** ready-for-agent

- [ ] A document with no flaggable clauses produces an explicit all-clear, not an empty result
- [ ] The all-clear lists every clause type that was checked and found absent
- [ ] No concern is ever invented to fill an empty result
- [ ] The harness includes documents known to contain at least one flaggable clause, and an all-clear on any of them fails the run
- [ ] That test set is larger and more heavily exercised than any other in the suite
