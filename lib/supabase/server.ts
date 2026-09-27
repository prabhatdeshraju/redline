/* The per-request Supabase client for server renders, server functions and
   route handlers. Returns null when this deployment has no account system. */

import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readSupabaseConfig } from "./config";
import { createCookieSupabaseClient, type CookieStore } from "./cookie-client";

/** Never share one of these between requests: it is bound to one request's
 *  cookies. `cookies()` is async in Next 16, so this is too. */
export async function createRequestSupabaseClient(): Promise<SupabaseClient | null> {
  const config = readSupabaseConfig();
  if (!config) return null;

  const jar = await cookies();

  const store: CookieStore = {
    getAll: () => jar.getAll().map(({ name, value }) => ({ name, value })),
    setAll: (writes) => {
      try {
        for (const { name, value, options } of writes) {
          jar.set(name, value, options);
        }
      } catch {
        /* A Server Component cannot write cookies — Next throws here, because
           headers are already committed by the time a component renders. The
           refreshed token is written by proxy.ts, which runs before the render
           and can still set headers. In a server function or route handler this
           path does not throw and the write lands. */
      }
    },
  };

  return createCookieSupabaseClient(store, config);
}
