/* The absolute URL a magic link sends the reader back to.

   It has to come off the request, because the same build serves localhost, a
   preview deployment and production, and a link that points at the wrong one of
   those is a link that cannot sign anybody in. Anything hardcoded here would be
   a bug that only shows up after deployment. */

import { describe, expect, it } from "vitest";

import { originFromHeaders } from "@/lib/auth/origin";

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name] ?? null };
}

describe("originFromHeaders", () => {
  it("reads a plain host", () => {
    expect(originFromHeaders(headers({ host: "redline.example" }))).toBe(
      "https://redline.example",
    );
  });

  it("prefers the forwarded host, which is the one the reader typed", () => {
    expect(
      originFromHeaders(
        headers({
          host: "internal-abc123.vercel.internal",
          "x-forwarded-host": "redline.example",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe("https://redline.example");
  });

  it("takes the first scheme when a chain of proxies appended its own", () => {
    expect(
      originFromHeaders(
        headers({ host: "redline.example", "x-forwarded-proto": "https,http" }),
      ),
    ).toBe("https://redline.example");
  });

  it("uses http for local development, where there is no certificate", () => {
    expect(originFromHeaders(headers({ host: "localhost:3000" }))).toBe(
      "http://localhost:3000",
    );
    expect(originFromHeaders(headers({ host: "127.0.0.1:3000" }))).toBe(
      "http://127.0.0.1:3000",
    );
  });

  it("assumes https anywhere else, rather than sending a link over http", () => {
    expect(
      originFromHeaders(headers({ host: "redline-preview.vercel.app" })),
    ).toBe("https://redline-preview.vercel.app");
  });

  it("is null when the request carried no host to send anyone back to", () => {
    expect(originFromHeaders(headers({}))).toBeNull();
    expect(originFromHeaders(headers({ host: "   " }))).toBeNull();
  });
});
