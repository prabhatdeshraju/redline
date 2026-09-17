# 12: Library — opt-in, listed, deletable, expiring

**What to build:** A reader can choose to save a document and its analysis, see
what they saved before, delete any of it immediately, and rely on it expiring
on its own. Saving is off unless they turn it on, and before they turn it on
they are told what is retained and for how long.

Saving and expiry ship together. A library without expiry retains people's
contracts forever, which is the exact outcome ADR 0005 exists to prevent, so
this is one ticket rather than two.

The constraint that shapes the schema: a citation is valid only against the
extraction it was made from, so a saved analysis has to retain the **full
document text**. Storing flags and their quoted sentences alone is not
possible. Two consequences follow:

- An analysis references the exact extraction it came from. Re-parsing a
  document later produces a new extraction and does not silently re-point
  existing flags at it.
- Expiry removes the text and the analyses derived from it together. A flag
  cannot outlive the text it quotes, because a flag that cannot show its source
  is a bug (ADR 0001).

The corpus is never used to train or evaluate a model, and the reader is told
so.

**Blocked by:** 04. Requires an account (01).

**Status:** ready-for-agent

- [ ] Saving is off by default and requires a deliberate action
- [ ] Before saving, the reader is told what is retained and for how long
- [ ] A reader can see their previously analysed documents and reopen one
- [ ] A reopened analysis still shows its verbatim source sentences
- [ ] A reader can delete a document immediately and completely
- [ ] Stored documents expire automatically, and their analyses expire with them
- [ ] Anonymous analysis stores nothing
- [ ] The interface states that saved documents are never used to train a model
- [ ] **Blocked on a decision:** the expiry window is undecided (ADR 0005). Do not choose a number — ask.
