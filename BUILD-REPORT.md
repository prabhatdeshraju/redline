# Build report — Redline first version

Run started 2026-09-26. Orchestrated build of the twelve tickets under
`.scratch/redline-first-version/issues/`.

**This file is written as the build runs.** If the run died, the ticket table
below is the resume point: start at the first ticket that is not `done`.

---

## Read this first when you sit down

```bash
# 1. Put the portable toolchain on PATH (see Decision 1 — there is no system Node)
export PATH="/c/Users/Serenity 17/AppData/Local/redline-toolchain/node:$PATH"
node --version   # expect v24.21.0

# 2. From the repo root
npm install
npm run typecheck
npm test
npm run build
npm run smoke    # runs the fixture contract through the real pipeline

# 3. Start it
npm run dev
```

---

## Ticket status

| # | Ticket | Status | Note |
|---|--------|--------|------|
| — | Next.js scaffold + landing port | **done** | Next 16 / React 19 / Vitest 5. Landing verified identical by node-by-node DOM diff (382 nodes, 2 intended href changes). Commit `6241204` |
| — | Labelled fixtures | **done** | 3 fixtures; citation invariant independently verified. Commit `925c164` |
| 01 | Project foundation and auth | **done** | 4 of 6 criteria met; Vercel + Supabase reachability unverified (no projects exist). Commit `b841299` |
| 02 | Upload and extract in the browser | **done** | All 7 criteria met. 2 runtime dependencies installed, 0 devDependencies. |
| 03 | Labelled corpus and citation harness | not started | |
| 04 | First flag with source sentence | not started | |
| 05 | Full taxonomy ranked | not started | |
| 06 | Plain-English summary | not started | |
| 07 | Adhesion contract refusal | not started | |
| 08 | All-clear with checked list | not started | |
| 09 | Counter-offers | not started | |
| 10 | Grounded question answering | not started | |
| 11 | Reader thresholds | not started | |
| 12 | Library, opt-in and expiring | not started | |

---

## Decisions taken in your absence

### 1. Installed a portable Node toolchain outside the repo

**Found:** this machine had no Node, npm, npx, nvm, fnm, volta, scoop or
chocolatey. Every verification step the build brief requires — `npm run build`,
`npm test`, `npm run smoke`, typecheck — was unrunnable, and there was no way to
scaffold Next.js. This blocked all twelve tickets, not some of them.

**Did:** downloaded the official Node 24.21.0 LTS Windows zip and extracted it
to `C:\Users\Serenity 17\AppData\Local\redline-toolchain\node`.

**Why this way:** it needs no administrator rights, writes nothing to the
registry, changes no system or user PATH, and touches nothing inside the repo.
Removing it is `rm -rf "$env:LOCALAPPDATA\redline-toolchain"`. A `winget install`
would have been a machine-wide change you did not ask for.

**What it costs you:** the toolchain is not on your PATH by default. Every
terminal needs the `export PATH=...` line above first. If you would rather have
Node installed properly, `winget install OpenJS.NodeJS.LTS` and then delete the
toolchain folder — nothing in the repo refers to it.

### 2. The model pin conflict is resolved in favour of your instruction

`CLAUDE.md` pins the model to `anthropic/claude-opus-5` and says to ask before
changing it. Your build brief says to use whatever `OPENROUTER_MODEL` holds, via
OpenRouter's OpenAI-compatible endpoint, with the provider pinned to fireworks,
`allow_fallbacks: false`, `require_parameters: true`, reasoning effort low, and
structured JSON output — and never to write a model id into code.

I took your brief as the answer to the question `CLAUDE.md` asks, because that
is what it said it was. `.env.local` currently holds
`OPENROUTER_MODEL=z-ai/glm-5.3-flash`.

**Left for you:** `CLAUDE.md` still says `anthropic/claude-opus-5`. The repo now
disagrees with itself. Either update that line or set `OPENROUTER_MODEL` back —
I did not edit `CLAUDE.md`, because a settled decision is yours to change.

### 3. There is no humanizer skill in this environment

Your brief says all reader-facing copy goes through the humanizer skill "as
CLAUDE.md requires". `CLAUDE.md` does not mention a humanizer, and no such skill
is available to me here — the only skills present are unrelated.

**Did:** wrote reader-facing copy directly against the constraints that do
exist and are binding — `CONTEXT.md`'s vocabulary, ADR 0004's voice rule (flat
about what the document says, hedged about what it means, never a verdict), and
the copy rules already proven in `DESIGN.md` and the shipped landing page.

**Left for you:** if the humanizer skill exists elsewhere, every string a reader
sees still needs a pass through it. They are concentrated in the React
components under `app/` and in the analysis boundary's refusal messages.

### 4. Vitest is the test runner

`CLAUDE.md` says to ask before adding a dependency. You were not here, and a
test runner is not optional — the build brief defines "finished" as `npm test`
passing, and the spec's central gate is a test.

Chose Vitest over Jest: it needs no Babel configuration with TypeScript, starts
fast enough that the citation gate can run on every save, and is the common
default alongside Next.js now. Added with `@vitejs/plugin-react` and `jsdom`.

### 5. The "adhesion contract with planted clauses" fixture was split in three

Your step 3 asked for two fixtures, one of them "an adhesion contract with at
least four planted clauses … and its expected severity band".

That document cannot exist in this product. ADR 0002 makes an adhesion contract
a **refusal**, not an analysis — Redline never flags one, because a counter-offer
has nobody on the other side who could accept it. A fixture that was both
adhesion and expected to yield ranked flags would have been testing behaviour
the product is designed not to have.

**Did:** built three fixtures instead of two —
`tests/fixtures/negotiable-flagged.*` (a negotiable agreement carrying the six
planted clauses and their bands), `tests/fixtures/clean.*` (genuinely clean, the
all-clear fixture), and `tests/fixtures/adhesion.*` (take-it-or-leave-it terms,
which ticket 07 uses to test the refusal).

This reads the intent as "a contract with planted clauses, plus a clean one,
plus the adhesion case the spec needs anyway". If you actually wanted the
planted clauses inside the adhesion document, ticket 07 and ADR 0002 need
revisiting first.

### 6. Kept the block `next dev` appends to CLAUDE.md

Next 16 writes a `<!-- BEGIN:nextjs-agent-rules -->` block into `CLAUDE.md` on
every `next dev` run, from `node_modules/next/dist/server/lib/generate-agent-files.js`.
No opt-out flag exists.

**Kept and committed it.** Its content is worth having — it warns that Next 16
diverges from model training data and points at the local docs in
`node_modules/next/dist/docs/`, which is true and which I have put into every
subagent brief since. Removing it would only produce an uncommitted diff that
returns on the next dev run.

**Left for you:** it is your standing-instructions file, so if you want it gone,
delete the block and accept the recurring diff, or pin Next below 16.

### 7. Repointed `workspace/fonts.css`

Moving the landing page into the app deleted `landing/fonts/`, which
`workspace/fonts.css` referenced with `../landing/fonts/*.woff2`. The six faces
now live in `public/fonts/`, so those URLs point at `/fonts/` instead.

`DESIGN.md` line 553 had already recorded this exact move as the port fix, so
this is the documented change rather than a new decision. Note that
`workspace/index.html` is a **static design reference**, not a route — opening
it directly from the filesystem will no longer find the fonts, because they now
resolve from the running app. The real screens are what tickets 02–12 build.

### 8. Approved four dependencies for extraction without asking

`CLAUDE.md` says to ask before adding a dependency. You were not here, and
ticket 02 cannot be built without a PDF and a DOCX parser.

Approved: **`pdfjs-dist`** (Mozilla's parser, the only credible browser-side PDF
text extractor, and it exposes the text-layer information needed to detect a
scan) and **`mammoth`** for DOCX. For generating binary test fixtures only, and
as devDependencies, `pdf-lib` and `jszip`.

Anything beyond those four, the subagent was told to stop and report rather than
install.

**Only two were needed.** `pdfjs-dist` 6.3.289 and `mammoth` 1.13.0 are
installed as runtime dependencies. `pdf-lib` and `jszip` were **not**
installed: the binary fixtures are written by a committed one-off script,
`tests/fixtures/build-binary-fixtures.mjs`, which assembles a PDF and a zip
from `node:zlib` and about eighty lines of arithmetic. The generated files are
committed; nothing in the suite runs the script.

One consequence worth recording: pdf.js is loaded from its **legacy** build,
in the browser as well as in the suite. Its default build calls
`Uint8Array.prototype.toHex`, which Node 24 and released Safari and Firefox do
not have. Selecting the build per environment would have meant the suite
exercised a different parser than the one that ships, which for the module that
owns ADR 0001's guarantee is not a trade worth making. The worker is served from
`public/pdfjs/`, and a test fails if that copy ever drifts from the installed
package.

### 9. Set the document length limit at 250,000 characters

The ticket requires a too-long document to be refused clearly rather than
truncated, and names no number. The spec's undecided list does not cover it, so
this is mine rather than one of the five you reserved.

Chose 250,000 **characters** — roughly 60k tokens, which leaves room for the
analysis prompt and the response inside a typical context window. Counted in
characters rather than bytes or pages because that is what actually bounds the
model call. It is one named exported constant with the reasoning beside it, and
overridable by environment variable so it can be tuned without a code change.

**Left for you:** if you know the real context budget of the model you settle
on, this is a one-line change.

### 10. Normalise ligatures, but never quotes

Extraction decomposes `ﬁ ﬂ ﬀ ﬃ ﬄ` to their ASCII sequences, because a reader
searching their own copy types `fi`, not the ligature. It does **not** normalise
curly quotes or apostrophes, because those appear in the reader's document as
typed — and the fixture corpus deliberately contains one (U+2019 in clause 13.2
of `negotiable-flagged.txt`).

Getting this backwards breaks verbatim matching in exactly the way the product
cannot afford, and it would break it invisibly: the text would look right and
the substring check would fail.

### 11. Used `done` as a ticket status, which is not in the vocabulary

`docs/agents/triage-labels.md` defines five labels — `needs-triage`,
`needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. All five are
pre-work states; none means the work is finished.

Used `**Status:** done` for want of a completion label, and ticked only the
criteria actually verified. **Left for you:** add a completion label to that
table, or tell me which of the five you intended for finished work.

---

## Could not be verified

**Ticket 02 — real-world PDFs.** Every PDF the extraction boundary has been
tested against was written by this repository. The fixture is built to break
verbatim matching in the six ways the ticket names — running headers and
footers, hyphenation at line ends, ligatures, two columns written to the file in
the wrong order, a heading spanning both, and a sentence split across a page
boundary — and the text-recovery functions are tested directly on top of that.
But a PDF from Word, from InDesign, from a scanner's "searchable PDF" mode, or
from a Chinese or Arabic typesetter will be shaped differently, and nothing here
has seen one. The reading-order and running-header heuristics are the parts most
likely to need a second pass against real files.

**Ticket 02 — the length refusal at its real size.** The 250,000-character
refusal is tested with the limit injected at 250, not with a quarter of a
million characters of real document. The path is identical; the size is not.

**Ticket 02 — browsers other than Chrome.** The intake screen was driven by hand
in Chrome: a pasted document, a PDF, a DOCX and an image-only PDF, with every
network request on the page confirmed to be a GET for a static asset. Nothing
has been opened in Safari or Firefox, and the legacy pdf.js build was chosen
partly for them.

---

## Deliberately not done

**OCR.** Out of scope on purpose (`CLAUDE.md`, ADR 0001). An image-only PDF is
refused with the reason, and a partly-scanned one is refused too rather than
inspected on the pages that happen to have text.

**Any way for a document to reach a server.** Ticket 02 offers no analysis
action, because analysis is not built and a button that does nothing is worse
than no button. The extracted state says what would be sent, states the exact
character count, and says plainly that nothing has been sent.

**Terms-of-service detection.** The intake screen names adhesion contracts as
out of scope, as the reviewed static reference does, but nothing detects one.
That is ticket 07, and what Redline should show such a reader is still one of
the five undecided questions.
