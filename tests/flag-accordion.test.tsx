/* The accordion is progressive enhancement over markup that is already
   complete: these tests drive the real component in a real DOM, so the
   no-JS baseline and the enhanced behaviour are both held in place. */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import LandingPage from "@/app/page";
import { stubMatchMedia } from "./setup";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function flag(n: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`#flag-${n}`);
  if (!el) throw new Error(`no #flag-${n} in the rendered page`);
  return el;
}

function toggleOf(n: string): HTMLElement {
  const el = flag(n).querySelector<HTMLElement>(".flag__toggle");
  if (!el) throw new Error(`no toggle in #flag-${n}`);
  return el;
}

function bodyOf(n: string): HTMLElement {
  const el = flag(n).querySelector<HTMLElement>(".flag__body");
  if (!el) throw new Error(`no body in #flag-${n}`);
  return el;
}

function expanded(n: string): string | null {
  return toggleOf(n).getAttribute("aria-expanded");
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<LandingPage />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe("flag accordion", () => {
  it("marks the document as enhanced so the stylesheet can arm the strike", () => {
    expect(document.documentElement.classList.contains("js")).toBe(true);
  });

  it("collapses the secondary flags and leaves the lead flag open", () => {
    expect(expanded("01")).toBe("true");
    expect(flag("01").classList.contains("is-open")).toBe(true);
    expect(bodyOf("01").hidden).toBe(false);

    for (const n of ["02", "03"]) {
      expect(expanded(n)).toBe("false");
      expect(flag(n).classList.contains("is-open")).toBe(false);
      expect(bodyOf(n).hidden).toBe(true);
    }
  });

  it("opens one flag at a time", () => {
    act(() => {
      toggleOf("02").click();
    });

    expect(expanded("02")).toBe("true");
    expect(flag("02").classList.contains("is-open")).toBe(true);
    expect(bodyOf("02").hidden).toBe(false);
    expect(expanded("01")).toBe("false");
    expect(flag("01").classList.contains("is-open")).toBe(false);

    act(() => {
      toggleOf("03").click();
    });

    expect(expanded("03")).toBe("true");
    expect(expanded("02")).toBe("false");
    expect(expanded("01")).toBe("false");
  });

  it("closes a flag that is already open", () => {
    act(() => {
      toggleOf("01").click();
    });

    expect(expanded("01")).toBe("false");
    expect(flag("01").classList.contains("is-open")).toBe(false);
    expect(expanded("02")).toBe("false");
    expect(expanded("03")).toBe("false");
  });

  it("skips the height animation when reduced motion is asked for", () => {
    act(() => {
      root.unmount();
    });
    stubMatchMedia((q) => /prefers-reduced-motion:\s*reduce/.test(q));
    try {
      act(() => {
        root = createRoot(container);
        root.render(<LandingPage />);
      });

      act(() => {
        toggleOf("02").click();
      });

      // no transition to wait on: the close is committed immediately
      expect(expanded("02")).toBe("true");
      expect(bodyOf("02").hidden).toBe(false);
      expect(bodyOf("02").style.height).toBe("");
      expect(expanded("01")).toBe("false");
      expect(bodyOf("01").hidden).toBe(true);
      expect(bodyOf("01").style.height).toBe("");
    } finally {
      stubMatchMedia(() => false);
    }
  });

  it("restores the no-JS baseline when the enhancement is torn down", () => {
    act(() => {
      root.unmount();
    });

    expect(document.documentElement.classList.contains("js")).toBe(false);

    act(() => {
      root = createRoot(container);
      root.render(<LandingPage />);
    });
    expect(document.documentElement.classList.contains("js")).toBe(true);
  });
});
