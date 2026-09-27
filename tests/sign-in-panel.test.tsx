/* What the reader sees on /sign-in, in each state the form can be in. The panel
   is pure, so each state is reached by handing it that state — not by mocking the
   thing that sends the link. */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SignInPanel } from "@/components/operate/sign-in-panel";
import { isAddressShaped, type SignInResult } from "@/lib/auth/sign-in-result";

function panel(state: SignInResult): string {
  return renderToStaticMarkup(<SignInPanel state={state} />);
}

describe("the sign-in panel at rest", () => {
  it("asks for an email address and nothing else — there is no password", () => {
    const html = panel({ status: "idle" });

    expect(html).toContain('type="email"');
    expect(html).toContain('name="email"');
    expect(html).toContain("Your email address");
    expect(html).not.toContain('type="password"');
  });

  it("says what an account is for, and what it is not needed for", () => {
    const html = panel({ status: "idle" });

    expect(html).toContain("library");
    expect(html).toContain("red lines");
    expect(html).toContain("Having a document inspected");
    expect(html).toContain("That works signed out");
  });

  it("carries the reviewed field and control classes", () => {
    const html = panel({ status: "idle" });

    expect(html).toContain('class="field"');
    expect(html).toContain("btn btn--primary");
  });
});

describe("after a link has been sent", () => {
  it("names the address it went to and says it works once", () => {
    const html = panel({ status: "sent", email: "dana@studio.example" });

    expect(html).toContain("dana@studio.example");
    expect(html).toContain("It works once");
    expect(html).toContain('role="status"');
  });

  it("leaves a way to ask again", () => {
    expect(panel({ status: "sent", email: "dana@studio.example" })).toContain(
      "Send another link",
    );
  });
});

describe("when something did not work", () => {
  it("says an unusable address was not sent to", () => {
    const html = panel({ status: "unusable-address" });

    expect(html).toContain("does not look like an email address");
    expect(html).toContain("has not tried to send");
    expect(html).toContain('aria-invalid="true"');
  });

  it("says plainly that no link went out, without guessing why", () => {
    const html = panel({ status: "not-sent" });

    expect(html).toContain("No link was sent");
    expect(html).toContain('role="alert"');
  });

  it("explains a link that did not sign the reader in", () => {
    const html = panel({ status: "link-not-accepted" });

    expect(html).toContain("did not sign you in");
    expect(html).toContain("works once");
    expect(html).toContain("browser that asked for it");
  });
});

describe("when this deployment has no account system", () => {
  it("says so instead of showing a form that cannot work", () => {
    const html = panel({ status: "not-configured" });

    expect(html).toContain("no account system configured");
    expect(html).not.toContain('type="email"');
    expect(html).not.toContain("<form");
  });

  it("says that having a document inspected does not need one", () => {
    expect(panel({ status: "not-configured" })).toContain(
      "does not need an account",
    );
  });
});

describe("isAddressShaped", () => {
  it("accepts an address a link could be sent to", () => {
    expect(isAddressShaped("dana@studio.example")).toBe(true);
    expect(isAddressShaped("dana+contracts@sub.studio.co.uk")).toBe(true);
  });

  it("rejects what cannot be an address at all", () => {
    expect(isAddressShaped("")).toBe(false);
    expect(isAddressShaped("dana")).toBe(false);
    expect(isAddressShaped("@studio.example")).toBe(false);
    expect(isAddressShaped("dana@")).toBe(false);
    expect(isAddressShaped("dana@studio")).toBe(false);
    expect(isAddressShaped("dana@@studio.example")).toBe(false);
    expect(isAddressShaped("dana @studio.example")).toBe(false);
    expect(isAddressShaped("dana@.example")).toBe(false);
    expect(isAddressShaped("dana@studio.")).toBe(false);
    expect(isAddressShaped(`${"a".repeat(250)}@studio.example`)).toBe(false);
  });
});
