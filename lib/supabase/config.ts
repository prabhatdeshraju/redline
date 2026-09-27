/* Where Redline learns whether it has an account system at all.

   Both values are read from the environment and neither is required. A build
   without them is a working build: a reader can still bring a document and have
   it inspected. Only the library and the reader's red lines need an account,
   because those are the two things that have to be kept between documents. So
   an absent configuration is a state this product renders, not an error it
   throws. */

/** The cookie the session travels in.
 *
 * `@supabase/ssr` derives this name from the project URL when it is left
 * unset, which means the name changes with the project and cannot be written
 * down. Naming it here instead pins one storage key across the browser client,
 * the server client and the proxy — and lets a test read the same cookie the
 * application writes. */
export const AUTH_COOKIE_NAME = "sb-redline-auth-token";

export type SupabaseConfig = {
  readonly url: string;
  readonly anonKey: string;
};

/** The two variables, as they are spelled in the environment. */
export type SupabaseEnv = {
  readonly url: string | undefined;
  readonly anonKey: string | undefined;
};

/** Reads the Supabase configuration, or returns null when this deployment has
 *  none. Pass `env` to read from somewhere other than `process.env`.
 *
 *  The two `process.env` reads are written out as literal member expressions
 *  because that is the form Next.js substitutes at build time for a
 *  `NEXT_PUBLIC_` variable reaching the browser. Destructuring or indexing
 *  `process.env` here would leave the browser bundle with nothing to read. */
export function readSupabaseConfig(env?: SupabaseEnv): SupabaseConfig | null {
  const url = (env ? env.url : process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const anonKey = (
    env ? env.anonKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !anonKey) return null;
  return { url, anonKey };
}
