"use client";

/* The interactive wrapper around SignInPanel: it holds the result of the last
   attempt and reports while the request is in flight. The panel itself is pure
   and lives next door.

   The form still posts without JavaScript — useActionState degrades to a plain
   form submission against the same server function. */

import { useActionState } from "react";

import { SignInPanel } from "@/components/operate/sign-in-panel";
import type { SignInResult } from "@/lib/auth/sign-in-result";

export type SignInAction = (
  previous: SignInResult,
  formData: FormData,
) => Promise<SignInResult>;

type SignInFormProps = {
  readonly action: SignInAction;
  readonly initial: SignInResult;
};

export function SignInForm({ action, initial }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <SignInPanel state={state} formAction={formAction} pending={pending} />
  );
}
