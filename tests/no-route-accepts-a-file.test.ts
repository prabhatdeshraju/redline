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

/** The two trees under `lib/` that this guard does not scan. Each is excluded
 *  for a reason that is asserted further down rather than taken on trust, because
 *  an exclusion nobody checks is how a guard quietly stops covering things.
 *
 * `lib/extraction` — the one tree proved never to run on the server by other
 * means: the test below asserts nothing imports it except modules carrying the
 * client directive. It is the module that reads the file, so it is the one place
 * `arrayBuffer` is allowed to appear at all.
 *
 * `lib/harness` — the labelled corpus and the citation harness. It is Node-only
 * development machinery: it reads corpus fixtures off the disk and hands them to
 * the extraction boundary as a `File`, which is exactly what it has to do to
 * measure the boundary the reader's browser uses. It ships in no bundle, which is
 * asserted by "the harness is not part of what ships" below. No file a reader
 * chose reaches it: the files it opens are paths out of
 * `tests/corpus/manifest.json`, committed to this repository. */
const NOT_SHIPPED = [join("lib", "extraction"), join("lib", "harness")];

/** Every module that runs on the server: route handlers, pages and layouts
 *  without the client directive, server actions, the proxy, and the lib modules
 *  those reach. */
function serverModules(): string[] {
  return [...filesUnder("app"), ...filesUnder("lib"), "proxy.ts"]
    .filter((path) => !NOT_SHIPPED.some((excluded) => path.includes(excluded)))
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

describe("the guard's own exclusions", () => {
  it("names trees that exist and have modules in them", () => {
    /* A renamed or deleted tree would leave an exclusion matching nothing, or —
       worse, if it were a prefix of something new — matching more than it was
       written for. */
    for (const excluded of NOT_SHIPPED) {
      expect(filesUnder(excluded).length, excluded).toBeGreaterThanOrEqual(2);
    }
  });

  it("leaves something to scan, so the guard above is not vacuous", () => {
    expect(serverModules().length).toBeGreaterThan(5);
  });
});

describe("the harness is not part of what ships", () => {
  /* This is what earns `lib/harness` its exclusion from the guard above. The
     harness may construct a `File`; it may not become reachable from anything the
     product serves. */
  const harness = filesUnder(join("lib", "harness"));

  it("is a real module tree, not an empty directory", () => {
    expect(harness.length).toBeGreaterThanOrEqual(2);
  });

  it("is imported by nothing the product serves", () => {
    const shipped = [...filesUnder("app"), ...filesUnder("components"), "proxy.ts"];

    expect(shipped.length).toBeGreaterThan(5);
    for (const path of shipped) {
      expect(read(path), path).not.toMatch(/@\/lib\/harness\b/);
      expect(read(path), path).not.toMatch(/lib\/harness\//);
    }
  });

  it("is imported by nothing in lib that does ship", () => {
    for (const path of filesUnder("lib")) {
      if (path.includes(join("lib", "harness"))) continue;

      expect(read(path), path).not.toMatch(/lib\/harness\b/);
    }
  });

  it("does not reach the network either", () => {
    for (const path of harness) {
      const source = read(path);

      expect(source, path).not.toMatch(/\bfetch\s*\(/);
      expect(source, path).not.toMatch(/XMLHttpRequest/);
      expect(source, path).not.toMatch(/WebSocket/);
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
