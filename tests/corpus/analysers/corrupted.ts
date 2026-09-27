/* Analysers that are wrong in the three ways that matter.
 *
 * Each one takes a correct analysis and damages it. They are not mocks of the
 * harness or of the citation gate: they are real analysers, producing real
 * analyses, which the harness then runs end to end over the real corpus through
 * the real extraction boundary. What they prove is that the harness catches each
 * kind of damage and says which kind it was.
 *
 *   one character changed        the sentence is not in the document, so the flag
 *                               is dropped at the gate and counted as an
 *                               extraction defect (PRD.md §4.8)
 *   a sentence from another      also dropped, and the drop says the quoted
 *   document                     sentence belongs to a different text
 *   an all-clear on a document   nothing is dropped and nothing is wrong with any
 *   known to carry a guarantee   citation; the defect is on the analysis side, and
 *                               it is the one PRD.md §4.4 says must never happen
 */

import type { Analyser, Flag } from "@/lib/analysis/analysis";
import type { ClauseType } from "@/lib/analysis/taxonomy";

async function analysisOf(
  analyser: Analyser,
  documentText: string,
  thresholds: readonly string[],
): Promise<readonly Flag[]> {
  const analysis = await analyser(documentText, thresholds);
  return analysis.flags;
}

/** Changes one character of the quoted sentence of the first flag of this clause
 *  type — a single letter, mid-sentence, of the kind a model that paraphrases
 *  without noticing would produce. Everything else about the flag is correct. */
export function withOneCharacterChanged(
  analyser: Analyser,
  clauseType: ClauseType,
): Analyser {
  return async (documentText, thresholds) => {
    const flags = await analysisOf(analyser, documentText, thresholds);
    let done = false;
    return {
      flags: flags.map((flag) => {
        if (done || flag.clauseType !== clauseType) return flag;
        done = true;
        return { ...flag, sourceSentence: changeOneCharacter(flag.sourceSentence) };
      }),
    };
  };
}

function changeOneCharacter(sentence: string): string {
  const at = Math.floor(sentence.length / 2);
  const replacement = sentence[at] === "e" ? "a" : "e";
  return sentence.slice(0, at) + replacement + sentence.slice(at + 1);
}

/** Replaces the quoted sentence of the first flag of this clause type with a
 *  sentence quoted verbatim out of a different document. The sentence is real;
 *  the document it is in is not the one being analysed. */
export function withASentenceFromAnotherDocument(
  analyser: Analyser,
  clauseType: ClauseType,
  sentenceFromElsewhere: string,
): Analyser {
  return async (documentText, thresholds) => {
    const flags = await analysisOf(analyser, documentText, thresholds);
    let done = false;
    return {
      flags: flags.map((flag) => {
        if (done || flag.clauseType !== clauseType) return flag;
        done = true;
        return { ...flag, sourceSentence: sentenceFromElsewhere };
      }),
    };
  };
}

/** Returns an all-clear for whichever document contains this sentence, and
 *  behaves correctly on every other document. Pass it a sentence out of a
 *  document known to contain a personal guarantee and it produces the output
 *  `PRD.md` §4.4 calls the one that ends the company. */
export function withAnAllClearFor(
  analyser: Analyser,
  sentenceIdentifyingTheDocument: string,
): Analyser {
  return async (documentText, thresholds) => {
    if (documentText.includes(sentenceIdentifyingTheDocument)) {
      return { flags: [] };
    }
    return { flags: await analysisOf(analyser, documentText, thresholds) };
  };
}
