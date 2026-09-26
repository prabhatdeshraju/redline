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
| — | Labelled fixtures | in progress | Step 3 of the build brief |
| 01 | Project foundation and auth | not started | |
| 02 | Upload and extract in the browser | not started | |
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

---

## Could not be verified

Filled in as the build proceeds.

---

## Deliberately not done

Filled in as the build proceeds.
