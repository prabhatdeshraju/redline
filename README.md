# Redline

**Production: https://redline-six-peach.vercel.app**

Upload a contract, a statement of work, a vendor agreement or a lease and get
back a plain-English summary, the clauses that carry asymmetric risk ranked by
severity, and — for every flag — the exact sentence from your own document that
it came from, quoted verbatim.

That last part is the point. A flag whose source sentence cannot be shown is a
bug, not a degraded result, so a reader can check the analysis against their own
copy without trusting us and without a lawyer. See
[docs/adr/0001](docs/adr/0001-every-flag-cites-its-source.md).

## Production settings

Four environment variables. Each is set on Vercel (Production) and present in
the local `.env.local`, which is gitignored. No values are recorded here or
anywhere else in the repository.

| Name | Where it is read |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser and server — accounts and the library |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser and server — publishable key, safe to ship |
| `OPENROUTER_API_KEY` | server only, in one module |
| `OPENROUTER_MODEL` | server only — the model id lives here, never in code |

The two `NEXT_PUBLIC_` names are inlined into the client bundle at build time,
which is why they are not marked sensitive on Vercel. The two `OPENROUTER_`
names are, and are read in exactly one module, `lib/model/openrouter.ts`.

With the OpenRouter pair unset, the analysis reports that it could not run. It
never returns an empty analysis, because that would read as an all-clear — the
most dangerous thing this product can say.

## Running it locally

```bash
npm install
npm run typecheck
npm test            # 386 tests, including the citation gate
npm run build
npm run dev
```

`npm run harness` runs the labelled corpus through the citation gate and reports
per clause type.

## Where the decisions are

| File | What it holds |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | the settled decisions and the scope boundary |
| [`PRD.md`](PRD.md) | the brief: who it is for, what good looks like, what we gave up |
| [`CONTEXT.md`](CONTEXT.md) | vocabulary — what a flag, a threshold and an all-clear are |
| [`docs/adr/`](docs/adr/) | five decision records, 0001 being the one the rest hang off |
| [`research/`](research/) | the user research, including what it could not establish |
| [`BUILD-REPORT.md`](BUILD-REPORT.md) | what the build run decided unattended, and what is unverified |

Demand is not yet validated. `PRD.md` §8 is explicit about it: one sourced
first-person account, and no customer has stated a price. Read that before
treating any of this as proven.
