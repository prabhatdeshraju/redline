---
name: Redline
description: The condition survey for a document you can still change — a dyeline sheet, charcoal ink, and safety orange owning whole regions.
colors:
  sheet: "#eceeed"
  sheet-lift: "#f6f7f7"
  panel: "#e1e5e3"
  rule: "#c4cbc9"
  rule-strong: "#9aa3a1"
  ink: "#191b1d"
  ink-2: "#4d5553"
  ink-3: "#5f6765"
  orange-field: "#c33f18"
  orange-mark: "#e0521c"
  orange-ink: "#a83513"
  green: "#1d6b4c"
  field-ink: "#ffffff"
  bar: "#e4e8e6"
  field-bg: "#f8f9f9"
  disabled-ink: "#8c9492"
  scrim: "rgba(25, 27, 29, 0.28)"
typography:
  display:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "clamp(2.3rem, 4.8vw, 3.9rem)"
    fontWeight: 700
    lineHeight: 0.93
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "clamp(1.9rem, 3.2vw, 2.9rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.005em"
  title:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "clamp(1.3rem, 2vw, 1.7rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.005em"
  body:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  quote:
    fontFamily: "Spectral, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.15rem, 1.6vw, 1.4rem)"
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: "normal"
  label:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.11em"
  micro-label:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.13em"
  figure:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.2
    fontFeature: "tabular-nums"
  op-display:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.005em"
  op-headline:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.01em"
  op-title:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.01em"
  op-quote:
    fontFamily: "Spectral, Georgia, Times New Roman, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  op-lead:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  op-body:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  op-body-sm:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  op-minor:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  op-label:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.11em"
  op-micro:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(1rem, 4vw, 4.5rem)"
  rhythm: "clamp(3.5rem, 7vw, 7rem)"
  row-y: "0.7rem"
  band-y: "0.85rem"
  field-y: "clamp(2.75rem, 6vw, 5rem)"
  cell-x: "clamp(1rem, 2vw, 1.75rem)"
  op-gutter: "clamp(1rem, 3vw, 3rem)"
  op-row-y: "0.7rem"
  op-section-y: "1.9rem"
  op-panel-pad: "1.1rem"
components:
  action-inband:
    backgroundColor: "transparent"
    textColor: "{colors.field-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0.55rem 1.1rem"
  action-inband-hover:
    backgroundColor: "{colors.field-ink}"
    textColor: "{colors.orange-ink}"
  action-lg:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.field-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0.85rem 1.5rem"
  action-lg-hover:
    backgroundColor: "{colors.orange-field}"
    textColor: "{colors.field-ink}"
  flag-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.7rem 0.25rem 0.7rem 0"
  flag-toggle-hover:
    backgroundColor: "{colors.sheet-lift}"
  schedule-band:
    backgroundColor: "{colors.orange-field}"
    textColor: "{colors.field-ink}"
    rounded: "{rounded.none}"
    padding: "0.85rem clamp(1rem, 2vw, 1.75rem)"
  source-figure:
    backgroundColor: "{colors.sheet-lift}"
    textColor: "{colors.ink}"
    typography: "{typography.quote}"
    rounded: "{rounded.none}"
    padding: "0.95rem clamp(1.35rem, 2.5vw, 2.25rem) 0.85rem"
  counter-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.7rem 0.9rem 0.75rem"
    width: "62ch"
  allclear-stamp:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    rounded: "{rounded.none}"
    padding: "0.55rem 1.05rem 0.5rem"
  op-btn:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.op-body}"
    rounded: "{rounded.none}"
    padding: "0.45rem 0.85rem"
  op-btn-hover:
    backgroundColor: "{colors.sheet-lift}"
    textColor: "{colors.ink}"
  op-btn-active:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  op-btn-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.disabled-ink}"
  op-btn-busy:
    backgroundColor: "transparent"
    textColor: "{colors.disabled-ink}"
  op-btn-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.field-ink}"
    typography: "{typography.op-body}"
    rounded: "{rounded.none}"
    padding: "0.45rem 0.85rem"
  op-btn-primary-hover:
    backgroundColor: "{colors.orange-field}"
    textColor: "{colors.field-ink}"
  op-btn-primary-active:
    backgroundColor: "{colors.orange-ink}"
    textColor: "{colors.field-ink}"
  op-btn-small:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.op-minor}"
    rounded: "{rounded.none}"
    padding: "0.3rem 0.6rem"
  op-field:
    backgroundColor: "{colors.field-bg}"
    textColor: "{colors.ink}"
    typography: "{typography.op-body}"
    rounded: "{rounded.none}"
    padding: "0.5rem 0.7rem"
    width: "100%"
  op-threshold-mark:
    backgroundColor: "{colors.orange-mark}"
    rounded: "{rounded.none}"
    size: "1.1rem"
  op-threshold-mark-sm:
    backgroundColor: "{colors.orange-mark}"
    rounded: "{rounded.none}"
    size: "0.8rem"
  op-panel:
    backgroundColor: "{colors.bar}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.op-panel-pad}"
    width: "min(38rem, 100%)"
  op-panel-head:
    backgroundColor: "{colors.bar}"
    textColor: "{colors.ink}"
    typography: "{typography.op-title}"
    rounded: "{rounded.none}"
    padding: "0.85rem 1.1rem 0.75rem"
  op-library-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.op-lead}"
    rounded: "{rounded.none}"
    padding: "0.75rem 0.6rem"
  op-library-row-current:
    backgroundColor: "{colors.sheet-lift}"
    textColor: "{colors.ink}"
  op-redline-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.op-lead}"
    rounded: "{rounded.none}"
    padding: "0.7rem 0"
  op-toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    typography: "{typography.op-body-sm}"
    rounded: "{rounded.none}"
    padding: "0.6rem 1rem"
  op-skeleton-bar:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.none}"
    height: "1rem"
---

# Design System: Redline

## Overview

**Creative North Star: "The Condition Survey"**

Redline looks like the document a surveyor hands you before you commit: a dilapidations report, a schedule of defect. One dyeline sheet, bound at its left edge by a hatched margin rule, carrying a numbered schedule of flags in charcoal ink. Every element is a ruled row on that sheet. Nothing floats, nothing is a card, nothing is tilted into perspective, and the product's own interface is never screenshotted as an image of itself — the document is the stage, at full scale.

The register is measured and forensic rather than alarming. Safety orange is the only warm thing on the page and it is **Committed**: it owns two whole regions, bleeding to the sheet's edges, and appears nowhere as a decorative accent. Severity is stated twice — a named rank in condensed caps plus a diagonal hatch whose density carries the same information — so the page never asks a reader to decode a colour. Absence is drawn as deliberately as presence: the inspection scope, the all-clear stamp, and the limitations list get the same rule weight and the same type ramp as the flags do.

This is a single committed **light** world. `color-scheme: light` is declared and there is no dark variant; the use scene is daytime, a browser, and a client waiting on a signature, not a category habit about near-black hero sections. The page refuses the arrangement this category ships: no near-black hero, no perspective app screenshot, no three-card icon row, no ranking by how common a clause is.

The same world runs at two densities. The landing page is the Persuade sheet: clamped display type and orange **Committed** to two whole regions. The workspace is the Operate sheet, built after it and recorded here: the same ground, the same inks, the same three faces, the same square corners and the same absence of shadow, but a fixed ten-step rem ramp instead of clamps, and orange narrowed to three jobs. Nothing is added to the world at Operate density except four neutral grounds the task frame needed — a panel and head ground, an input ground, a disabled ink and a flat scrim — and one new component, the threshold mark. Density changes; the world does not.

**Key Characteristics:**
- One sheet, ruled rows, zero cards and zero corner radius.
- Charcoal ink on a cool dyeline ground; orange owns regions, never accents.
- Severity double-encoded: named rank plus hatch density.
- Three type voices, strictly separated — the survey's lettering never shares a face with the document's own words.
- Flat by construction: no shadows anywhere, depth from rule weight and a single tonal lift.
- One authored motion moment, entirely from an already-visible default.
- Two densities, one world: a Persuade sheet on clamped display type, an Operate sheet on a fixed ten-step rem ramp.
- At Operate density orange has exactly three jobs, and a task surface never performs its own arrival.

## Colors

A cool photocopied-sheet neutral range, one warm signal colour held in three contrast-graded values, and a single institutional green for inspected-and-sound.

### Primary
- **Committed Field Orange** (`{colors.orange-field}`): the two whole-region orange fields only — the schedule-of-flags head band and the closing band — each bleeding past the gutter to the sheet's edges, with white lettering on top. Also the fill of the large action on hover, and the `::selection` background.
- **Safety Mark Orange** (`{colors.orange-mark}`): the survey's marking ink. Severity hatch for Highest and High, the rule and leader and caret that tie a mark to its source sentence, the `:focus-visible` outline (2px at 3px offset), and `caret-color`. This is the direction contract's named safety orange, unaltered.
- **Deep Orange Ink** (`{colors.orange-ink}`): small orange lettering on the sheet — severity rank names, links, and the label on either action once it has inverted to a white ground.

### Secondary
- **Category Green** (`{colors.green}`): inspected-and-sound only. The rotated all-clear stamp, the "Inspected · not found" ticks in the scope list, and the top-weighted border of the counter-offer box. It never carries severity and never signals an action.

### Neutral
- **Dyeline Sheet** (`{colors.sheet}`): the page ground, and the light stripe inside every severity hatch.
- **Sheet Lift** (`{colors.sheet-lift}`): the single tonal step up — the source-sentence figure's ground, and the hover state of a flag row.
- **Panel Grey** (`{colors.panel}`): the browser scrollbar track, so the chrome is themed from the sheet rather than left at system default.
- **Hairline Rule** (`{colors.rule}`): every 1px row divider and cell border.
- **Strong Rule** (`{colors.rule-strong}`): the title-block borders, the scrollbar thumb, and the diagonal hatch of the sheet's bound edge.
- **Charcoal Ink** (`{colors.ink}`): all primary lettering, the 1.5px section rules, the severity-swatch border, and the resting fill of the large action.
- **Secondary Ink** (`{colors.ink-2}`): standfirsts, body prose in supporting columns, hedge sentences, and the Medium-severity hatch and rank name.
- **Tertiary Ink** (`{colors.ink-3}`): labels, figure numbers, clause references, footnotes, chevrons.

Four neutrals created by the Operate layer, all of them ground or disabled state — no new hue enters the palette:

- **Bar Grey** (`{colors.bar}`): the ground of a side panel and its head, one step cooler than the sheet, so a panel reads as a different plane without a shadow or a radius.
- **Field Ground** (`{colors.field-bg}`): the inside of an input only. Slightly lighter than the sheet so a field reads as writable rather than as a ruled cell.
- **Disabled Ink** (`{colors.disabled-ink}`): lettering on a control that cannot be pressed yet, and on one that is busy. The only place this value appears.
- **Panel Scrim** (`{colors.scrim}`): a flat 28% charcoal veil over the sheet behind an open panel. A dimmed ground, never a shadow.

### Named Rules

**The Two-Value Orange Rule.** The orange is two values on purpose. Marks, rules, hatch, focus ring and caret use the contract's safety orange; the two whole-region committed fields step down to the deeper field orange, because white and every legible tint of white fail 4.5:1 on the safety value. This is contrast-forced, not taste, and is cited at source in `landing/redline.css:21–24`. Never unify them, and never set white text on the mark value.

**The Committed Field Rule.** Orange arrives as a region or not at all — a full-bleed band with lettering inside it. It is never a scattered accent, never a tint wash, never a border colour on a neutral row. On this Persuade surface there are exactly two such fields. On task surfaces at Operate density the same world narrows to **Restrained**: orange is permitted only on the primary action, the current selection, and severity marks. Those tokens now exist: the workspace build created the Operate layer recorded in this file (`{colors.bar}`, `{colors.field-bg}`, `{colors.disabled-ink}`, `{colors.scrim}`, the fixed ten-step rem ramp, and the threshold mark). Extend that layer for a new task surface; never re-derive one from the Persuade ramp.

**The No-Tint-Hierarchy Rule.** Inside an orange field, hierarchy comes from size, weight and tracking — never from a lighter tint of the field colour, because no tint light enough to read clears 4.5:1 against it. Label and value both sit at pure white and are told apart by 0.75rem/0.13em condensed caps against 1rem medium sentence case.

**The Double-Encoded Severity Rule.** Severity is always a named rank **and** a hatch density; colour is never the sole signal. The ranks are Highest, High and Medium — and only those words. "Category" is reserved for clause type in this product and must never number a severity.

## Typography

**Display Font:** Barlow Condensed (with Archivo, sans-serif) — 600 and 700, self-hosted static woff2.
**Body Font:** Archivo (with Segoe UI, system-ui, sans-serif) — self-hosted variable woff2, weight axis 400–600.
**Label Font:** Barlow Condensed at 600, uppercase, wide tracking.
**Document Voice:** Spectral (with Georgia, Times New Roman, serif) — 400, 500, and 400 italic, self-hosted woff2.

**Character:** Three voices with three jobs. Barlow Condensed is the survey's stencil lettering: condensed, capitalised, used for every heading, figure number, severity rank and label. Archivo is the surveyor's own prose and all tabular figures. Spectral is the inspected document speaking for itself — quoted source sentences, the hedge on what a clause means, and the counter-offer wording. All three families are self-hosted `woff2` with `font-display: swap`; nothing loads from a third-party font host and no system display face is used.

### Hierarchy
- **Display** (Barlow Condensed 700, `clamp(2.3rem, 4.8vw, 3.9rem)`, 0.93, uppercase, `text-wrap: balance`): the page's one headline, and the closing band's head at `clamp(2.1rem, 5vw, 4rem)` / 0.96.
- **Headline** (Barlow Condensed 700, `clamp(1.9rem, 3.2vw, 2.9rem)`, 1, uppercase): section heads. The schedule band's title sits one step under at `clamp(1.5rem, 2.4vw, 2.1rem)`.
- **Title** (Barlow Condensed 700, `clamp(1.3rem, 2vw, 1.7rem)`, 1.05, uppercase): the clause type on a flag row — the thing a reader scans for. Also the lettering on both actions.
- **Body** (Archivo 400, 1.0625rem / 1.55; 1rem below 48rem): all prose. Measures are capped by role — 64ch default (`--measure`), 62ch for flag and footer prose, 52ch for the standfirst, 40ch for scope and limitation notes.
- **Quote** (Spectral 400, `clamp(1.15rem, 1.6vw, 1.4rem)` / 1.42, curly quotes generated in CSS): the source sentence, at reading size, in ink at full strength. Never abbreviated, never softened, never set smaller than the surrounding prose.
- **Label** (Barlow Condensed 600, 0.8125rem, 0.11em, uppercase, tertiary ink): source citations, the key's label, column minors, the sheet number.
- **Micro-label** (Barlow Condensed 600, 0.75–0.78rem, 0.10–0.13em, uppercase): title-block and schedule-band field names.
- **Figure** (Archivo 500, 1rem, `font-variant-numeric: tabular-nums` via `.tnum`): every number a reader might compare or count — flag numbers, clause references, dates, counts, the sheet number.

One deliberate override: in the limitations grid the label role is promoted to 1.25rem at 0.035em in full charcoal, because those items are sub-headings rather than labels and need a real step above body.

### Operate Hierarchy

Task surfaces use a **fixed rem ramp of exactly ten steps, no clamps**: 0.75 · 0.8125 · 0.875 · 0.9375 · 1 · 1.125 · 1.25 · 1.375 · 1.75 · 2.125rem. This is the deliberate counterpart to the Persuade sheet's fluid display sizes: the reader of a task surface is at a consistent DPI in a browser window, and a heading that grows with the viewport inside a panel looks worse, not better, than one that holds still. The ramp reached ten steps by consolidation — the first workspace build sprawled to roughly sixteen distinct sizes, which was drift rather than a system.

- **Operate Display** (`{typography.op-display}`, uppercase): the inspected document's name in the head bar, the intake head, the all-clear stamp. Drops to 1.375rem (head) and 1.75rem (intake) below 48rem.
- **Operate Headline** (`{typography.op-headline}`, uppercase): section heads on the task sheet. Drops one step to 1.375rem below 48rem.
- **Operate Title** (`{typography.op-title}`, uppercase): flag number, clause type, panel title, and the query refusal — which is set in condensed caps at this step so "the document does not say" reads as a result and not an error.
- **Operate Quote** (`{typography.op-quote}`): the source sentence in Spectral, still the largest reading size in a flag body, with CSS-generated curly quotes. 1.125rem inline in the queries and below 48rem.
- **Operate Lead** (`{typography.op-lead}`): the plain-English summary, an asked question, a red line in the reader's own words, a library document's name, and the counter-offer wording (in Spectral at this step).
- **Operate Body** (`{typography.op-body}`): the base size. Interface prose in Archivo, button lettering in Barlow Condensed 600 at 0.055em, and the document panel's clauses in Spectral.
- **Operate Body Small** (`{typography.op-body-sm}`): supporting prose, panel leads, notes, and head-bar metadata values (500 weight).
- **Operate Minor** (`{typography.op-minor}`): clause references, captions, notes, small buttons — and, in Barlow Condensed 600 at 0.085em caps, every severity and threshold rank name.
- **Operate Label** (`{typography.op-label}`): condensed caps at 0.10–0.11em — field labels, citations, panel statuses, the button's count cell (in Archivo 500 with tracking reset).
- **Operate Micro** (`{typography.op-micro}`): head-bar field names only. The smallest lettering on a task surface.

Measures are held by role here as on the Persuade sheet: 80ch on a source figure, 78ch on a threshold line, 74ch on a notice, 68ch on summary and answer prose, 60ch in a panel, 56ch in a flag column, 52ch on a section note, 44ch on a limitation.

### Named Rules

**The Two Voices Rule.** The survey's lettering and the document's voice never share a face. Barlow Condensed and Archivo belong to Redline; Spectral belongs to the inspected document and to nothing else. That separation is the mechanism by which a reader can always tell the product's words from the document's words — legibility of authorship, not decoration — and it carries unchanged into the app shell.

**The Tabular Figures Rule.** Any figure a reader might compare, locate or count carries `.tnum`. A clause reference set in proportional numerals is a defect.

**The Caps-Are-Structural Rule.** Uppercase belongs to Barlow Condensed — headings, ranks, labels. Archivo body prose and Spectral quotations are never capitalised or letterspaced for emphasis.

**The Fixed-Ramp-At-Operate Rule.** Operate surfaces use the ten fixed rem steps above and no clamp; the clamped display ramp belongs to the Persuade sheet, where the headline is the composition. Ten is the consolidated count, not a starting point: a new Operate size is earned by consolidating two existing ones, never by appending an eleventh. Test: count the distinct `font-size` values on a task surface — if it is not ten of these ten, it is drift.

## Layout

One centred sheet, `max-width: 96rem`, `min-height: 100vh`, `overflow-x: clip`, with a 10px hatched bound edge pinned to its left (6px below 48rem). Horizontal padding is the `gutter` token; the two orange fields cancel it with a negative inline margin so they bleed to the sheet's edges while their lettering stays on the text column. Vertical separation between sections is the single `rhythm` token, and section boundaries are drawn with a `1.5px solid` charcoal rule — never with space alone.

Within the sheet every block is an explicit grid rather than a flow of boxes. The hook runs 1.25fr / 1fr; the scope and all-clear sections run a fixed 22rem rail beside a fluid column; the flag body runs 1.12fr / 1fr; the limitations run three equal columns over exactly six items, so both rows are complete and no cell dangles. Rows are ruled top and bottom with the hairline and share a 0.7rem vertical padding, which is what gives the schedule its regular beat.

Two breakpoints, both in rem. At **62rem** the two-column grids collapse to one, the title block loses its left border, and the limitations drop to two columns with their border logic re-derived. At **48rem** the base size steps to 1rem, the title block unwraps into borderless stacked cells, the in-band action goes full width with label and arrow pushed apart, the flag toggle re-flows into named grid areas (`num sev chev` / `type` / `ref`), the source figure's derived gutter pins to 1.7rem, and scope-row status labels wrap onto their own row so the sheet never forces horizontal scroll at 390px.

**The Derived Clearance Rule.** The source figure's leader lives in its left gutter, so that gutter is a local custom property (`--source-pad`) the leader positions against. Clearance around a mark is derived from one declared value, never eyeballed twice.

The workspace runs the same sheet at Operate density: `max-width: 96rem`, the hatched 10px bound edge still pinned to its left, and a narrower gutter (`{spacing.op-gutter}`) because the task frame carries more rows than a Persuade page does. The document head is a ruled bar across the top of the sheet — identity and document name to the left, a `<dl>` of micro-labelled metadata cells beneath it, whole-report actions to the right — closed by a 1.5px charcoal rule. Report sections are separated by the hairline at `{spacing.op-section-y}` of vertical padding rather than by the Persuade `rhythm` token; the sheet is denser on purpose.

Two recurring Operate grids: a **head rail** of `minmax(0, 15rem)` beside a fluid column, used by the summary, the extraction notice and the queries so that section heads line up down the left of the sheet; and **auto-fit column sets** (`repeat(auto-fit, minmax(min(100%, 17–23rem), 1fr))`) for the key, the flag columns and the limitations, so a cell never dangles. Rows keep the shared `{spacing.op-row-y}` vertical padding, which is what makes the schedule beat identical across both surfaces. Panels are `min(38rem, 100%)` pinned to the right edge, full width below 48rem.

Two breakpoints, both in rem. At **68rem** every head rail collapses to one column and the intake's two-column split stacks. At **48rem** the head bar's actions go full width and equal, section heads drop a step, the flag row re-flows into the same named grid areas the Persuade sheet uses (`num sev chev` / `type` / `ref`), scope-row statuses move under their row, and a panel loses its left border and fills the viewport.

## Elevation & Depth

There are **no shadows in this system at all** — not ambient, not structural, not on hover, not on focus. `box-shadow` appears nowhere in the stylesheet, and adding one would break the world: a photocopied survey sheet has no light source. Depth comes from three devices instead — rule weight (1px hairline for rows, 1.5px charcoal for sections, 2–2.5px for the stamp and the counter-offer's top edge), one tonal lift from the sheet to the lift value for the source figure and row hover, and hatch density. The orange fields read as forward not because they are raised but because they bleed past the sheet's margins and carry a 5px black hatch strip on their inner edge.

### Named Rules

**The Ruled-Not-Raised Rule.** Separation is drawn, never lifted. A new surface that needs a boundary gets a rule at the weight its level deserves; one that needs to feel closer gets the tonal lift or a hatch. Never a shadow, never a glow, never a backdrop blur.

**The Scrim-Is-Not-A-Shadow Rule.** An open panel is separated by a 1.5px charcoal rule on its leading edge and a flat 28% ink scrim over the sheet behind it. The scrim has no blur, no offset and no spread, and it never gains one. Verified in the Operate build: `box-shadow`, `filter` and `backdrop-filter` appear nowhere in `workspace/workspace.css`, and neither does `border-radius`.

## Shapes

Every corner is square. `border-radius` is declared nowhere in the artifact, and the `rounded.none` token exists to record that as a rule rather than an omission — actions, the title block, the source figure, the counter-offer box, severity swatches and the all-clear stamp are all hard-cornered rectangles.

The recurring geometry is the survey's own line-work, at a consistent -45° across the whole sheet: the bound edge (strong rule, 1px on 7px), the hatch strips on both orange fields (`rgba(0,0,0,0.42)`, 2px on 7px), and the three severity swatches, whose duty cycles **are** the severity scale — 4px on 7px for Highest, 2px on 9px for High, 1px on 12px for Medium, the first two in mark orange and the third in secondary ink. Each swatch carries a 1px charcoal border and measures 2.25 × 1.5rem inline, enlarged to 3.25 × 1.7rem in the key where the scale is taught.

Two further authored forms: the leader — a 1px vertical mark-orange line with a 0.7rem foot, tying the caret to the sentence it annotates — and the all-clear stamp, a doubled green border (2.5px plus a 1px outline at 3px offset) rotated -2.5°, which is the survey world's own rubber stamp rather than an arbitrary tilt.

Icons are inline SVG with square caps and 1.6–2px strokes: a chevron, the caret, a tick. There is no icon font and no glyph-character icon anywhere.

The Operate layer adds one form to this vocabulary: the **threshold mark**, a solid mark-orange square with a 1px charcoal border, at 1.1rem in flag bodies, the red-lines panel and the key, and 0.8rem on a collapsed flag row or scope row. It is deliberately *not* hatched. Hatch density is the severity scale, and a threshold is not a rank — it is the reader's own declared unacceptable term, disqualifying regardless of how the clause would otherwise rank (PRODUCT.md capability 7). Solid against hatched is the whole distinction, and it is carried in shape rather than in colour alone: a screen-reader-only sentence ("Matches one of your red lines") rides beside every instance via the `.u-sr` utility.

**The Threshold-Is-Not-A-Rank Rule.** Hatched means ranked; solid means disqualifying. A threshold mark is never hatched, never given a duty cycle, never enlarged into a fourth severity swatch, and never placed among the rank rows of the key — in the Operate key it spans beneath them under its own rule.

## Components

### Actions

There is exactly one action on this page, expressed in two placements, and no secondary conversion anywhere.

- **Shape:** square (`{rounded.none}`), 1.5px border in `currentColor`, with a CSS-drawn 0.85em arrow built from two borders rotated 45°.
- **In-band:** sits at the right end of the orange schedule head — transparent on the field, white lettering, white 1.5px border, `0.55rem 1.1rem`. Hover and `:focus-visible` invert it to a white ground with deep orange ink; the arrow advances 0.15em. Full width, label and arrow pushed apart, below 48rem.
- **Large:** closes the page inside the second orange field — charcoal fill, white lettering, `0.85rem 1.5rem` at `clamp(1.1rem, 1.6vw, 1.4rem)`. On the sheet it turns field orange on hover; inside the orange field it inverts to white with deep orange ink instead, so the state change is always a real contrast change rather than orange on orange.
- **Transitions:** 180ms on background and colour, 180ms on the arrow, all on `--ease` (`cubic-bezier(0.16, 1, 0.3, 1)`).

### Flag Row (signature component)

A ruled row that is also the disclosure control. The whole row is a `<button>` inside its heading, hairline-ruled top and bottom, laid out as a five-column grid: figure number (Barlow Condensed 700, 1.6rem, tertiary ink) · severity mark · clause type · clause reference · chevron. Hover raises the row ground to the lift neutral; the chevron rotates 180° in 200ms when expanded. The lead flag ships open. Below 48rem the row re-flows to three stacked grid areas so the clause type gets its own line.

### Severity Mark

An inline pair: a hatched swatch with a 1px charcoal border, then the rank name in Barlow Condensed 600 caps at 0.085em tracking — deep orange ink for Highest and High, secondary ink for Medium. The pair is atomic: the swatch never appears without its name and the name never appears without its swatch. It recurs unchanged in the flag row, the scope list and the key.

### Source Sentence

The evidence block: a `<figure>` on the lift neutral, hairline-ruled top and bottom with a 2px mark-orange rule laid over its top edge, the caret breaking that edge at the leader's column, the leader running down the left gutter, the sentence in Spectral with CSS-generated curly quotes, and a citation label ruled off beneath. It is the one block whose content is never truncated, never collapsed away by animation, and never set below reading size.

### Counter-offer Box

Spectral at 1.0625rem in a 62ch ruled box — 1px green border with a 2px top edge, no fill. The green marks it as the artifact to send on; the ruling marks it as quotable wording rather than prose.

### Title Block

A `<dl>` of ruled cells along the masthead's right, borders in the strong rule, micro-labels over 1rem medium values, carrying document class, method and ranking basis. Below 48rem it unwraps into borderless stacked cells.

### Key to the Marks

The teaching block: a 1.5px charcoal rule, a caps label, then one ruled row per rank pairing an enlarged swatch with its plain-language definition, closed by a note stating that rank is worst case and never frequency. Any surface that shows a severity mark must be able to reach a key like this one.

### Browser Surfaces

The chrome is themed from the palette rather than left at system default: `::selection` is field orange on white, `caret-color` is mark orange, `scrollbar-color` is strong rule on panel grey, `:focus-visible` is a 2px mark-orange outline at 3px offset. The skip link is charcoal on sheet and reveals itself on focus.

### Motion

One authored moment — "the strike" — five staggered keyframes on the lead flag only, inside `@media (prefers-reduced-motion: no-preference)` and gated on a `.js` class: the mark-orange rule draws out from `scaleX(0)`, the leader drops in, the caret strikes down, the hatch fills, the figure number writes in. Total span under 1.2s. Flag expansion is a 260ms height transition (220ms closing), skipped entirely under reduced motion.

**The Already-Visible Rule.** Every animation begins from a state in which the content is already visible and readable. Nothing content-bearing is ever clipped, hidden or faded from zero by motion, and no text depends on a keyframe running to be legible. An earlier revision of this build hid the source sentence when the animation did not run; that is the failure this rule exists to prevent. Test: disable JS and CSS animation — every word must still be on the page.

**The Open-Without-JS Rule.** Without JavaScript every flag is open and fully readable. JS only adds the collapse behaviour and the one-open-at-a-time discipline. Disclosure is an enhancement; it is never the condition of reading the evidence.

### Operate Controls

The task surface's button family, one step quieter than the Persuade action: condensed caps at the base step, 0.055em tracking, a 1px strong-rule box, `0.45rem 0.85rem`, square. **Default** is charcoal lettering on the sheet; **hover** takes the tonal lift and a charcoal border; **active** takes panel grey; **disabled** and **busy** both drop to disabled ink on a hairline border, differing only in cursor. **Primary** — one per surface, the action on the whole report — is charcoal-filled with white lettering, turning field orange on hover and deep orange ink on press. A **count cell** may ride inside a button: Archivo 500 at the label step, tracking reset, deep orange ink, ruled off by a hairline on its left. Transitions are 170ms on background, border and colour.

### Field

An input on the field ground with a 1px strong-rule border, `0.5rem 0.7rem`, square, full width of its row. Placeholders are tertiary ink. Focus is the mark-orange ring at **zero** offset plus a mark-orange border, so the ring reads as part of the field rather than around it. `aria-invalid` turns the border field orange; a textarea variant resizes vertically only and sits one step down at the small body size.

### Side Panel

The reader's red lines, their library and their own document are panels at the sheet's right edge, not pages: bar-grey ground, a 1.5px charcoal left border, a ruled head carrying the panel title at the title step and a square 1px close control, and a scrolling body at `{spacing.op-panel-pad}`. Each is `role="dialog"` with `aria-modal="true"` and labelled by its own head. Opening one traps Tab inside it, moves focus to its head, locks the sheet's scroll (`body.is-locked`), and lays the scrim over everything behind; Escape closes it and focus returns to the control that opened it.

### Library Row

One saved document per hairline-ruled row, the whole row a button: name at the lead step, metadata and its own expiry at the minor step in tertiary ink, an expiry that is close in deep orange ink. Hover takes the tonal lift. The current document is marked by a mark-orange left rule plus the lift ground — orange's second job, the current selection.

### Red-line Row

The reader's own threshold in their own words at the lead step, its status in condensed caps (deep orange ink when matched, green when not found in this document), a threshold mark ahead of it when matched, and a small underlined text control to remove it. Matched and unmatched rows use different column templates rather than a placeholder cell, and both collapse to a single column below 48rem.

### Analysing State

Waiting is named, not spun: three checkbox-square steps — extracting text in the browser, checking the eight clause types, matching your red lines — that advance one at a time (650ms each; 220ms under reduced motion), the active square filling mark orange and a finished one green, over panel-grey skeleton bars at 1, 2 and 3rem. The bars pulse 0.55→1 opacity over 1400ms only inside `prefers-reduced-motion: no-preference`. The region is `aria-live="polite"`.

### Toast

A confirmation of something the reader just did: charcoal ground, sheet-coloured lettering at the small body step, square, centred at the bottom of the viewport, dismissing itself after 4.5s. It never carries an error and never carries orange.

### Operate Motion

**The No-Entrance-At-Operate Rule.** The strike is Persuade-only and is deliberately absent from task surfaces. Operate motion is functional and short: 170ms on a state change (background, border, colour), 200ms on a disclosure chevron, 650ms per named progress step, 1400ms on the skeleton pulse. A task surface never performs its own arrival, and nothing content-bearing waits on a keyframe here either — The Already-Visible Rule holds unchanged.

## Do's and Don'ts

### Do:
- **Do** build every new block as a ruled row or ruled cell on the one sheet, boundaries drawn with the hairline (1px `{colors.rule}`) and section breaks with `1.5px solid {colors.ink}`.
- **Do** use the mark orange for marks, rules, hatch, caret and focus, and the field orange for whole regions with white lettering on them — and keep both values as they are.
- **Do** encode severity twice: a named rank in Barlow Condensed caps plus a hatch swatch at one of the three published duty cycles (4/7, 2/9, 1/12).
- **Do** name the ranks Highest, High and Medium, and use the product's own words elsewhere too — a **flag**, its **source sentence**, an **all-clear**, a **clause type**.
- **Do** set every quoted sentence and every hedge in Spectral, and everything the product itself says in Archivo or Barlow Condensed.
- **Do** carry `.tnum` on every figure a reader might compare or locate.
- **Do** derive clearance around a mark from a declared custom property, as the source figure derives its gutter from `--source-pad`.
- **Do** theme browser surfaces — selection, caret, scrollbar, focus ring — from the palette on any new page.
- **Do** start every animation from an already-visible, already-readable default, and make the page complete without JavaScript.
- **Do** narrow orange to primary action, current selection and severity marks on Operate-density task surfaces, keeping this palette and these three faces.
- **Do** set every Operate surface on the fixed ten-step rem ramp and earn a new step by consolidating two, never by appending an eleventh.
- **Do** mark a threshold match with a solid orange block and a 1px charcoal border — full size in bodies, panels and the key, small on any collapsed row, so a match is visible before the flag is opened.
- **Do** keep Operate motion functional: 170ms on a state change, 200ms on a disclosure chevron, a named stepped wait, no authored entrance.
- **Do** make an overlay accountable: `role="dialog"`, `aria-modal`, Tab trapped, Escape closing, focus returned to the opener, and `body.is-locked` while it is open.
- **Do** carry `.tnum` onto task surfaces too — flag numbers, clause references, counts, dates, expiries — and put a `.u-sr` sentence beside every mark that carries meaning.

### Don't:
- **Don't** introduce a card, a rounded panel, or a nested container. Radius is `0` everywhere in this system.
- **Don't** add a `box-shadow`, glow or backdrop blur to convey depth. Use rule weight, the single tonal lift, or hatch density.
- **Don't** build hierarchy inside an orange field from a lighter tint of that orange — no tint that reads clears 4.5:1. Use size, weight and tracking.
- **Don't** scatter orange as a decorative accent, a tint wash, or a border on a neutral row. It owns a region or it is a mark.
- **Don't** let colour alone carry severity, and don't render severity as a smooth gradient.
- **Don't** use "finding" for a flag, "red line" for a threshold outside the interface label "your red lines", or "category" for anything but clause type.
- **Don't** set a source sentence smaller than the surrounding prose, truncate it, soften its wording, or let any animation or collapse state hide it.
- **Don't** add a fourth type family, and don't set the product's own lettering in Spectral or the document's quoted words in Archivo or Barlow Condensed.
- **Don't** load fonts from a third-party host or fall back to a system display face; all three families are self-hosted woff2 with `font-display: swap`.
- **Don't** add a dark variant. This is a single committed light world (`color-scheme: light`) chosen from the use scene; there is no dark counterpart to inherit.
- **Don't** invent app-shell tokens. The Restrained step-down has landed as the recorded Operate layer — extend it, and don't re-derive a task surface from the Persuade ramp.
- **Don't** clamp a font size on an Operate surface, and don't carry the Persuade clamped display ramp into a task frame.
- **Don't** hatch a threshold mark, rank it, or let it share a shape with a severity swatch. Hatch means rank; a threshold has none.
- **Don't** replay the strike, or any authored entrance, on a task surface.
- **Don't** let the panel scrim acquire a blur, offset or spread, and don't reach for a shadow when a panel needs separating — it gets a 1.5px charcoal rule.
- **Don't** spend orange on an Operate surface outside its three jobs. A hover state, a border on a neutral row, a background tint: those are ink, rule or ground.

### Known Issues in the Operate Build (recorded, not canonized)

These are defects and deviations the shipped workspace carries. None of them is a rule, and no future surface should inherit any of them.

- **Font paths will not survive the port.** `workspace/fonts.css` loads all six faces from `../landing/fonts/*.woff2`. That relative path resolves only in the static two-folder build and breaks the moment this surface becomes `app/workspace/page.tsx`; the faces need to move to `public/fonts/` or `next/font/local` as part of the port. Flagged by the finish reviewer; not fixed.
- **The leader and caret are missing from the workspace source figure.** It keeps the lift ground, the 2px mark-orange top rule and the ruled citation line, but drops the leader-and-caret form and its `--source-pad` derived clearance, which this file names as an authored form of the world. That is an omission in the build, not an Operate rule — The Derived Clearance Rule stands unchanged and the form should return on the port.
- **Severity swatch drift.** The workspace draws the swatch at `2.1 × 1.4rem` against the recorded 2.25 × 1.5rem, and its key does not enlarge the swatch the way the Persuade key does. The recorded values are unchanged; the workspace numbers are drift, not a second size.
- **The library row's selection rule is thinner than the system's.** Its 2px left border is overridden to 1px by a later duplicate declaration, so it reads lighter than the flag row's 2px selection rule. Reported, not repaired.
- **Untokenized white and a 300ms outlier.** Pure white appears as literal `#fff` in three places although the palette carries it as `{colors.field-ink}`, and the cited-clause highlight transitions at 300ms, above the 170–200ms Operate band. Both are source inconsistencies, not new tokens.
