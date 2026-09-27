"use server";

/* Sending the magic link.

   A server function rather than a browser call, for two reasons. The PKCE code
   verifier Supabase generates has to be readable by the callback route handler
   that exchanges the code for a session, and writing it from the server puts it
   in the request cookies where that handler will look. And the form then works
   with JavaScript switched off.

   Email magic link is the whole of it: there is no password to store, to leak,
   or to get wrong. */

import { headers } from "next/headers";

import { originFromHeaders } from "@/lib/auth/origin";
import { isAddressShaped, type SignInResult } from "@/lib/auth/sign-in-result";
import { createRequestSupabaseClient } from "@/lib/supabase/server";

export async function requestMagicLink(
  _previous: SignInResult,
  formData: FormData,
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isAddressShaped(email)) return { status: "unusable-address" };

  const client = await createRequestSupabaseClient();
  if (!client) return { status: "not-configured" };

  const origin = originFromHeaders(await headers());
  if (!origin) {
    console.error(
      "[redline] magic link not sent: the request carried no host header, so there is no absolute URL to send the reader back to.",
    );
    return { status: "not-sent" };
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    /* The reader is told that no link was sent, and nothing more: the library's
       own wording is for whoever wired this deployment up, and it lands here. */
    console.error("[redline] magic link not sent:", error);
    return { status: "not-sent" };
  }

  return { status: "sent", email };
}
