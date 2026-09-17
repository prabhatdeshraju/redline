# 10: Grounded question answering

**What to build:** A reader asks a question about their document in their own
words and gets an answer drawn only from the document, quoting the passage it
rests on. When the document does not answer the question, Redline says so
rather than inferring, guessing, or answering from general legal knowledge.

Refusal is the feature, not a failure mode. Readers of existing AI review tools
say they cannot trust them, and the reason is that a confident fabrication and
a real answer look identical. A refusal is how Redline stays checkable.

A question that presupposes a term the document does not contain gets its
premise corrected, rather than an answer that plays along.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] A reader can ask a question about the document in their own words
- [ ] Answers rest only on the document, and quote the passage they rest on
- [ ] A question the document does not answer produces an explicit refusal, not an inference
- [ ] A question presupposing an absent term has its premise corrected
- [ ] The harness tests three question classes: answerable from the text, answerable only from outside knowledge, and adversarially presupposing an absent term
- [ ] The second and third classes must refuse; refusal is the pass condition
