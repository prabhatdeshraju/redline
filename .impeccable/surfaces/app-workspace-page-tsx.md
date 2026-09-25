---
version: 1
slug: "app-workspace-page-tsx"
primary_target: "app/workspace/page.tsx"
related_targets: ["workspace/index.html","workspace/workspace.css","workspace/workspace.js"]
---

# App shell

**Scope:** the frame that holds the whole product — intake, result, queries, the reader's red lines, and the library. Intended route `app/workspace/page.tsx` under the settled Next.js stack; built as portable static HTML/CSS/JS under `workspace/` because no Node runtime exists on this machine.

**Visitor mode:** Operate. The reader is in a task and the tool should disappear into it. Expression lives in precise details, never in the way of the task.

## The sign-in question, resolved

The request described this surface as "behind sign-in". PRODUCT.md records the opposite, decided at init on 2026-09-23: **analysis is not gated behind auth** — upload and full analysis work anonymously, and signing in is required only to save to the library.

Resolved in favour of the recorded decision, stated to the user before building: the shell is one frame in two states. Anonymous readers get intake, result, flags, source sentences, counter-offers, queries, and session-scoped red lines. Signing in adds the library and red lines that persist between documents. Gating analysis later is a narrowing, not a rebuild, so this reading is the reversible one. If the intent was genuinely to gate analysis, PRODUCT.md changes first and this brief follows.

## The task

One document, one sitting. The reader arrives with a file or pasted text and leaves with wording to send to the other side. They are not a returning power user; most readers will do this a handful of times a year, under time pressure, and will not learn the interface. Frequency is low, stakes are high: nothing here earns a learning curve.

## What the shell holds

1. **Intake** — paste text or upload a file, parsed in the browser. Only extracted text leaves it. No OCR: a scanned or photographed document is refused as a deliberate, explained case, not an error. A terms of service upload is also a deliberate case (undecided — see below).
2. **Result** — the plain-English summary of what the document commits the reader to, then the flags in severity order, each carrying its severity rank, what the clause permits at worst, its source sentence, and its counter-offer. Then the inspection scope: all eight clause types, those found and those checked and not found.
3. **All-clear** — the result when nothing matched, shown with the full list of what was checked. Never an empty screen, never padded with manufactured flags. It is the highest-liability output the product produces and it gets the most design weight, not the least.
4. **Queries** — answers from the document only. A refusal is a first-class result with its own presentation, not an error state: "the document does not say."
5. **Red lines** — the reader's own thresholds in their own words, editable, treated as disqualifying regardless of how a clause would otherwise rank. A threshold match must be visibly distinct from a severity rank; they are different kinds of flag.
6. **Library** — opt-in, off by default, expiring, never trained on. Each document shows its own expiry. Signed-in only.

## Important states

Every one of these is a designed state, not a fallback: empty intake (teaches what a negotiable document is and what is out of scope), parsing, analysing, result, all-clear, threshold match, extraction failure (the document parsed badly and flags were dropped rather than approximated — the reader is told), refused document type, query refusal, library empty, document expiring, document expired, signed out.

Flags dropped for want of a citable source sentence are a bug, not a degraded result, and the interface says so rather than quietly showing fewer flags.

## Constraints

- No verdict anywhere. No "you'll be fine", no "don't sign this", no enforceability asserted as fact.
- Certain about what the document says; hedged about what it means. The source sentence is never softened.
- Severity is worst case, never frequency, and never a smooth gradient — a named severity rank plus a hatch mark.
- CONTEXT.md vocabulary is binding. The interface label for thresholds is "your red lines" and nothing else in the product uses that phrase.
- Restrained colour is the floor here. The landing page's Committed orange narrows to primary action, current selection and severity marks.
- Archivo and Barlow Condensed for the interface; Spectral reserved for the document's own text and every quoted source sentence.
- All document content is synthetic, authored for this build, and labelled. No invented prices, customers, counts or quotes.

## Unresolved

- What happens on a terms of service upload. Undecided in PRD.md §8; this surface is where the decision surfaces. The build shows it as a refused-document case with an explanation, which is a placeholder for a decision nobody has made.
- The library's expiry window, and whether a reader can extend it per document. The build shows an expiry without committing to a number in product copy.
- Whether risk arising from a document's **absence** of a clause can be surfaced at all, given every flag must quote a sentence.
- Whether session-scoped red lines survive an anonymous reader's reload.

## Direction contract

**THESIS:** The workspace is the survey report itself, assembling as the reader watches — the artifact handed to the other side is the artifact worked in. It refuses the two-pane AI-chat-beside-a-document arrangement this category ships, where the analysis is a conversation that vanishes rather than a record that can be sent; and it refuses the three-pane worklist, which assumes a returning power user this reader is not.

**OWN-WORLD:** DESIGN.md's world at Operate density and Restrained colour. Dyeline sheet ground, charcoal ink, hairline rules and ruled rows, no cards, no nested panels, no shadows — separation is drawn, never lifted. Orange narrows from two committed fields to three jobs only: the primary action, the current selection, and severity marks. Category green stays on inspected-and-sound. Archivo at a fixed rem scale with tabular figures throughout the interface; Barlow Condensed for ranks, headings and labels; Spectral for the document's own words. The Operate tokens this surface needs do not exist in DESIGN.md yet and are created here as a recorded system extension, not invented per-component.

**STORY:** The reader understands that their document has been inspected against a fixed published list; believes it because every flag quotes a sentence they can locate in their own copy; and leaves with counter-offer wording to send to the other side.

**FIRST VIEWPORT:** One full-width sheet in report order. Head carries the document name, date inspected, flag count, and the actions that act on the whole report — your red lines, library, and send. Then the plain-English summary of what the document commits the reader to. Then the schedule of flags in severity order, the first open, each row carrying its severity mark, what it permits at worst, its source sentence and its counter-offer. Below the fold: the inspection scope with all eight clause types and their status, the limitations of this inspection, and queries. The reader's own document opens behind any quoted sentence rather than occupying the frame by default.

**FORM:** The Report You Can Send — the surveyor's report as the working surface. Candidate 4 of 7 on my re-rolled ordered list, dealt as the lead of re-roll round 1. Seed key 499768d3, surface scope, Operate mode. The first hand — Severity Registers, The Inspection Scope rail, Schedule-first — was re-rolled by the user with the steer "first one", read as "more like the lead" and answered with a full-width stacked hand.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
