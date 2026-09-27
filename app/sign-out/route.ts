/* Signing out, and landing back on the public entry point.

   POST only: it changes something. The shell posts a plain form here, so it
   works with JavaScript switched off.

   `signOut()` clears the session cookies through the same cookie store the rest
   of the request uses, and a route handler is one of the two places Next allows
   a cookie to be written — so the Set-Cookie headers ride out on this redirect. */

import { NextResponse } from "next/server";

import { createRequestSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const client = await createRequestSupabaseClient();

  if (client) {
    const { error } = await client.auth.signOut();
    if (error) console.error("[redline] sign out reported:", error);
  }

  /* 303 so the browser follows with a GET rather than re-posting. */
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
