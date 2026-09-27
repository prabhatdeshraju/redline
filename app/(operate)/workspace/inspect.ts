"use server";

/* Asking for a document to be inspected.
 *
 * The one way the interface reaches the analysis. It is a server function rather
 * than a browser call for the reason the whole product turns on: the boundary
 * holds the model key, and a key that is reachable from the browser is a key that
 * is in the client bundle. Nothing here names a key, a model identifier or an
 * endpoint — `lib/analysis/redline-analyser.ts` is the only module in this
 * repository that wires the model client, and
 * `tests/one-place-talks-to-a-model.test.ts` fails if a screen or a route ever
 * reaches past it.
 *
 * WHAT CROSSES
 *
 * A string of text, and nothing else. The document was read in the reader's own
 * browser (ticket 02) and the file never leaves it: there is no `File` here, no
 * `formData`, no multipart encoding, and `tests/no-route-accepts-a-file.test.ts`
 * asserts that there is nowhere on the server for a file to go. The intake screen
 * promises the reader that only the extracted text is sent to be inspected, and
 * this is that promise in code.
 *
 * WHAT COMES BACK
 *
 * `FlagAnalysis`, as the boundary returns it: either an analysis whose every flag
 * can produce its source sentence out of the text that was sent, or one failure
 * carrying one sentence saying what happened. A failure is never an empty list of
 * flags, so the screen cannot render "we could not look" as "we found nothing"
 * (`PRD.md` §4.4, ADR 0004). Both halves of the union are plain data, which is
 * what a server function is allowed to hand back.
 *
 * No thresholds are passed: the reader's own red lines are a later ticket, and
 * the boundary's default is none.
 */

import type { FlagAnalysis } from "@/lib/analysis/boundary";
import { createBoundary } from "@/lib/analysis/redline-analyser";

export async function inspectDocumentText(
  documentText: string,
): Promise<FlagAnalysis> {
  return createBoundary().flags(documentText);
}
