/* The production ReaderLookup: ask Supabase who the request's cookies belong to.

   `getUser()` is the call that validates the access token with the auth server
   rather than trusting whatever the cookie decodes to, which is what makes the
   name in the shell's head bar true rather than merely present.

   Two outcomes have to be told apart, and Supabase reports both as an error on
   the same call:

   - no session, or one the server has rejected — the reader is signed out
   - the request never got an answer — the account system is unreachable

   A 4xx is the account system answering: there is no valid session here. Any
   other failure is the account system not answering, and is thrown so
   `readAccountsState` can render that state instead of a blank page. The shape
   is read structurally rather than by importing @supabase/auth-js, which is a
   transitive dependency this ticket did not approve. */

import type { SupabaseClient } from "@supabase/supabase-js";

import { readerFromUser, type ReaderLookup } from "./session";

type AuthFailure = { readonly name?: string; readonly status?: number };

export function isSignedOutFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const failure = error as AuthFailure;

  if (failure.name === "AuthSessionMissingError") return true;

  const { status } = failure;
  return typeof status === "number" && status >= 400 && status < 500;
}

export function readerLookupFor(client: SupabaseClient): ReaderLookup {
  return async () => {
    const { data, error } = await client.auth.getUser();

    if (error) {
      if (isSignedOutFailure(error)) return null;
      throw error;
    }

    return readerFromUser(data.user);
  };
}
