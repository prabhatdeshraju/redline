/* The four states the shell can be in, reached the way the application reaches
   them: through an injected lookup. No auth library is stubbed here because none
   is involved — the lookup is the seam, and these are the four answers it can
   give. */

import { describe, expect, it } from "vitest";

import { isSignedOutFailure } from "@/lib/auth/reader-lookup";
import { readAccountsState, readerFromUser } from "@/lib/auth/session";
import { readSupabaseConfig } from "@/lib/supabase/config";

describe("readAccountsState", () => {
  it("is not-configured when there is no account system to ask", async () => {
    expect(await readAccountsState(null)).toEqual({
      accounts: "not-configured",
    });
  });

  it("is signed-out when the request's cookies belong to nobody", async () => {
    expect(await readAccountsState(async () => null)).toEqual({
      accounts: "signed-out",
    });
  });

  it("is signed-in, carrying the reader, when they do", async () => {
    const state = await readAccountsState(async () => ({
      id: "reader-1",
      email: "sam@example.test",
    }));

    expect(state).toEqual({
      accounts: "signed-in",
      reader: { id: "reader-1", email: "sam@example.test" },
    });
  });

  it("is unreachable when the account system could not be asked at all", async () => {
    const state = await readAccountsState(async () => {
      throw new Error("fetch failed");
    });

    expect(state).toEqual({ accounts: "unreachable" });
  });

  it("does not turn an unreachable account system into a signed-out reader", async () => {
    /* The two must stay distinct: one is a fact about the reader, the other is a
       fact about the deployment, and telling the reader the wrong one is telling
       them something untrue. */
    const state = await readAccountsState(async () => {
      throw new Error("ENOTFOUND");
    });

    expect(state.accounts).not.toBe("signed-out");
  });
});

describe("readerFromUser", () => {
  it("carries the address a magic link was sent to", () => {
    expect(readerFromUser({ id: "r", email: "sam@example.test" })).toEqual({
      id: "r",
      email: "sam@example.test",
    });
  });

  it("still yields a reader when the account record has no address", () => {
    expect(readerFromUser({ id: "r" })).toEqual({ id: "r", email: null });
  });

  it("yields nobody for nobody", () => {
    expect(readerFromUser(null)).toBeNull();
    expect(readerFromUser(undefined)).toBeNull();
  });
});

describe("telling a signed-out reader from an unreachable account system", () => {
  it("reads a missing session as signed out", () => {
    expect(
      isSignedOutFailure({ name: "AuthSessionMissingError", status: 400 }),
    ).toBe(true);
  });

  it("reads a rejected token as signed out", () => {
    expect(isSignedOutFailure({ name: "AuthApiError", status: 401 })).toBe(true);
    expect(isSignedOutFailure({ name: "AuthApiError", status: 403 })).toBe(true);
  });

  it("reads a failed request as the account system not answering", () => {
    expect(
      isSignedOutFailure({ name: "AuthRetryableFetchError", status: 0 }),
    ).toBe(false);
    expect(isSignedOutFailure(new TypeError("fetch failed"))).toBe(false);
  });

  it("reads a server fault as the account system not answering", () => {
    expect(isSignedOutFailure({ name: "AuthApiError", status: 503 })).toBe(
      false,
    );
  });
});

describe("readSupabaseConfig", () => {
  it("is null when neither variable is set", () => {
    expect(
      readSupabaseConfig({ url: undefined, anonKey: undefined }),
    ).toBeNull();
  });

  it("is null when only one of the two is set", () => {
    expect(
      readSupabaseConfig({ url: "https://x.supabase.co", anonKey: undefined }),
    ).toBeNull();
    expect(readSupabaseConfig({ url: undefined, anonKey: "key" })).toBeNull();
  });

  it("is null when a variable is present but blank", () => {
    expect(readSupabaseConfig({ url: "   ", anonKey: "key" })).toBeNull();
  });

  it("reads both, trimmed, when both are set", () => {
    expect(
      readSupabaseConfig({ url: " https://x.supabase.co ", anonKey: " key " }),
    ).toEqual({ url: "https://x.supabase.co", anonKey: "key" });
  });
});
