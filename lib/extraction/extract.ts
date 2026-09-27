/* The extraction boundary.
 *
 *     extractDocument(source) -> ExtractionOutcome
 *
 * One entry point. A file the reader chose, or text they pasted, in; the
 * document's text and the diagnostics that say what had to be repaired, out —
 * or a refusal that says why.
 *
 * This is one of the two seams the spec names. Everything about faithful text
 * recovery lives behind it: page breaks, column order, hyphenation at line ends,
 * ligatures, running headers interrupting a sentence. When a quoted sentence
 * later fails to match the reader's own copy, the defect is behind this
 * boundary, and the fix belongs here rather than in loosening the match
 * (ADR 0001).
 *
 * It runs in the reader's browser, and only in the reader's browser. Nothing in
 * this module, or anything it imports, can send the file anywhere: no fetch, no
 * form submission, no route. Only the text it returns goes on, and the caller is
 * what decides whether even that happens.
 */

import { parseDocx } from "./docx";
import { maxExtractedCharacters } from "./limits";
import { normaliseRecoveredText } from "./normalise";
import {
  refusal,
  type Extraction,
  type ExtractionFormat,
  type ExtractionOutcome,
} from "./outcome";
import { parsePdf } from "./pdf";
import { recoverText, type RecoveryDiagnostics } from "./text-recovery";

export type ExtractionSource =
  | { readonly kind: "file"; readonly file: File }
  | { readonly kind: "pasted-text"; readonly text: string };

export type ExtractionOptions = {
  /** Overrides the deployment's character cap. Exists so the limit can be
   *  exercised without a quarter of a million characters of fixture. */
  readonly maxCharacters?: number;
};

/** A document with less text in it than this did not parse — a one-page
 *  agreement runs to thousands of characters. Below it, "extracted" would be a
 *  lie dressed as a result. */
const NOTHING_RECOVERED = 1;

const EMPTY_DIAGNOSTICS: RecoveryDiagnostics = {
  pages: 0,
  pagesWithoutText: [],
  multiColumnPages: [],
  runningLinesRemoved: [],
  hyphenationsJoined: 0,
  hyphensKept: 0,
  sentencesJoinedAcrossPages: 0,
  ligaturesDecomposed: 0,
};

/** What kind of file this is, by extension and by the type the browser
 *  reported. Extension wins, because it is what the reader can see. */
export function formatOfFile(file: File): ExtractionFormat | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".txt") || name.endsWith(".md")) return "plain-text";

  switch (file.type) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "text/plain":
    case "text/markdown":
      return "plain-text";
    default:
      return null;
  }
}

/** The file types the intake control offers, as an `accept` attribute. */
export const ACCEPTED_FILE_TYPES =
  ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export async function extractDocument(
  source: ExtractionSource,
  options: ExtractionOptions = {},
): Promise<ExtractionOutcome> {
  const limit = options.maxCharacters ?? maxExtractedCharacters();

  if (source.kind === "pasted-text") {
    return finish(
      {
        format: "pasted-text",
        documentName: null,
        text: normaliseRecoveredText(source.text),
        diagnostics: { ...EMPTY_DIAGNOSTICS, imageOnlyPages: [] },
      },
      limit,
    );
  }

  const { file } = source;
  const format = formatOfFile(file);
  if (format === null || format === "pasted-text") {
    return {
      outcome: "refused",
      refusal: refusal("unsupported-file", {
        documentName: file.name,
        fileName: file.name,
      }),
    };
  }

  if (format === "plain-text") {
    const text = normaliseRecoveredText(await file.text());
    return finish(
      {
        format,
        documentName: file.name,
        text,
        diagnostics: { ...EMPTY_DIAGNOSTICS, imageOnlyPages: [] },
      },
      limit,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (format === "docx") {
    let parsed;
    try {
      parsed = await parseDocx(bytes);
    } catch {
      return {
        outcome: "refused",
        refusal: refusal("file-would-not-open", { documentName: file.name }),
      };
    }
    return finish(
      {
        format,
        documentName: file.name,
        text: parsed.text,
        diagnostics: { ...EMPTY_DIAGNOSTICS, imageOnlyPages: [] },
      },
      limit,
    );
  }

  let parsed;
  try {
    parsed = await parsePdf(bytes);
  } catch {
    return {
      outcome: "refused",
      refusal: refusal("file-would-not-open", { documentName: file.name }),
    };
  }

  /* A scan is refused before its text is looked at, not after. OCR is out of
     scope on purpose: a citation is worthless when the text it points at was
     misread, and the reader cannot see that it was (ADR 0001). */
  const pages = parsed.pages.length;
  if (parsed.imageOnlyPages.length > 0) {
    const everyPage = parsed.imageOnlyPages.length === pages;
    return {
      outcome: "refused",
      refusal: refusal(
        everyPage ? "no-text-layer" : "part-of-the-document-is-a-scan",
        {
          documentName: file.name,
          imageOnlyPages: parsed.imageOnlyPages,
          pages,
        },
      ),
    };
  }

  const recovered = recoverText(parsed.pages);
  return finish(
    {
      format,
      documentName: file.name,
      text: recovered.text,
      diagnostics: { ...recovered.diagnostics, imageOnlyPages: [] },
    },
    limit,
  );
}

/** The two checks every path shares: was anything recovered, and is it short
 *  enough to carry. Both are refusals rather than adjustments — nothing is ever
 *  truncated here. */
function finish(
  extraction: Omit<Extraction, "characters">,
  limit: number,
): ExtractionOutcome {
  const characters = extraction.text.length;

  if (characters < NOTHING_RECOVERED) {
    return {
      outcome: "refused",
      refusal: refusal("no-text-in-the-document", {
        documentName: extraction.documentName,
      }),
    };
  }

  if (characters > limit) {
    return {
      outcome: "refused",
      refusal: refusal("too-long", {
        documentName: extraction.documentName,
        characters,
        limit,
      }),
    };
  }

  return { outcome: "extracted", extraction: { ...extraction, characters } };
}
