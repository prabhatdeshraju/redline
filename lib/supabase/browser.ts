"use client";

/* The browser Supabase client. Returns null when this deployment has no
   account system, so a component can render the unavailable state rather than
   throw during hydration.

   Cookie-backed, not localStorage-backed: the same session has to be readable
   by the server render that draws the shell, which means it has to travel in
   the request. `createBrowserClient` reads and writes `document.cookie` and
   keeps one client per page, so calling this repeatedly is cheap. */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_COOKIE_NAME, readSupabaseConfig } from "./config";

export function createReaderSupabaseClient(): SupabaseClient | null {
  const config = readSupabaseConfig();
  if (!config) return null;

  return createBrowserClient(config.url, config.anonKey, {
    cookieOptions: { name: AUTH_COOKIE_NAME },
  });
}
