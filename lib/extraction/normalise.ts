/* The character-level rule, written down.
 *
 * Every flag Redline shows quotes a sentence the reader is expected to find in
 * their own copy by searching for it (ADR 0001). That only works if the
 * characters we recover are the characters their document shows them. So this
 * module has exactly one job: change the characters that are an artefact of how
 * the file was *encoded*, and change nothing that is an artefact of how the
 * document was *written*.
 *
 * CHANGED — encoding artefacts:
 *
 *   Ligatures are decomposed to their ASCII sequences: ﬀ→ff, ﬁ→fi, ﬂ→fl,
 *   ﬃ→ffi, ﬄ→ffl, ﬅ→st, ﬆ→st. A typeface with an fi ligature stores one
 *   character where the writer typed two; the reader searching their own copy
 *   types "fi", and "conﬁdential" would never match "confidential".
 *
 *   Space-like characters become a plain space: no-break space, the en/em
 *   quad family, thin and hair spaces, narrow no-break space, medium
 *   mathematical space, ideographic space, and the tab. A PDF emits these
 *   where the writer pressed the space bar.
 *
 *   Invisible characters are dropped: soft hyphen, zero-width space,
 *   zero-width non-joiner and joiner, word joiner, byte-order mark. Nobody
 *   typed them and nobody can search for them.
 *
 *   Line and paragraph separators, and carriage returns, become newlines.
 *
 *   Runs of spaces collapse to one, and trailing spaces come off each line.
 *   Extraction infers a space from a gap between glyph positions, so a run of
 *   two or more is nearly always an inferred one rather than a typed one.
 *
 * NOT CHANGED — what the writer typed:
 *
 *   Curly quotation marks and apostrophes (’ ‘ “ ”) stay exactly as they are.
 *   Word puts them in documents by default, so they are in the reader's copy,
 *   and "individual’s" is what they will search for. Folding them to ASCII
 *   would break verbatim matching on the most common punctuation mark in a
 *   contract. `tests/fixtures/negotiable-flagged.txt` clause 13.2 carries one
 *   deliberately so the suite fails if this is ever reversed.
 *
 *   En and em dashes, ellipses, degree and currency signs, accented letters:
 *   all as typed.
 *
 * The rule in one line: decompose ligatures, do not fold punctuation.
 */

/** Ligature → the sequence the writer typed. æ, œ and ß are letters in their
 *  own right rather than typesetting artefacts, so they are not in here. */
const LIGATURE_MAP = new Map<string, string>([
  ["ﬀ", "ff"],
  ["ﬁ", "fi"],
  ["ﬂ", "fl"],
  ["ﬃ", "ffi"],
  ["ﬄ", "ffl"],
  ["ﬅ", "st"], // ﬅ — long s followed by t
  ["ﬆ", "st"], // ﬆ
]);

const LIGATURE_PATTERN = /[ﬀ-ﬆ]/g;

/** Characters a file uses where the writer pressed the space bar. */
const SPACE_LIKE =
  /[\t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;

/** Line and paragraph separators, which some producers emit where the writer
 *  pressed Return. Built from char codes because a literal U+2028 in source
 *  is itself a line break to a JavaScript parser. */
const SEPARATORS = new RegExp(
  `[${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`,
  "g",
);

/** Characters nobody typed and nobody can search for. */
const INVISIBLE = /[\u00AD\u200B-\u200D\u2060\uFEFF]/g;

/** Decompose ligatures only. Exported on its own because it is the rule most
 *  likely to be argued with, and it should be arguable against a test. */
export function decomposeLigatures(text: string): string {
  return text.replace(
    LIGATURE_PATTERN,
    (character) => LIGATURE_MAP.get(character) ?? character,
  );
}

/** How many ligature characters {@link decomposeLigatures} would change. */
export function countLigatures(text: string): number {
  let count = 0;
  for (const character of text) {
    if (LIGATURE_MAP.has(character)) count += 1;
  }
  return count;
}

/** The whole rule, applied to one run of recovered text. */
export function normaliseRecoveredText(text: string): string {
  return decomposeLigatures(text)
    .replace(INVISIBLE, "")
    .replace(/\r\n?/g, "\n")
    .replace(SEPARATORS, "\n")
    .replace(SPACE_LIKE, " ")
    .replace(/ {2,}/g, " ")
    .replace(/ +$/gm, "")
    .replace(/^ +/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
