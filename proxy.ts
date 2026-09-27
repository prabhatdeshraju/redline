/* Keeping the session alive across requests.

   Next 16 renamed middleware to proxy; this is the same hook under its new name
   and at its new path (project root, beside app/).

   It exists because a Server Component cannot write cookies: headers are already
   committed by the time a page renders. So when an access token needs refreshing,
   the refresh has to happen here — before the render — where the new cookies can
   still be attached to the response. Without it a reader is signed out at
   apparently random intervals.

   When this deployment has no Supabase configuration it does nothing at all, and
   nothing on the site depends on it having run. */

import { NextResponse, type NextRequest } from "next/server";

import { readSupabaseConfig } from "@/lib/supabase/config";
import { createCookieSupabaseClient } from "@/lib/supabase/cookie-client";

export async function proxy(request: NextRequest) {
  const supabase = readSupabaseConfig();
  if (!supabase) return NextResponse.next();

  let response = NextResponse.next({ request });

  const client = createCookieSupabaseClient(
    {
      getAll: () =>
        request.cookies.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (writes, headers) => {
        /* Rebuilt so the refreshed cookies are on the request the render sees as
           well as on the response the browser stores. */
        response = NextResponse.next({ request });
        for (const { name, value, options } of writes) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
        /* The no-store headers that stop a CDN serving one reader's token to
           another. */
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
    supabase,
  );

  /* The call that reads the session and refreshes it when it has expired. Its
     answer is not needed here — each route reads the session itself. An
     unreachable auth server must not take the site down with it, so a failure
     here is logged and the request continues. */
  try {
    await client.auth.getUser();
  } catch (error) {
    console.error("[redline] session refresh could not reach Supabase:", error);
  }

  return response;
}

export const config = {
  matcher: [
    /* Everything but Next's build output and the static files served from
       public/ — a font or an image has no session to refresh. */
    "/((?!_next/static|_next/image|favicon.ico|fonts/).*)",
  ],
};
