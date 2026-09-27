/* The Supabase client, over whatever cookie store it is handed.

   The session lives in cookies and nowhere else. That is the whole reason this
   file takes a `CookieStore` rather than reaching for one: the same factory
   serves a server render (cookies from `next/headers`), the proxy (cookies on
   the request and response), and a test (cookies in memory). Nothing about the
   session is held in module state, so every read is a read of the request.

   `@supabase/ssr` requires both `getAll` and `setAll`: without `setAll` a token
   refresh is computed and then thrown away, which shows up later as a reader
   being signed out at random. */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_COOKIE_NAME, type SupabaseConfig } from "./config";

export type CookieRecord = { readonly name: string; readonly value: string };

export type CookieWrite = {
  readonly name: string;
  readonly value: string;
  readonly options: CookieOptions;
};

export type CookieStore = {
  getAll(): CookieRecord[];
  /** `headers` carries the no-store headers a response setting auth cookies
   *  must send, so one reader's token is never served to another from a cache. */
  setAll(writes: CookieWrite[], headers: Record<string, string>): void;
};

export function createCookieSupabaseClient(
  store: CookieStore,
  config: SupabaseConfig,
): SupabaseClient {
  return createServerClient(config.url, config.anonKey, {
    cookieOptions: { name: AUTH_COOKIE_NAME },
    cookies: {
      getAll: () => store.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (writes, headers) => store.setAll(writes, headers),
    },
  });
}
