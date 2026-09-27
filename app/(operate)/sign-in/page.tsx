/* /sign-in — the magic-link form.

   It opens in whichever state the reader arrives in: idle, or reporting that a
   link they just opened was not accepted, or explaining that this deployment has
   no account system at all. */

import type { Metadata } from "next";

import { SheetFrame } from "@/components/operate/sheet-frame";
import { SignInForm } from "@/components/operate/sign-in-form";
import type { SignInResult } from "@/lib/auth/sign-in-result";
import { readSupabaseConfig } from "@/lib/supabase/config";

import { requestMagicLink } from "./actions";

export const metadata: Metadata = {
  title: "Sign in — Redline",
  description:
    "Sign in to Redline with a link sent to your email address. An account keeps your library and your red lines between documents.",
};

type SignInPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** `?link=not-accepted` is what the callback route redirects here with. */
function initialResult(
  configured: boolean,
  link: string | string[] | undefined,
): SignInResult {
  if (!configured) return { status: "not-configured" };
  if (link === "not-accepted") return { status: "link-not-accepted" };
  return { status: "idle" };
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const configured = readSupabaseConfig() !== null;
  const initial = initialResult(configured, params.link);

  return (
    <SheetFrame
      name="Sign in"
      skipLabel="Skip to the sign-in form"
      actionsLabel="Redline"
      actions={
        <a className="btn" href="/workspace">
          Workspace
        </a>
      }
      sheetLine={
        configured
          ? "One link, no password"
          : "No account system in this build"
      }
      meta={
        <div>
          <dt>How</dt>
          <dd>A link sent to your email address</dd>
        </div>
      }
    >
      <SignInForm action={requestMagicLink} initial={initial} />
    </SheetFrame>
  );
}
