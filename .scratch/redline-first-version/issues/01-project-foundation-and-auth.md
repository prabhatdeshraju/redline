# 01: Project foundation and auth

**What to build:** A reader can open Redline, sign in, and land in an empty
application shell that knows who they are. Signing out returns them to the
public entry point. Nothing about documents exists yet.

This is the scaffold every other ticket sits on: the Next.js application
deployed to Vercel, Supabase wired for auth and database, and the session
available to the rest of the product.

Auth scaffolds the product but does not gate analysis. A reader must be able to
analyse a document without an account, so that they can judge Redline before
signing up. Only thresholds (11) and the library (12) require one.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] A reader can sign in and sign out, and their session survives a reload — cookie transport and reload verified against the real /ssr client; the live magic-link round trip needs a real project
- [x] A signed-in reader sees an application shell; a signed-out visitor sees the public entry point
- [ ] The application deploys to Vercel and runs there, not only locally — **unverified**: no Vercel project exists and creating one is forbidden by CLAUDE.md. Built to deploy: no Node-only API in a client component, no hardcoded localhost, no secret at build time
- [ ] Supabase is reachable for both auth and database from the deployed application — **unverified**: no Supabase project exists. Migrations are written for you to run by hand
- [x] Credentials live in `.env.local` and nothing secret is committed
- [x] Routes that do not require an account are reachable signed out, demonstrated rather than assumed — /workspace fetched live at 200 signed out with Supabase unconfigured

## Comments

**2026-09-26 — implemented.** Auth is Supabase email magic link (OTP), PKCE,
initiated from a server function so the flow works with JavaScript off. Session
is cookie-based, so it survives a reload; `proxy.ts` (Next 16 renamed middleware
to Proxy) refreshes the token before a render, because a Server Component cannot
write cookies.

Four designed account states, all rendering the full frame: signed-in,
signed-out, not-configured, unreachable. The last two matter — telling a reader
they are signed out when Redline could not reach the account system at all is
telling them something untrue.

`app/operate.css` is `workspace/workspace.css` ported verbatim, loaded from the
`(operate)` route group. One line was added in a marked block —
`a.btn { text-decoration: none; }` — because the static reference had no
navigation in it and the app has two links wearing the Operate Control. No
token, value or appearance changed.

The migration adds no tables on purpose: the reader's identity is Supabase's own
`auth.users`, and a table restating it would be a second, staler answer to the
same question. It records the conventions later migrations follow and adds
`public.touch_updated_at()`.

Status `done` is not one of the five triage labels in `docs/agents/triage-labels.md`
— those are all pre-work states. Used it anyway, for want of a completion label.
