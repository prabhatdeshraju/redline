/* The session travels in cookies, and it survives a reload.

   Nothing here is mocked. The client is the real `@supabase/ssr` server client,
   the cookie is in the real format that client writes, and each "request" builds
   its own client over the same jar — which is exactly what a reload is: a second
   request carrying the same cookies to a process that kept nothing.

   The point of the test is that the session has no other home. If it were held
   in module state, the fresh-client reads below would still pass; if it were held
   in localStorage, none of them would, because none of these reads touch a
   browser. The cookie jar is the only thing carried between them. */

import { describe, expect, it } from "vitest";

import { readAccountsState, readerFromUser } from "@/lib/auth/session";
import { AUTH_COOKIE_NAME } from "@/lib/supabase/config";
import {
  createCookieSupabaseClient,
  type CookieRecord,
  type CookieStore,
  type CookieWrite,
} from "@/lib/supabase/cookie-client";

const CONFIG = {
  url: "https://redline-test.supabase.co",
  anonKey: "anon-key-for-this-test",
};

const READER = {
  id: "8f1b3f52-5a0e-4c2f-9a1a-7a1d0e6b2c44",
  email: "dana@studio.example",
};

/** A cookie jar with no HTTP around it: what a browser holds between requests. */
class MemoryCookieJar implements CookieStore {
  private readonly cookies = new Map<string, string>();

  getAll(): CookieRecord[] {
    return [...this.cookies].map(([name, value]) => ({ name, value }));
  }

  setAll(writes: CookieWrite[]): void {
    for (const { name, value, options } of writes) {
      if (value === "" || options.maxAge === 0) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  put(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  clear(): void {
    this.cookies.clear();
  }
}

function base64url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

/** A structurally valid access token. Unsigned, because nothing in this test
 *  verifies a signature — the auth server does that, over the network. */
function accessToken(expiresAt: number): string {
  return [
    base64url(JSON.stringify({ alg: "HS256", typ: "JWT" })),
    base64url(
      JSON.stringify({
        sub: READER.id,
        email: READER.email,
        aud: "authenticated",
        role: "authenticated",
        iss: `${CONFIG.url}/auth/v1`,
        iat: expiresAt - 3600,
        exp: expiresAt,
      }),
    ),
    base64url("not-a-real-signature"),
  ].join(".");
}

/** The cookie `@supabase/ssr` writes for a signed-in reader: the session as
 *  JSON, base64url-encoded behind the library's own `base64-` marker. */
function sessionCookie(secondsFromNow = 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + secondsFromNow;

  return `base64-${base64url(
    JSON.stringify({
      access_token: accessToken(expiresAt),
      refresh_token: "refresh-token-for-this-test",
      token_type: "bearer",
      expires_in: secondsFromNow,
      expires_at: expiresAt,
      user: {
        id: READER.id,
        email: READER.email,
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date(0).toISOString(),
      },
    }),
  )}`;
}

/** One request: a client built from scratch over whatever the jar holds. */
function lookupForOneRequest(jar: MemoryCookieJar) {
  return async () => {
    const client = createCookieSupabaseClient(jar, CONFIG);
    const { data } = await client.auth.getSession();
    return readerFromUser(data.session?.user ?? null);
  };
}

describe("the session in the request cookies", () => {
  it("names the reader it belongs to", async () => {
    const jar = new MemoryCookieJar();
    jar.put(AUTH_COOKIE_NAME, sessionCookie());

    const state = await readAccountsState(lookupForOneRequest(jar));

    expect(state).toEqual({
      accounts: "signed-in",
      reader: { id: READER.id, email: READER.email },
    });
  });

  it("survives a reload: a second request over the same jar reads it again", async () => {
    const jar = new MemoryCookieJar();
    jar.put(AUTH_COOKIE_NAME, sessionCookie());

    const first = await readAccountsState(lookupForOneRequest(jar));
    const second = await readAccountsState(lookupForOneRequest(jar));
    const third = await readAccountsState(lookupForOneRequest(jar));

    expect(first).toEqual(second);
    expect(second).toEqual(third);
    expect(third.accounts).toBe("signed-in");
  });

  it("belongs to nobody once the jar is empty, which is what signing out leaves", async () => {
    const jar = new MemoryCookieJar();
    jar.put(AUTH_COOKIE_NAME, sessionCookie());
    expect((await readAccountsState(lookupForOneRequest(jar))).accounts).toBe(
      "signed-in",
    );

    jar.clear();

    expect((await readAccountsState(lookupForOneRequest(jar))).accounts).toBe(
      "signed-out",
    );
  });

  it("reads nothing out of a jar that never held a session", async () => {
    const jar = new MemoryCookieJar();
    jar.put("some-unrelated-cookie", "value");

    const state = await readAccountsState(lookupForOneRequest(jar));

    expect(state).toEqual({ accounts: "signed-out" });
  });
});
