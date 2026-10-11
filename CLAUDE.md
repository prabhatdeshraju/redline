# Redline

A web app where someone uploads a contract, lease, freelance agreement or terms
of service and gets back: a plain-English summary; the clauses that could hurt
them, ranked by severity, each showing the exact source sentence; a drafted
counter-offer for each flagged clause; a question box that answers only from the
document; an editable list of their own red lines that drives the analysis; and
a saved library of past documents.

## Settled decisions

Not open for reinterpretation. If one of these looks wrong while building, say
so and stop — don't route around it.

- Next.js. Supabase for auth and database. Deployed on Vercel.
- The model is called through OpenRouter, pinned to `z-ai/glm-5.3-flash`, with
  the provider pinned to `fireworks` and fallbacks off. The model id lives in
  `OPENROUTER_MODEL` and never in code. Ask before changing either pin — a
  model the pinned provider does not serve fails outright rather than routing
  elsewhere, which is deliberate.
- The uploaded file is parsed in the browser. Only the extracted text is stored.
- Every risk flag cites the exact sentence it came from. A flag whose source
  sentence cannot be shown is a bug, not a degraded result.

## Scope

Build the capabilities listed at the top and stop there. When something looks
like the obvious next step and is not on that list, ask first.

Excluded on purpose: payments, billing, OCR for scanned documents, and sharing a
document between users. This version exists to prove the analysis can be
trusted. None of those make it more trustworthy, and OCR actively undermines it,
because a citation is worthless when the text it points at was misread.

## Standing rules

- Keep credentials in `.env.local`, which is gitignored. Never commit a secret —
  a key is public the moment it is pushed and has to be rotated. The GitHub repo
  is public.
- State only what the document says. Where the text does not support a claim,
  the product does not make it.
- Ask before adding a dependency.

## Working unattended

A long build may run while I am not watching.

- Hit a product question the PRD does not answer: stop that thread of work,
  leave everything else in a working state, and ask. Do not guess and continue.
- The Supabase project (`thwqzltdgtckqhoqaoud`), the OpenRouter key and the
  Vercel deployment all exist. Do not create further accounts or cloud
  projects, and do not alter the ones that exist beyond what a task asks for.
  If the work needs something new, stop and ask.

## Read these when they matter

- `research/summary.md` — the user research. Read it before deciding what the
  product should do.
- `PRD.md` — the brief, once it exists. Read it before building.

## Agent skills

### Issue tracker

Issues live as markdown under `.scratch/<feature>/`, committed to the repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, label strings as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` at root, ADRs in `docs/adr/`. See `docs/agents/domain.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
