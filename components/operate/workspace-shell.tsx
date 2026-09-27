/* The application shell.
 *
 * The frame from workspace/index.html: the sheet, the ruled head bar with its
 * micro-labelled metadata cells, the report, and the closing footer. It now holds
 * the intake screen, which is the first state the app shell brief names.
 *
 * A client component, because the head bar has to say what is in the frame and
 * what is in the frame is decided in the reader's browser — the document is read
 * there and nowhere else. The account state is still worked out on the server and
 * handed down as a plain value, so all five states below are reachable from a
 * test without going near the auth library.
 */

"use client";

import { useState } from "react";

import { Inspection } from "@/components/operate/inspection";
import { Intake, type IntakeStage } from "@/components/operate/intake";
import { SheetFrame } from "@/components/operate/sheet-frame";
import { CLAUSE_TYPES_IN_SCOPE } from "@/lib/analysis/clause-search";
import { CLAUSE_TAXONOMY } from "@/lib/analysis/taxonomy";
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

/** The head-bar cell naming what is in the frame. */
function documentCell(stage: IntakeStage): string {
  switch (stage.step) {
    case "waiting":
      return "None brought yet";
    case "reading":
      return stage.documentName ?? "Pasted text";
    case "extracted":
      return stage.extraction.documentName ?? "Pasted text";
    case "refused":
      return stage.refusal.documentName ?? "Pasted text";
  }
}

/** The head-bar cell saying how much text there is. The number a reader checks a
 *  failed parse against, so it is never rounded and never hidden. */
function lengthCell(stage: IntakeStage): React.ReactNode {
  switch (stage.step) {
    case "waiting":
      return "Nothing read yet";
    case "reading":
      return "Reading in your browser";
    case "extracted":
      return (
        <>
          <span className="tnum">
            {stage.extraction.characters.toLocaleString("en-US")}
          </span>{" "}
          characters
        </>
      );
    case "refused":
      return "Not read — see below";
  }
}

/** The footer's condensed-caps sheet line: the state of this screen, stated. */
function sheetLine(state: AccountsState, stage: IntakeStage): string {
  const document =
    stage.step === "extracted"
      ? "Document read in this browser"
      : stage.step === "refused"
        ? "Document refused"
        : "No document read";

  switch (state.accounts) {
    case "signed-in":
      return `${document} · Signed in`;
    case "signed-out":
      return `${document} · Signed out`;
    case "not-configured":
      return `${document} · No account system in this build`;
    case "unreachable":
      return `${document} · Account system unreachable`;
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
  const [stage, setStage] = useState<IntakeStage>({ step: "waiting" });

  return (
    <SheetFrame
      name="Workspace"
      skipLabel="Skip to the workspace"
      actionsLabel="Your account"
      actions={<AccountAction state={state} />}
      sheetLine={sheetLine(state, stage)}
      meta={
        <>
          <div>
            <dt>Reader</dt>
            <dd>{readerCell(state)}</dd>
          </div>
          <div>
            <dt>Document</dt>
            <dd>{documentCell(stage)}</dd>
          </div>
          <div>
            <dt>Extracted</dt>
            <dd>{lengthCell(stage)}</dd>
          </div>
          <div>
            <dt>Clause types</dt>
            <dd>
              <span className="tnum">{CLAUSE_TYPES_IN_SCOPE.length}</span> looked
              for of <span className="tnum">{CLAUSE_TAXONOMY.length}</span>{" "}
              published
            </dd>
          </div>
        </>
      }
    >
      <div>
        {/* The inspection is handed to intake rather than placed after it: it
            belongs under the text it was produced from, and it exists only once
            there is text. The extracted text lives in this browser and the
            server function is given the text and nothing else. */}
        <Intake
          onStage={setStage}
          next={
            stage.step === "extracted" ? (
              <Inspection documentText={stage.extraction.text} />
            ) : null
          }
        />

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
