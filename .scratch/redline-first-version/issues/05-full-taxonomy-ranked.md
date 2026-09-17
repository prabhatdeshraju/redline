# 05: The full eight-type taxonomy, ranked by severity

**What to build:** A reader sees every risk Redline searches for, not one.
Flags are ranked so the most damaging appears first, and the ranking is the
same every time the same document is analysed.

The eight clause types: personal guarantees, uncapped indemnification,
non-compete and non-solicit, IP assignment and work-for-hire, limitation of
liability and remedy-stripping, termination and notice, payment terms and
nonpayment exposure, scope and change control.

Severity is the worst outcome a clause permits, independent of how likely that
outcome is (ADR 0003). A clause is flagged because it is harmful, not because
it is unusual — standard boilerplate is flagged when it transfers risk
asymmetrically, and "everyone signs this" is not a reason to stay quiet.

The taxonomy is data the product reads, not prose inside a prompt. It is
published in the interface, it drives per-type thresholds in the harness, and
it populates the checked list in 08. Three consumers means it cannot live in a
prompt string.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] All eight clause types are detected, each with its verbatim source sentence
- [ ] Flags are ranked by severity band taken from the taxonomy, not judged per document
- [ ] The same document and thresholds produce the same ordering across runs
- [ ] Several instances of one clause type are flagged separately, not merged into one
- [ ] The taxonomy is enumerated, versioned data readable by both the interface and the harness
- [ ] The reader can see the full list of clause types Redline searched for
- [ ] The harness reports recall per clause type; aggregate-only reporting is not sufficient
