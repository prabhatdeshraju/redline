/* jsdom 30 does not implement window.matchMedia, which every browser has.
   This stands in for it: no query matches unless a test replaces this with
   its own stub, so the default is the same "no preference" a plain browser
   reports. It substitutes for the environment, never for anything under test. */

export function stubMatchMedia(matches: (query: string) => boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        matches: matches(query),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}

/* Only in a DOM environment. A file that declares `@vitest-environment node` —
   the extraction integration tests, which parse real files and touch no DOM —
   has no window to stand in for. */
if (typeof window !== "undefined") {
  stubMatchMedia(() => false);
}
