/* The resolver half of `typescript-modules.mjs`. See the comment there. */

const ROOT = new URL("../", import.meta.url);

const SUFFIXES = [".ts", ".tsx", "/index.ts"];

export async function resolve(specifier, context, nextResolve) {
  const target = specifier.startsWith("@/")
    ? new URL(specifier.slice(2), ROOT).href
    : specifier;

  try {
    return await nextResolve(target, context);
  } catch (error) {
    const relative =
      target.startsWith(".") || target.startsWith("/") || target.startsWith("file:");
    if (!relative) throw error;
    for (const suffix of SUFFIXES) {
      try {
        return await nextResolve(target + suffix, context);
      } catch {
        /* try the next one */
      }
    }
    throw error;
  }
}
