---
version: 1
slug: "landing-index-html"
primary_target: "landing/index.html"
related_targets: ["landing/redline.css","landing/redline.js"]
---

# Landing page

**Scope:** the public marketing page at `/`, built as `landing/index.html` + `landing/redline.css` + `landing/redline.js`. No Node runtime exists on this machine, so the settled Next.js stack could not be scaffolded; this is portable markup and CSS to be moved into `app/page.tsx` unchanged.

**Visitor mode:** Persuade.

## Audience and job

A freelancer, independent contractor or small business owner who has a document in front of them that they still have standing to change, and a client, vendor or landlord waiting on a signature. No lawyer, no legal budget, under time pressure. They have probably been burned before — unpaid invoices, scope creep — and they have probably already seen an AI contract tool that they did not believe.

They arrive sceptical. The page's job is not enthusiasm; it is demonstrating something they can check.

## Action

One action, repeated twice on the page and nowhere else: bring your own document. No secondary conversion, no newsletter, no demo booking.

## Proof and content

Proof is the mechanism shown working, not a claim about it. The page demonstrates one document becoming a numbered schedule of flags, each flag quoting the exact sentence it came from, closing with the full inspection scope including what was checked and not found.

All document content on the page is **synthetic** — an authored freelance services agreement written at full fidelity for this purpose, labelled as an example. To be replaced with real material, or kept and labelled, before launch.

## Constraints

- No verdict. Nothing on the page tells the visitor whether to sign, and no enforceability is asserted as fact. Certain about what the document says, hedged about what it means (ADR 0004).
- No invented prices, customers, testimonials, logos, benchmarks or counts. None exist (PRODUCT.md, Evidence on Hand).
- Only the document types PRD.md serves: negotiable documents. No terms of service, no adhesion contracts, no scanned or photographed documents, no OCR.
- Severity is worst case, never frequency, and it is never rendered as a smooth gradient — it is a named severity rank plus a hatch mark, so colour is never the sole signal.
- Every flag on the page shows its source sentence. A flag without one is not displayed.
- The vocabulary in CONTEXT.md is binding: reader, flag, source sentence, severity, clause type, counter-offer, all-clear, threshold, other side. Never "issue", never "red line" for a threshold outside the interface label "your red lines".

## Memorable moment

The strike: the caret landing in the document's own sentence and the flag writing itself into the schedule in rank order. One authored moment, from an already-visible default.

## Unresolved

- Price and packaging are undecided, so the page names no price and no plan. The action leads to the product, not to a checkout.
- The example document is synthetic and labelled; whether launch uses a real document is open.
- The action points at the workspace (`../workspace/index.html` locally). That relative path is a local-file convenience: on the Next.js port both instances become `/workspace`, the route the app shell brief names.

## Direction contract

**THESIS:** Redline as the condition survey a surveyor hands you before you commit — every flag ranked by what the clause permits at worst, each one evidenced by the document's own sentence, the schedule closing with the full scope of what was inspected and found sound. It refuses the arrangement this category always ships: near-black hero, the app screenshotted and tilted in perspective, a three-card icon row, ranking by how common a clause is.

**OWN-WORLD:** Cool dyeline sheet (#eceeed) as ground with charcoal ink (#191b1d); safety orange (#e0521c) is Committed, owning whole regions — the schedule head band, the severity markers, the action field — never scattered as an accent. Category green (#1d6b4c) carries inspected-and-sound. Diagonal hatch and hairline rules from the survey sheet; no cards anywhere, every element is a ruled schedule row. Barlow Condensed in caps for schedule headings and severity markers, Archivo for labels and tabular figures, Spectral for the document's own quoted sentences — the survey's lettering and the document's voice never share a face.

**STORY:** The visitor understands that a document they can still change becomes a numbered schedule of flags ranked by worst case. They believe it because the source sentence is on screen to check against their own copy, and because what was *not* found is shown at the same weight as what was. They do one thing: bring their own document.

**FIRST VIEWPORT:** Full-bleed dyeline sheet, no nav bar. Product name in condensed caps top-left with one line saying what this is. Then the survey head: a full-width safety-orange band carrying SCHEDULE OF FLAGS with the document's name, the date inspected and the flag count, the primary action set in its right end. Immediately beneath, flag 01 open at full size — severity marker, the clause named, what it permits at worst hedged, the source sentence in Spectral at reading size with a caret marking where it was found, and the counter-offer wording in a ruled box below it. Flags 02 and 03 as collapsed ruled rows with their severity marks visible. The inspection scope and the second instance of the action sit below the fold.

**FORM:** The Condition Survey — dilapidations reports and schedules of defect. Candidate 1 of 7 on my ordered grounded list and my top-ranked candidate, chosen by the user as IMPECCABLE'S PICK over the roll's assignment of candidate 7, The Marked Proof. Seed key 9575ff6b. Raised by the five declined challengers: absence drawn as deliberately as presence, so the inspection scope carries real weight; the document is the stage, at full scale, never a screenshot; severity encoded twice, as named rank and hatch mark; lead with the one clause whose presence changes everything rather than a row of equals; one flag fully open at a time.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
