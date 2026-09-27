/* Where a magic link lands.

   Supabase's own verify endpoint redirects here once the reader opens the link
   in their email. Two shapes arrive, depending on how the project's email
   template is written, and both are real:

   - `?code=…` — the PKCE flow. Exchanged for a session against the code verifier
     that the sign-in request left in this browser's cookies.
   - `?token_hash=…&type=…` — the token-hash flow, verified directly.

   Either way the session is written into cookies on the redirect out of here, so
   it is already present when /workspace renders. A link that does not work sends
   the reader back to /sign-in with that said plainly rather than onto a broken
   workspace. */

import { NextResponse } from "next/server";

import { createRequestSupabaseClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES = [
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
  "email",
] as const;

type EmailOtpTypeName = (typeof EMAIL_OTP_TYPES)[number];

function asEmailOtpType(value: string | null): EmailOtpTypeName | null {
  return EMAIL_OTP_TYPES.find((type) => type === value) ?? null;
}

/** Only a path on this deployment, so the link cannot be made to bounce a
 *  freshly signed-in reader onto somebody else's site. */
function safeDestination(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/workspace";
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = safeDestination(url.searchParams.get("next"));

  const client = await createRequestSupabaseClient();
  if (!client) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
    console.error("[redline] magic link code not exchanged:", error);
  } else {
    const tokenHash = url.searchParams.get("token_hash");
    const type = asEmailOtpType(url.searchParams.get("type"));

    if (tokenHash && type) {
      const { error } = await client.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) {
        return NextResponse.redirect(new URL(destination, request.url));
      }
      console.error("[redline] magic link token not verified:", error);
    }
  }

  return NextResponse.redirect(
    new URL("/sign-in?link=not-accepted", request.url),
  );
}
