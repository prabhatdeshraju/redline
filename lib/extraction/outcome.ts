/* What crosses the extraction boundary.
 *
 * Two answers and nothing else: the document's text, or a refusal that says why
 * in words the reader can act on. There is no third state where extraction
 * half-worked, because a half-extracted document is the input that produces an
 * all-clear on a clause nobody read.
 *
 * Copy here follows ADR 0004: flat about what happened, hedged about what it
 * means, no verdict, and a reason rather than a code.
 */

import type { RecoveryDiagnostics } from "./text-recovery";

/** Where the text came from. Kept on the extraction because a citation is only
 *  valid against the extraction it was made from (ADR 0001, ADR 0005). */
export type ExtractionFormat = "pdf" | "docx" | "plain-text" | "pasted-text";

export type Extraction = {
  readonly format: ExtractionFormat;
  /** What the reader called the document: the file's name, or nothing when they
   *  pasted the text in. */
  readonly documentName: string | null;
  /** The document's text, as faithfully as this boundary could recover it. */
  readonly text: string;
  /** Length in characters. Shown to the reader before anything is sent, so a
   *  file that failed to parse is visible as a number that is far too small. */
  readonly characters: number;
  readonly diagnostics: ExtractionDiagnostics;
};

export type ExtractionDiagnostics = RecoveryDiagnostics & {
  /** Pages carrying an image and no text: the shape a scanned page has. Always
   *  empty on a successful extraction, because any such page is a refusal. */
  readonly imageOnlyPages: readonly number[];
};

export type ExtractionRefusalReason =
  /** Every page is an image. The document is a scan. */
  | "no-text-layer"
  /** Some pages are images and some are text. */
  | "part-of-the-document-is-a-scan"
  /** The file parsed, but there was nothing in it to read. */
  | "no-text-in-the-document"
  /** Longer than this deployment will carry. */
  | "too-long"
  /** Not a kind of file this boundary reads. */
  | "unsupported-file"
  /** The file would not open at all — truncated, encrypted, not what its name
   *  says it is. */
  | "file-would-not-open";

export type ExtractionRefusal = {
  readonly reason: ExtractionRefusalReason;
  readonly documentName: string | null;
  /** A short condensed-caps heading for the refusal state. */
  readonly heading: string;
  /** The reason, in the reader's terms. One or two sentences. */
  readonly explanation: string;
  /** What the reader can do instead. Never "try again". */
  readonly whatToDo: string;
  /** Present on "too-long": the document's length and the cap, both stated. */
  readonly characters?: number;
  readonly limit?: number;
  /** Present on the two scan refusals. */
  readonly imageOnlyPages?: readonly number[];
  readonly pages?: number;
};

export type ExtractionOutcome =
  | { readonly outcome: "extracted"; readonly extraction: Extraction }
  | { readonly outcome: "refused"; readonly refusal: ExtractionRefusal };

const listPages = (pages: readonly number[]): string => {
  if (pages.length === 1) return `page ${pages[0]}`;
  if (pages.length === 2) return `pages ${pages[0]} and ${pages[1]}`;
  return `pages ${pages.slice(0, -1).join(", ")} and ${pages.at(-1)}`;
};

/** Every refusal wording in one place, so the voice can be read and reviewed
 *  as a set rather than hunted through the code. */
export function refusal(
  reason: ExtractionRefusalReason,
  detail: {
    readonly documentName: string | null;
    readonly characters?: number;
    readonly limit?: number;
    readonly imageOnlyPages?: readonly number[];
    readonly pages?: number;
    readonly fileName?: string;
  },
): ExtractionRefusal {
  const base = {
    reason,
    documentName: detail.documentName,
    characters: detail.characters,
    limit: detail.limit,
    imageOnlyPages: detail.imageOnlyPages,
    pages: detail.pages,
  };

  switch (reason) {
    case "no-text-layer":
      return {
        ...base,
        heading: "This document is a scan",
        explanation:
          "Every page in this file is an image. There is no text underneath it, " +
          "so there is nothing here that can be quoted back to you word for word.",
        whatToDo:
          "Redline does not read text out of an image on purpose. Reading a " +
          "character wrongly produces a quotation that looks right and is not " +
          "in your document, which is the one mistake you could not catch. If " +
          "you can get the original from whoever sent it — a PDF made from a " +
          "word processor, or a DOCX — that file will have text in it.",
      };

    case "part-of-the-document-is-a-scan":
      return {
        ...base,
        heading: "Part of this document is a scan",
        explanation:
          `${detail.imageOnlyPages ? listPages(detail.imageOnlyPages) : "Some pages"} ` +
          `of ${detail.pages ?? "these"} carry an image and no text. The rest of ` +
          "the file has text in it.",
        whatToDo:
          "Redline will not inspect part of a document and report on it as " +
          "though it had read the whole thing: a clause on a page nobody read " +
          "comes back looking like a clause that is not there. Ask whoever sent " +
          "it for the original file rather than a scan of the print-out.",
      };

    case "no-text-in-the-document":
      return {
        ...base,
        heading: "Nothing was recovered from this file",
        explanation:
          "The file opened, and there was no text in it to read.",
        whatToDo:
          "If you expected words in it, the file may have been saved in a way " +
          "that keeps the words as a picture. Pasting the text in directly " +
          "always works.",
      };

    case "too-long":
      return {
        ...base,
        heading: "This document is longer than Redline carries",
        explanation:
          `It came to ${(detail.characters ?? 0).toLocaleString("en-US")} ` +
          `characters. Redline carries ${(detail.limit ?? 0).toLocaleString("en-US")}.`,
        whatToDo:
          "Nothing has been cut short and nothing has been sent. Redline will " +
          "not inspect the first part of a document and stay silent about the " +
          "rest, because the part it never read would look exactly like a part " +
          "with nothing in it. Bring the schedule or the section you are being " +
          "asked to sign, on its own.",
      };

    case "unsupported-file":
      return {
        ...base,
        heading: "Redline does not read this kind of file",
        explanation:
          `${detail.fileName ? `"${detail.fileName}"` : "This file"} is not a ` +
          "PDF, a DOCX or a plain text file.",
        whatToDo:
          "Bring a PDF or a DOCX, or paste the text of the agreement straight " +
          "into the box.",
      };

    case "file-would-not-open":
      return {
        ...base,
        heading: "This file would not open",
        explanation:
          "The file could not be read as the kind of file its name says it is. " +
          "It may be incomplete, or locked with a password.",
        whatToDo:
          "Nothing has been sent. If the file opens for you elsewhere, you can " +
          "copy the text out of it and paste it in instead.",
      };
  }
}
