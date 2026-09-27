/* The DOCX adapter.
 *
 * A DOCX has no pages and no line breaks — Word decides both when it lays the
 * document out — so none of the page-boundary or hyphenation repair work
 * applies. What it does have is the writer's own characters, ligatures and
 * typographic apostrophes included, which is why the character rule in
 * `normalise.ts` runs over this path too.
 *
 * Runs in the reader's browser. mammoth unzips the file in memory.
 */

import { normaliseRecoveredText } from "./normalise";

type Mammoth = typeof import("mammoth");

let loaded: Promise<Mammoth> | null = null;

function loadMammoth(): Promise<Mammoth> {
  loaded ??= import("mammoth").then(
    (module) => (module as unknown as { default?: Mammoth }).default ?? module,
  );
  return loaded;
}

export type ParsedDocx = {
  readonly text: string;
  /** Anything mammoth wanted to say about the file, kept for diagnostics. */
  readonly messages: readonly string[];
};

/** Read a DOCX's text.
 *
 * `arrayBuffer` and `buffer` are both passed because mammoth ships two entry
 * points and each accepts only one of them: the browser build reads
 * `arrayBuffer`, the Node build reads `buffer`. Passing both means this adapter
 * behaves identically in the browser it ships to and in the suite that tests it,
 * rather than being tested through a different code path than it runs.
 */
export async function parseDocx(bytes: Uint8Array): Promise<ParsedDocx> {
  const mammoth = await loadMammoth();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

  const result = await mammoth.extractRawText({
    arrayBuffer,
    buffer: arrayBuffer,
  } as unknown as Parameters<Mammoth["extractRawText"]>[0]);

  return {
    text: normaliseRecoveredText(result.value),
    messages: result.messages.map((message) => message.message),
  };
}
