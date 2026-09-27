/* /workspace — the application shell.

   Reachable signed out on purpose: a reader has to be able to judge Redline
   before signing up for it, so nothing here redirects to sign-in and nothing
   here requires an account system to exist. */

import type { Metadata } from "next";

import { SessionSync } from "@/components/operate/session-sync";
import { WorkspaceShell } from "@/components/operate/workspace-shell";
import { readAccountsStateForRequest } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Workspace — Redline",
  description:
    "The workspace a Redline report is drawn in. Having a document inspected does not need an account; your library and your red lines do.",
};

export default async function WorkspacePage() {
  const state = await readAccountsStateForRequest();

  return (
    <>
      <WorkspaceShell state={state} />
      <SessionSync
        renderedReaderId={
          state.accounts === "signed-in" ? state.reader.id : null
        }
      />
    </>
  );
}
