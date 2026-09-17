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

**Status:** ready-for-agent

- [ ] A reader can sign in and sign out, and their session survives a reload
- [ ] A signed-in reader sees an application shell; a signed-out visitor sees the public entry point
- [ ] The application deploys to Vercel and runs there, not only locally
- [ ] Supabase is reachable for both auth and database from the deployed application
- [ ] Credentials live in `.env.local` and nothing secret is committed
- [ ] Routes that do not require an account are reachable signed out, demonstrated rather than assumed
