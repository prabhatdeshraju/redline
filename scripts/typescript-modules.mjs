/* Lets `node` run this repository's TypeScript directly.
 *
 *     node --import ./scripts/typescript-modules.mjs scripts/harness.ts
 *
 * Node 24 strips the types out of a `.ts` file on its own. What it does not do
 * is resolve the two import shapes this repository writes everywhere: a bare
 * relative path with no extension (`./taxonomy`), and the `@/` alias for the
 * repository root that `tsconfig.json` and `vitest.config.ts` both define.
 *
 * This hook resolves those two, and nothing else. It exists so that the harness
 * can import the citation gate as product code rather than a copy of it, and so
 * that no build step, dependency or second dialect of import path is needed to
 * run it.
 */

import { register } from "node:module";

register(new URL("./typescript-resolver.mjs", import.meta.url));
