/* The workspace's own reading of who is here, for a server render. */

import { createRequestSupabaseClient } from "@/lib/supabase/server";

import { readerLookupFor } from "./reader-lookup";
import { readAccountsState, type AccountsState } from "./session";

export async function readAccountsStateForRequest(): Promise<AccountsState> {
  const client = await createRequestSupabaseClient();
  return readAccountsState(client ? readerLookupFor(client) : null);
}
