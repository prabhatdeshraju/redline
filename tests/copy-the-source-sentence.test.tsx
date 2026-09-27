/* The reader copies the quoted sentence and pastes it into their own search.
 *
 * Ticket 04 criterion 3, and it is only worth anything if what lands on the
 * clipboard is the sentence byte for byte: a sentence with a straightened
 * apostrophe, a collapsed double space or a stray quotation mark around it finds
 * nothing in the reader's own copy of the document, and a citation you cannot
 * search for is the thing ADR 0001 exists to prevent.
 *
 * So this drives the real control inside the real flag screen, rendered from the
 * real analysis boundary over `tests/fixtures/negotiable-flagged.txt`, and reads
 * back what the browser was handed. The only stand-in is the clipboard itself,
 * which jsdom does not implement — the same kind of substitution as
 * `tests/setup.ts`'s matchMedia, for the environment rather than for anything
 * under test.
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { InspectionView, stageOf } from "@/components/operate/inspection";
import { createAnalysisBoundary } from "@/lib/analysis/boundary";
import { loadCorpus, repositoryRoot } from "@/lib/harness/corpus";

import { modelClientFromSidecars } from "./model/from-the-sidecars";

import { readFileSync } from "node:fs";
import { join } from "node:path";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const root_ = repositoryRoot();
const documentText = readFileSync(
  join(root_, "tests", "fixtures", "negotiable-flagged.txt"),
  "utf8",
);

const analysis = await createAnalysisBoundary({
  model: modelClientFromSidecars({ corpus: loadCorpus(root_) }),
}).flags(documentText);

if (analysis.outcome !== "analysed") {
  throw new Error("the boundary produced no analysis to render");
}
const [flag] = analysis.analysis.flags;
if (flag === undefined) {
  throw new Error("the fixture produced no flag, so there is no sentence to copy");
}

/** What the clipboard was handed, in order. */
let written: string[] = [];

function clipboardThat(write: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: { writeText: write },
  });
}

let container: HTMLDivElement;
let root: Root;

function render(): void {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <InspectionView stage={stageOf(analysis)} documentText={documentText} />,
    );
  });
}

function copyControl(): HTMLButtonElement {
  const found = Array.prototype.slice
    .call(container.querySelectorAll<HTMLButtonElement>("button"))
    .find((button: HTMLButtonElement) =>
      (button.textContent ?? "").includes("Copy the sentence"),
    ) as HTMLButtonElement | undefined;
  if (!found) throw new Error("no copy control beside the source sentence");
  return found;
}

function status(): string {
  const region = container.querySelector('[role="status"]');
  return region?.textContent ?? "";
}

beforeEach(() => {
  written = [];
  clipboardThat(async (text) => {
    written.push(text);
  });
  render();
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe("copying the source sentence", () => {
  it("sits beside the sentence it copies", () => {
    const figure = container.querySelector(".source");

    expect(figure).not.toBeNull();
    expect(figure?.contains(copyControl())).toBe(true);
  });

  it("puts the sentence on the clipboard, byte for byte", async () => {
    await act(async () => {
      copyControl().click();
    });

    expect(written).toHaveLength(1);
    expect(written[0]).toBe(flag.sourceSentence);
    /* The whole point of the control: what was copied is searchable in the
       reader's own copy of the document. */
    expect(documentText.includes(written[0])).toBe(true);
    /* And carries the characters that break a loosened match. */
    expect(written[0]).toMatch(/’/);
  });

  it("copies no quotation marks of Redline's own around it", async () => {
    await act(async () => {
      copyControl().click();
    });

    expect(written[0].startsWith("“")).toBe(false);
    expect(written[0].endsWith("”")).toBe(false);
    expect(written[0].startsWith('"')).toBe(false);
    expect(written[0]).toBe(written[0].trim());
  });

  it("says it copied, and how many characters, so the reader knows it happened", async () => {
    expect(status()).toBe("");

    await act(async () => {
      copyControl().click();
    });

    expect(status()).toContain("Copied");
    expect(status()).toContain(String(flag.sourceSentence.length));
  });

  it("says so when the browser will not allow it, rather than appearing to work", async () => {
    clipboardThat(async () => {
      throw new Error("the document is not focused");
    });

    await act(async () => {
      copyControl().click();
    });

    expect(written).toHaveLength(0);
    expect(status()).toContain("did not allow copying");
    expect(status()).toContain("copy it with your keyboard");
  });

  it("says so when the browser has no clipboard at all", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    await act(async () => {
      copyControl().click();
    });

    expect(status()).toContain("did not allow copying");
  });
});

describe("the flag row as a disclosure control", () => {
  it("is open before anything is clicked, sentence and all", () => {
    const body = container.querySelector<HTMLElement>(".flag__body");

    expect(body).not.toBeNull();
    expect(body?.hidden).toBe(false);
    expect(body?.textContent).toContain(flag.sourceSentence);
  });

  it("collapses and reopens when the row is pressed", () => {
    const toggle = container.querySelector<HTMLButtonElement>(".flag__toggle");
    if (!toggle) throw new Error("no flag row control");

    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    act(() => {
      toggle.click();
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector<HTMLElement>(".flag__body")?.hidden).toBe(true);

    act(() => {
      toggle.click();
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector<HTMLElement>(".flag__body")?.hidden).toBe(false);
  });
});
