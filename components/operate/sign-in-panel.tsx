/* The magic-link form, as the reader sees it in each of its states.

   Pure: it takes the result of the last attempt and renders it. The server
   function that actually sends the link arrives as `formAction`, so a test can
   reach every state the reader can reach with no auth library anywhere near it.
   Classes are the Operate stylesheet's intake grid, field and controls. */

import type { SignInResult } from "@/lib/auth/sign-in-result";

type SignInPanelProps = {
  readonly state: SignInResult;
  readonly formAction?: (formData: FormData) => void;
  readonly pending?: boolean;
};

function Message({ state }: { readonly state: SignInResult }) {
  switch (state.status) {
    case "sent":
      return (
        <p className="intake__lead" role="status">
          A link is on its way to <b>{state.email}</b>. Opening it signs you in
          on this device. It works once.
        </p>
      );
    case "unusable-address":
      return (
        <p className="intake__err" role="alert">
          That does not look like an email address, so Redline has not tried to
          send anything to it.
        </p>
      );
    case "not-sent":
      return (
        <p className="intake__err" role="alert">
          No link was sent. Redline could not get an answer from the account
          system. Trying again is worth doing; if it keeps failing, the account
          system is down rather than your address being wrong.
        </p>
      );
    case "link-not-accepted":
      return (
        <p className="intake__err" role="alert">
          That link did not sign you in. A link works once, and only in the
          browser that asked for it. Asking for a new one here will work.
        </p>
      );
    case "idle":
    case "not-configured":
      return null;
  }
}

export function SignInPanel({ state, formAction, pending }: SignInPanelProps) {
  const unavailable = state.status === "not-configured";

  return (
    <section className="intake" aria-labelledby="sign-in-head">
      <div className="intake__main">
        <h2 className="intake__head" id="sign-in-head">
          Sign in to Redline.
        </h2>

        {unavailable ? (
          <>
            <p className="intake__lead">
              This build has no account system configured, so there is nobody to
              sign in as.
            </p>
            <p>
              Having a document inspected does not need an account. Your library
              and your red lines do, and neither is available here.
            </p>
          </>
        ) : (
          <>
            <p className="intake__lead">
              Redline sends a link to your email address. Opening it signs you
              in. There is no password, so there is none to lose.
            </p>

            <form className="intake__form" action={formAction}>
              <label className="minor" htmlFor="email">
                Your email address
              </label>
              <input
                className="field"
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                aria-invalid={
                  state.status === "unusable-address" ? true : undefined
                }
                defaultValue={state.status === "sent" ? state.email : undefined}
              />
              <Message state={state} />
              <div className="intake__row">
                <button
                  type="submit"
                  className={
                    pending ? "btn btn--primary is-busy" : "btn btn--primary"
                  }
                  disabled={pending}
                >
                  {state.status === "sent"
                    ? "Send another link"
                    : "Send me a link"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <aside className="intake__scope">
        <h3 className="minor">What an account is for</h3>
        <p>
          Your <b>library</b> and your <b>red lines</b>. The library is off
          unless you turn it on, each document in it expires on its own clock,
          and it is never trained on. Your red lines are the terms you will not
          accept, in your own words; an account is what keeps them between
          documents.
        </p>
        <h3 className="minor">What it is not for</h3>
        <p>
          Having a document inspected. That works signed out, so you can judge
          Redline before you sign up for it.
        </p>
      </aside>
    </section>
  );
}
