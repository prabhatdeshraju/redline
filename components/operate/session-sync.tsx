"use client";

/* Keeps the server-rendered shell honest about who is here.

   The shell is drawn on the server from the request's cookies. If the session
   changes after that — the reader signs out in another tab, or opens a magic
   link in one — the browser client learns about it first. When what it knows
   disagrees with what the server drew, this asks for the route to be rendered
   again, and the head bar catches up without the reader reloading by hand.

   It is also what gives the session its browser-side refresh: createBrowserClient
   turns on autoRefreshToken in a browser, so a long sitting holds a fresh token
   rather than an expired one.

   Renders nothing, and does nothing at all when this deployment has no account
   system. */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createReaderSupabaseClient } from "@/lib/supabase/browser";

type SessionSyncProps = {
  /** The reader the server render was drawn for, or null for signed out. */
  readonly renderedReaderId: string | null;
};

export function SessionSync({ renderedReaderId }: SessionSyncProps) {
  const router = useRouter();

  useEffect(() => {
    const client = createReaderSupabaseClient();
    if (!client) return;

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      const readerId = session?.user?.id ?? null;
      /* Supabase fires SIGNED_IN often — on focus, on refresh — so the trigger
         is a disagreement about identity, never the event on its own. */
      if (readerId !== renderedReaderId) router.refresh();
    });

    return () => data.subscription.unsubscribe();
  }, [renderedReaderId, router]);

  return null;
}
