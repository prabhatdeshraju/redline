/* What the reader actually sees on /workspace, in each state the account system
   can leave them in. Rendered from the account state the page derives, so these
   are the same four screens the application serves. */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WorkspaceShell } from "@/components/operate/workspace-shell";
import type { AccountsState } from "@/lib/auth/session";

function shell(state: AccountsState): string {
  return renderToStaticMarkup(<WorkspaceShell state={state} />);
}

const SIGNED_IN: AccountsState = {
  accounts: "signed-in",
  reader: { id: "reader-1", email: "dana@studio.example" },
};

describe("the workspace shell, whatever the account state", () => {
  const states: AccountsState[] = [
    { accounts: "not-configured" },
    { accounts: "unreachable" },
    { accounts: "signed-out" },
    SIGNED_IN,
  ];

  it("is the reviewed frame every time: the sheet, its bound edge, the head bar and the closing footer", () => {
    for (const state of states) {
      const html = shell(state);

      expect(html).toContain('class="sheet"');
      expect(html).toContain('class="sheet__edge"');
      expect(html).toContain('class="whead"');
      expect(html).toContain('class="wordmark"');
      expect(html).toContain('class="whead__meta"');
      expect(html).toContain('class="wfoot"');
      expect(html).toContain('id="report"');
    }
  });

  it("names the reader in the head bar in every state, so the frame never lies about who is here", () => {
    const expected: Array<[AccountsState, string]> = [
      [{ accounts: "not-configured" }, "No account system in this build"],
      [{ accounts: "unreachable" }, "Account system did not answer"],
      [{ accounts: "signed-out" }, "Not signed in"],
      [SIGNED_IN, "dana@studio.example"],
    ];

    for (const [state, cell] of expected) {
      expect(shell(state)).toContain(cell);
    }
  });

  it("carries the published clause-type count with tabular figures", () => {
    for (const state of states) {
      expect(shell(state)).toContain('<span class="tnum">8</span>');
    }
  });

  it("never offers a verdict, and says so", () => {
    for (const state of states) {
      const html = shell(state);

      expect(html).toContain("It does not advise you whether to sign");
      expect(html).not.toMatch(/you.ll be fine|don.t sign|do not sign this/i);
    }
  });

  it("uses the product's own words and none of the words it avoids", () => {
    for (const state of states) {
      const html = shell(state);

      expect(html).not.toMatch(/\bfinding(s)?\b/i);
      /* "your red lines" is the interface label for a threshold, and the only
         place that phrase is used. */
      expect(html).not.toMatch(/\bthreshold(s)?\b/i);
    }
  });
});

describe("a signed-out visitor", () => {
  it("reaches the workspace rather than being sent away to sign in", () => {
    const html = shell({ accounts: "signed-out" });

    /* The whole screen is here: no redirect, no gate, no empty placeholder.
       A signed-out reader gets intake, which is the point of ADR-recorded
       anonymous analysis. */
    expect(html).toContain("Bring the document you are about to sign.");
    expect(html).toContain("Not signed in");
  });

  it("is offered a way in, and told what it is for", () => {
    const html = shell({ accounts: "signed-out" });

    expect(html).toContain('href="/sign-in"');
    expect(html).toContain("Sign in");
    expect(html).toContain("you do not need to be to have a document inspected");
    expect(html).toContain("your library, and your red lines");
  });

  it("is not offered a way out", () => {
    expect(shell({ accounts: "signed-out" })).not.toContain("Sign out");
  });
});

describe("a signed-in reader", () => {
  it("is named in the head bar", () => {
    const html = shell(SIGNED_IN);

    expect(html).toContain("dana@studio.example");
  });

  it("is offered sign-out as something that changes state, so a POST", () => {
    const html = shell(SIGNED_IN);

    expect(html).toContain('action="/sign-out"');
    expect(html).toContain('method="post"');
    expect(html).toContain("Sign out");
  });

  it("is not offered sign-in again", () => {
    expect(shell(SIGNED_IN)).not.toContain('href="/sign-in"');
  });

  it("is told the library and the red lines are theirs", () => {
    expect(shell(SIGNED_IN)).toContain(
      "belong to this account and to nobody",
    );
  });
});

describe("a deployment with no account system", () => {
  it("still renders the workspace", () => {
    const html = shell({ accounts: "not-configured" });

    expect(html).toContain("Bring the document you are about to sign.");
    expect(html).toContain('class="sheet"');
  });

  it("explains that accounts are unavailable here instead of offering one", () => {
    const html = shell({ accounts: "not-configured" });

    expect(html).toContain("no account system configured");
    expect(html).not.toContain('href="/sign-in"');
    expect(html).not.toContain("Sign out");
  });

  it("says which part of the product needs one, and that inspection does not", () => {
    const html = shell({ accounts: "not-configured" });

    expect(html).toContain("Having a document inspected never needed one");
    expect(html).toContain("library");
    expect(html).toContain("red lines");
  });
});

describe("an account system that did not answer", () => {
  it("says that, rather than claiming the reader is signed out", () => {
    const html = shell({ accounts: "unreachable" });

    expect(html).toContain("could not reach the account system");
    expect(html).toContain("cannot tell");
    expect(html).not.toContain("You are not signed in");
  });

  it("still renders the workspace", () => {
    expect(shell({ accounts: "unreachable" })).toContain(
      "Bring the document you are about to sign.",
    );
  });
});
