/* Where a source sentence sits in the reader's own document.
 *
 *     sourceWindows(documentText, sentence) -> readonly SourceWindow[]
 *
 * A flag carries its sentence and nothing else about where the sentence came
 * from: ADR 0001 rejected citing a location, because section numbering is often
 * absent, duplicated or wrong in extracted text, and a pointer is not something a
 * reader can search their own copy for. So the surrounding context is worked out
 * here, at the display layer, out of the two things the screen already has — the
 * sentence and the text it was analysed against. How much context is enough to
 * judge whether a sentence was read fairly is a display question, and keeping it
 * here is what stops the boundary from answering it (ticket 04, comments).
 *
 * WHY EVERY OCCURRENCE, NOT THE FIRST
 *
 * `indexOf` finds one. A contract that repeats a sentence — the same indemnity
 * wording under two schedules, a guarantee restated in an execution block — makes
 * the first hit a guess about which passage the flag came from, and a guess
 * presented as a location is the kind of claim this product does not make. So
 * every occurrence is returned, numbered, and the screen shows them all and says
 * there was more than one. Nothing here decides which is the real one, because
 * nothing here knows.
 *
 * THE MATCH IS THE GATE'S MATCH
 *
 * A plain substring search of the sentence exactly as the flag carries it: not
 * normalised, not trimmed, not case-folded, no whitespace collapsed. The same
 * comparison `lib/analysis/citation-gate.ts` makes, on purpose — a window found by
 * a looser rule than the gate's would show a reader a passage that is not the one
 * the citation was checked against. When the two texts disagree the honest answer
 * is no window at all, and the caller says so rather than showing an approximate
 * one.
 */

/** How much text is carried either side of the sentence, before the window is
 *  trimmed back to a boundary a reader can read from.
 *
 * Enough for the clause the sentence sits in and usually its neighbour, which is
 * what "was it read fairly" is judged against: a sentence that limits the one
 * before it, or a carve-out in the next, changes what the flag means. Not so much
 * that the window becomes the document — the whole extracted text is already on
 * the screen above. */
export const CONTEXT_CHARACTERS = 420;

export type SourceWindow = {
  /** 1-based, in document order. */
  readonly occurrence: number;
  /** How many times the sentence occurs in the whole text. */
  readonly occurrences: number;
  /** Where the sentence starts in the document text. */
  readonly index: number;
  /** The text immediately before the sentence, inside the window. */
  readonly before: string;
  /** The sentence, exactly as the flag carries it. */
  readonly sentence: string;
  /** The text immediately after the sentence, inside the window. */
  readonly after: string;
  /** True when text was cut off at that end of the window, so the screen can say
   *  the passage continues rather than implying the document starts there. */
  readonly cutBefore: boolean;
  readonly cutAfter: boolean;
};

/** Every index at which the sentence occurs, in document order.
 *
 * Non-overlapping and left to right. An empty sentence occurs nowhere, rather
 * than everywhere: the gate has already dropped a flag that quotes nothing, and
 * answering "position 0" for one would put a window around a sentence that does
 * not exist. */
export function occurrencesOf(
  documentText: string,
  sentence: string,
): readonly number[] {
  if (sentence.length === 0) return [];

  const found: number[] = [];
  let from = 0;
  for (;;) {
    const at = documentText.indexOf(sentence, from);
    if (at === -1) return found;
    found.push(at);
    from = at + sentence.length;
  }
}

/** Where the window opens: the earliest clean boundary inside reach.
 *
 * The *earliest*, not the nearest. A quoted sentence usually has a line break
 * immediately before it, so the nearest boundary would open the window on the
 * sentence itself and show no context at all — which is the one thing this
 * function exists to provide. Opening at the first boundary inside the margin
 * keeps the clause above the sentence and usually the one above that, while still
 * starting somewhere a reader can start reading. */
function openAt(documentText: string, sentenceStart: number, margin: number): number {
  const reach = Math.max(0, sentenceStart - margin);
  if (reach === 0) return 0;

  const run = documentText.slice(reach, sentenceStart);

  const paragraph = run.indexOf("\n");
  if (paragraph !== -1) return reach + paragraph + 1;

  const sentenceEnd = Math.min(
    ...[run.indexOf(". "), run.indexOf("? "), run.indexOf("! ")]
      .filter((at) => at !== -1)
      .concat(Number.POSITIVE_INFINITY),
  );
  if (Number.isFinite(sentenceEnd)) return reach + sentenceEnd + 2;

  const word = run.indexOf(" ");
  if (word !== -1) return reach + word + 1;

  return reach;
}

/** Where the window closes: the latest clean boundary inside reach, which is the
 *  mirror of `openAt` and keeps as much of what follows as fits. */
function closeAt(documentText: string, sentenceEnd: number, margin: number): number {
  const reach = Math.min(documentText.length, sentenceEnd + margin);
  if (reach === documentText.length) return documentText.length;

  const run = documentText.slice(sentenceEnd, reach);

  const paragraph = run.lastIndexOf("\n");
  if (paragraph !== -1) return sentenceEnd + paragraph;

  const closing = Math.max(
    run.lastIndexOf(". "),
    run.lastIndexOf("? "),
    run.lastIndexOf("! "),
  );
  if (closing !== -1) return sentenceEnd + closing + 1;

  const word = run.lastIndexOf(" ");
  if (word !== -1) return sentenceEnd + word;

  return reach;
}

/** The sentence in its surroundings, once per occurrence.
 *
 * Empty when the sentence does not occur in this text at all. Past the citation
 * gate that cannot happen for the text the analysis was produced from; it can
 * happen when a screen is holding a different extraction than the one that was
 * analysed, and an empty list is how the screen is told to say so. */
export function sourceWindows(
  documentText: string,
  sentence: string,
  margin: number = CONTEXT_CHARACTERS,
): readonly SourceWindow[] {
  const indexes = occurrencesOf(documentText, sentence);

  return indexes.map((index, position) => {
    const end = index + sentence.length;
    const opens = openAt(documentText, index, margin);
    const closes = closeAt(documentText, end, margin);

    return {
      occurrence: position + 1,
      occurrences: indexes.length,
      index,
      before: documentText.slice(opens, index),
      sentence,
      after: documentText.slice(end, closes),
      cutBefore: opens > 0,
      cutAfter: closes < documentText.length,
    };
  });
}
