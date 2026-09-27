/* How much text Redline will carry, and why that number.
 *
 * The cap is on extracted characters — not bytes, not pages. Bytes vary with
 * encoding and tell you nothing about how much document there is; pages vary
 * with type size. Characters are what the analysis boundary is actually given.
 */

/** Roughly 60,000 tokens of English prose, which leaves room inside a typical
 *  context window for the analysis instructions and the analysis itself. Past
 *  this a document is refused, with its length and this limit both stated,
 *  because an analysis that quietly ignored half a contract is worse than no
 *  analysis: every clause it never read comes back as an all-clear. */
export const MAX_EXTRACTED_CHARACTERS = 250_000;

/* Read statically so Next can inline it into the browser bundle, where
   extraction runs. */
const CONFIGURED = process.env.NEXT_PUBLIC_MAX_EXTRACTED_CHARACTERS;

/** The cap this deployment is running, which is
 *  {@link MAX_EXTRACTED_CHARACTERS} unless
 *  `NEXT_PUBLIC_MAX_EXTRACTED_CHARACTERS` overrides it. Tuning the number does
 *  not need a code change; a value that is not a positive whole number is
 *  ignored rather than obeyed, because a cap of zero would refuse every
 *  document. */
export function maxExtractedCharacters(): number {
  const configured = Number(CONFIGURED);
  if (Number.isInteger(configured) && configured > 0) return configured;
  return MAX_EXTRACTED_CHARACTERS;
}
