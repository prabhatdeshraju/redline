# 11: Reader thresholds

**What to build:** A reader writes down terms they will not accept, in their
own words — "no personal guarantee", "nothing that stops me working for other
clients in my field". A clause that crosses one is surfaced as disqualifying,
regardless of how it would otherwise rank, and the reader is told which
threshold it crossed and why.

Thresholds persist between documents, so they are written once rather than
retyped for every contract. They are editable, and the analysis can be re-run
after editing them.

A reader's own limits outrank Redline's severity ranking. The ranking is a
general judgement about worst cases; a threshold is the reader saying what
matters in their situation.

Analysis works with no thresholds set. Nobody is made to configure something
before getting value.

**Blocked by:** 04. Persistence requires an account (01).

**Status:** ready-for-agent

- [ ] A reader can write thresholds in their own words and save them
- [ ] A clause crossing a threshold is surfaced as disqualifying, above the severity ordering
- [ ] The reader is shown which threshold was crossed and by which clause
- [ ] Thresholds persist across documents for a signed-in reader
- [ ] Thresholds can be edited, and the analysis re-run against the edited set
- [ ] Analysis runs normally when no thresholds are set
