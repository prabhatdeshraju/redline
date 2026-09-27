/* The application shell.

   The frame from workspace/index.html at the point in the build where it holds
   no document yet: the sheet, the ruled head bar that says who the reader is,
   the head-rail sections, and the closing footer. No document content, because
   none exists yet — and no control for a feature that is not built, because a
   button that does nothing is worse than no button.

   Pure function of the account state, so every state below is reachable in a
   test without going near the auth library. */

import { SheetFrame } from "@/components/operate/sheet-frame";
import type { AccountsState } from "@/lib/auth/session";

type WorkspaceShellProps = {
  readonly state: AccountsState;
};

/** The head-bar cell naming who is here. */
function readerCell(state: AccountsState): string {
  switch (state.accounts) {
    case "signed-in":
      return state.reader.email ?? "Signed in";
    case "signed-out":
      return "Not signed in";
    case "not-configured":
      return "No account system in this build";
    case "unreachable":
      return "Account system did not answer";
  }
}

/** The footer's sheet line. */
function sheetLine(state: AccountsState): string {
  switch (state.accounts) {
    case "signed-in":
      return "Signed in";
    case "signed-out":
      return "Signed out";
    case "not-configured":
      return "No account system in this build";
    case "unreachable":
      return "Account system unreachable";
  }
}

function AccountAction({ state }: WorkspaceShellProps) {
  if (state.accounts === "signed-in") {
    /* A form, not a link: signing out changes something, and a POST is how it
       says so. It also works with JavaScript switched off. */
    return (
      <form action="/sign-out" method="post">
        <button type="submit" className="btn">
          Sign out
        </button>
      </form>
    );
  }

  if (state.accounts === "signed-out") {
    return (
      <a className="btn btn--primary" href="/sign-in">
        Sign in
      </a>
    );
  }

  /* Nothing to offer: there is no account system to sign in to, or it did not
     answer. The section below says which, in words. */
  return null;
}

function AccountNote({ state }: WorkspaceShellProps) {
  switch (state.accounts) {
    case "signed-in":
      return (
        <p className="summary__text">
          You are signed in as <b>{state.reader.email ?? "this account"}</b>.
          Your library and your red lines belong to this account and to nobody
          else.
        </p>
      );
    case "signed-out":
      return (
        <p className="summary__text">
          You are not signed in, and you do not need to be to have a document
          inspected. An account holds the two things that have to survive
          between documents: your library, and your red lines.
        </p>
      );
    case "not-configured":
      return (
        <p className="summary__text">
          This build has no account system configured, so there is no way to
          sign in to it. Having a document inspected never needed one. Your
          library and your red lines do need one — they are what is kept between
          documents — so neither is available here.
        </p>
      );
    case "unreachable":
      return (
        <p className="summary__text">
          Redline could not reach the account system just now, so it cannot tell
          whether you are signed in. Having a document inspected does not depend
          on it. Your library and your red lines do, so neither is available
          until it answers.
        </p>
      );
  }
}

export function WorkspaceShell({ state }: WorkspaceShellProps) {
  return (
    <SheetFrame
      name="Workspace"
      skipLabel="Skip to the workspace"
      actionsLabel="Your account"
      actions={<AccountAction state={state} />}
      sheetLine={sheetLine(state)}
      meta={
        <>
          <div>
            <dt>Reader</dt>
            <dd>{readerCell(state)}</dd>
          </div>
          <div>
            <dt>Document</dt>
            <dd>None in this build</dd>
          </div>
          <div>
            <dt>Clause types</dt>
            <dd>
              <span className="tnum">8</span>, fixed and published
            </dd>
          </div>
        </>
      }
    >
      <div>
        <section className="summary" aria-labelledby="nothing-head">
          <h2 className="sect-head" id="nothing-head">
            Nothing inspected yet
          </h2>
          <div className="sect-body">
            <p className="summary__text">
              This is the frame a report arrives in. Bringing a document to it is
              not built yet: this build carries the frame and the account system,
              and nothing that reads a document.
            </p>
            <p className="summary__hedge">
              When it is built, the document will be read in your own browser and
              only the extracted text will be sent to be inspected. Redline
              describes what a document says. It does not advise you whether to
              sign.
            </p>
          </div>
        </section>

        <section className="summary" aria-labelledby="account-head">
          <h2 className="sect-head" id="account-head">
            Your account
          </h2>
          <div className="sect-body">
            <AccountNote state={state} />
          </div>
        </section>
      </div>
    </SheetFrame>
  );
}
