# Redline

Redline analyses a document someone is about to sign and shows them, clause by
clause, what could hurt them — each finding quoted from the document itself.

## Language

### Documents

**Negotiable document**:
A document whose terms the reader still has standing to change — a freelance
agreement, a client contract, a lease, a vendor or service agreement. Redline's
only supported input.
_Avoid_: contract (too broad — covers documents we exclude)

**Adhesion contract**:
A document offered on take-it-or-leave-it terms, where the reader's only options
are accept or walk away — terms of service, platform agreements, most consumer
finance. Out of scope; see ADR 0002.
_Avoid_: ToS, boilerplate, standard terms

### Analysis

**Flag**:
One identified risk in a document, carrying its severity and its source
sentence. The unit of Redline's output.
_Avoid_: issue, finding, alert, warning

**Source sentence**:
The sentence, quoted verbatim from the document, that a flag came from. A flag
that cannot show one is a bug; see ADR 0001.
_Avoid_: citation, quote, excerpt, reference

**Severity**:
The worst outcome a clause permits, independent of how likely that outcome is.
Flags are ranked by this and nothing else; see ADR 0003.
_Avoid_: risk score, priority, impact

**Clause type**:
One of the categories Redline searches for. The set is fixed and published, so
a reader can see what was looked for and what was not; see ADR 0003.
_Avoid_: category, clause kind, risk type

**Asymmetric risk**:
The test a clause must meet to be flagged: it shifts cost, obligation or
exposure onto the reader out of proportion to what they get back. How common
the clause is has no bearing on it.
_Avoid_: unusual, non-standard, unfair

**Counter-offer**:
Replacement wording Redline drafts for a flagged clause, for the reader to take
back to the other side.
_Avoid_: redline (collides with the product name), suggestion, edit, markup

**All-clear**:
The result when no clause type matched: reported alongside the full list of what
was checked, never as an empty screen. The highest-liability output Redline
produces; see ADR 0004.
_Avoid_: clean, pass, no issues found

**Library**:
The reader's own stored documents. Opt-in, and each document expires; it is not
a permanent archive, and the corpus is never trained on. See ADR 0005.
_Avoid_: archive, history, vault

**Threshold**:
A term the reader has declared unacceptable in advance, in their own words,
which the analysis then treats as disqualifying. The user-editable list of these
is what "your red lines" refers to in the interface.
_Avoid_: red line (ambiguous — the product, the list, and the practice of
marking up a draft are three different things), rule, preference

### People

**Reader**:
The person who uploaded the document and is being asked to sign it. Always the
weaker party to the agreement.
_Avoid_: user, client, customer, signer

**Other side**:
Whoever is offering the document — the client, employer, landlord or vendor.
_Avoid_: counterparty, opponent, them
