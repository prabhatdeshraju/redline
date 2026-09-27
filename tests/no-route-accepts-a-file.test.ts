/* @vitest-environment node
 *
 * The file never leaves the reader's machine — structurally, not just today.
 *
 * "Parsing happens in the browser" is easy to satisfy by accident and easy to
 * lose by accident: one `formData()` in a route handler, one server action taking
 * a File, and a document is on a server. These tests read the source and assert
 * that there is nowhere for a file to go, so the guarantee survives whoever adds
 * the next feature.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function filesUnder(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      found.push(...filesUnder(path));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      found.push(path);
    }
  }
  return found;
}

const read = (path: string): string => readFileSync(path, "utf8");

/** Every module that runs on the server: route handlers, pages and layouts
 *  without the client directive, server actions, the proxy, and the lib modules
 *  those reach.
 *
 * `lib/extraction` is excluded, and only because it is the one tree that is
 * proved never to run on the server by other means — the test below asserts that
 * nothing imports it except modules carrying the client directive. It is the
 * module that reads the file, so it is the one place `arrayBuffer` is allowed to
 * appear at all. */
function serverModules(): string[] {
  return [...filesUnder("app"), ...filesUnder("lib"), "proxy.ts"]
    .filter((path) => !path.includes(join("lib", "extraction")))
    .filter((path) => !read(path).includes('"use client"'));
}

describe("no route accepts a file", () => {
  it("has at least one route handler to check, so this test means something", () => {
    const routes = filesUnder("app").filter((path) => path.endsWith("route.ts"));

    expect(routes.length).toBeGreaterThan(0);
  });

  it("reads no request body anywhere on the server", () => {
    for (const path of serverModules()) {
      const source = read(path);

      expect(source, path).not.toMatch(/\.formData\s*\(/);
      expect(source, path).not.toMatch(/\.arrayBuffer\s*\(/);
      expect(source, path).not.toMatch(/\brequest\.body\b/);
      expect(source, path).not.toMatch(/\breq\.body\b/);
      expect(source, path).not.toMatch(/multipart\/form-data/);
    }
  });

  it("names no file type in a server module, because none ever arrives there", () => {
    for (const path of serverModules()) {
      const source = read(path);

      expect(source, path).not.toMatch(/\bnew File\b/);
      expect(source, path).not.toMatch(/\bBlob\b/);
      expect(source, path).not.toMatch(/application\/pdf/);
    }
  });
});

describe("extraction runs only in the browser", () => {
  const extraction = filesUnder(join("lib", "extraction"));

  it("is a real module tree, not an empty directory", () => {
    expect(extraction.length).toBeGreaterThanOrEqual(6);
  });

  it("never reaches the network: no fetch, no XHR, no WebSocket, no form post", () => {
    for (const path of extraction) {
      const source = read(path);

      expect(source, path).not.toMatch(/\bfetch\s*\(/);
      expect(source, path).not.toMatch(/XMLHttpRequest/);
      expect(source, path).not.toMatch(/WebSocket/);
      expect(source, path).not.toMatch(/navigator\.sendBeacon/);
      /* pdf.js can be handed a URL to download instead of bytes. It never is. */
      expect(source, path).not.toMatch(/getDocument\(\s*["'`]/);
      expect(source, path).not.toMatch(/\burl\s*:/);
    }
  });

  it("is imported only by modules that carry the client directive", () => {
    const importers = [...filesUnder("app"), ...filesUnder("components")].filter(
      (path) => /@\/lib\/extraction\//.test(read(path)),
    );

    expect(importers.length).toBeGreaterThan(0);
    for (const path of importers) {
      expect(read(path), path).toContain('"use client"');
    }
  });
});

describe("the intake form has nowhere to post to", () => {
  const source = read(join("components", "operate", "intake.tsx"));

  it("declares no action, no method and no encoding on its form", () => {
    expect(source).not.toMatch(/<form[^>]*\saction=/);
    expect(source).not.toMatch(/<form[^>]*\smethod=/);
    expect(source).not.toMatch(/enctype/);
  });

  it("stops the browser's own submission and reads the box itself", () => {
    expect(source).toContain("event.preventDefault()");
  });
});

describe("the pdf.js worker served from public/ matches the installed parser", () => {
  /* The worker is loaded by URL rather than imported, so no bundler checks that
     the copy is current. A parser and a worker from different versions fail at
     run time in the browser and nowhere else. */
  it("is byte-identical to the one in node_modules", () => {
    const served = readFileSync("public/pdfjs/pdf.worker.min.mjs");
    const installed = readFileSync(
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    );

    expect(served.equals(installed)).toBe(true);
  });
});
