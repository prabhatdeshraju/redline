/* @vitest-environment node
 *
 * One place in this product talks to a model — structurally, not just today.
 *
 * The spec puts the analysis boundary in sole charge of model access, "so there is
 * exactly one place where grounding discipline has to hold". That is a rule about
 * where code may live, and a rule like that survives the next feature only if
 * something reads the source and fails. `tests/no-route-accepts-a-file.test.ts`
 * does the same job for the guarantee that a file never leaves the browser; this
 * is its counterpart for model access.
 *
 * What the guard is protecting, concretely:
 *
 *   - a second caller would be a second place a model can be asked for something
 *     that is not in the reader's document, which is the one thing this product
 *     exists to rule out
 *   - a model identifier written into code, as a default or a fallback, would
 *     attribute an analysis to a model nobody chose
 *   - a key read in two places is a key that leaks from the one nobody checked
 *   - and the boundary can only be tested without a key if it never reaches for a
 *     client of its own
 *
 * `tests/` is not scanned. Nothing under it ships, and the suite's own model
 * client — the authorised stub, answering out of the labelled sidecars — has to be
 * allowed to exist.
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

/** The one module allowed to talk to a model. */
const MODEL_CLIENT = join("lib", "model", "openrouter.ts");

/** Everything the product serves, plus the development scripts that run it. */
function sourceModules(): string[] {
  return [
    ...filesUnder("app"),
    ...filesUnder("components"),
    ...filesUnder("lib"),
    ...filesUnder("scripts"),
    "proxy.ts",
  ];
}

const everythingElse = (): string[] =>
  sourceModules().filter((path) => path !== MODEL_CLIENT);

/** What only the model client may contain. Each is a way of reaching a model, or
 *  a piece of the credentials for doing so. */
const ONLY_IN_THE_MODEL_CLIENT: readonly (readonly [string, RegExp])[] = [
  /* An outbound call. Deliberately broader than model access: nothing in this
     product's own source makes one except the model client, and if that ever has
     to change, the change belongs in this list with a reason beside it rather
     than in a file nobody looked at. */
  ["an outbound network call", /\bfetch\s*\(/],
  ["the model endpoint's host", /openrouter\.ai/],
  ["the chat-completions path", /chat\/completions/],
  ["a model environment variable", /\bOPENROUTER_[A-Z_]+/],
  ["the structured-output mechanism", /response_format/],
  ["a credential header", /\bAuthorization\b/],
  ["a bearer token", /\bBearer\b/],
];

describe("only one module talks to a model", () => {
  it("has that module, and it is a real one", () => {
    expect(sourceModules()).toContain(MODEL_CLIENT);
    expect(read(MODEL_CLIENT).length).toBeGreaterThan(2000);
  });

  it("is the only module that reaches a model or carries a credential", () => {
    for (const [what, pattern] of ONLY_IN_THE_MODEL_CLIENT) {
      for (const path of everythingElse()) {
        expect(read(path), `${path} contains ${what}`).not.toMatch(pattern);
      }
    }
  });

  it("puts every one of those things in that module, so the guard is not vacuous", () => {
    /* If the model client stopped containing these, the loop above would pass by
       matching nothing anywhere and the rule would have quietly stopped being
       about anything. */
    const source = read(MODEL_CLIENT);
    for (const [what, pattern] of ONLY_IN_THE_MODEL_CLIENT) {
      expect(source, `the model client no longer contains ${what}`).toMatch(
        pattern,
      );
    }
  });

  it("leaves a substantial tree to scan", () => {
    expect(everythingElse().length).toBeGreaterThan(20);
  });

  it("is the only shape of outbound call anywhere: no XHR, no socket, no beacon", () => {
    /* Not on the exception list above, because the model client does not use any
       of these either. There is one way out of this product and it is the one
       `fetch` in that module. */
    for (const path of sourceModules()) {
      const source = read(path);

      expect(source, path).not.toMatch(/XMLHttpRequest/);
      expect(source, path).not.toMatch(/new WebSocket/);
      expect(source, path).not.toMatch(/navigator\.sendBeacon/);
    }
  });
});

describe("the model identifier is never written into code", () => {
  /* Not as a default, not as a fallback, not as an example in a comment. It comes
     from the environment and the environment only, because an analysis attributed
     to a model nobody chose is worse than an analysis that did not run. */
  const MODEL_IDENTIFIER =
    /\b(anthropic|openai|google|meta-llama|mistralai|deepseek|qwen|x-ai|amazon|cohere|perplexity|nousresearch)\/[a-z0-9]/i;

  it("appears in no module, the model client included", () => {
    for (const path of sourceModules()) {
      expect(read(path), path).not.toMatch(MODEL_IDENTIFIER);
    }
  });
});

describe("the analysis boundary is handed its model client", () => {
  const BOUNDARY = join("lib", "analysis", "boundary.ts");
  const importsTheClient = (source: string): boolean =>
    /@\/lib\/model\/openrouter/.test(source);

  it("imports the seam and no implementation of it", () => {
    const source = read(BOUNDARY);

    expect(source).toMatch(/@\/lib\/model\/model-client/);
    expect(importsTheClient(source)).toBe(false);
  });

  it("is wired to the real client in exactly one module the product ships", () => {
    const wiring = [...filesUnder("app"), ...filesUnder("components"), ...filesUnder("lib")]
      .filter((path) => path !== MODEL_CLIENT)
      .filter((path) => importsTheClient(read(path)));

    expect(wiring).toEqual([join("lib", "analysis", "redline-analyser.ts")]);
  });

  it("is not reachable from the interface: no screen builds a client", () => {
    for (const path of [...filesUnder("app"), ...filesUnder("components")]) {
      expect(read(path), path).not.toMatch(/@\/lib\/model\//);
    }
  });

  it("is asked about configuration by the scripts, never asked for a client", () => {
    /* The harness script names the analyser module and reports whether the
       environment is configured. It does not build a client of its own, because
       then there would be two wirings to keep honest. */
    for (const path of filesUnder("scripts")) {
      const source = read(path);

      expect(source, path).not.toMatch(/createOpenRouterClient/);
      expect(source, path).not.toMatch(/modelClientFromEnvironment/);
    }
  });
});
