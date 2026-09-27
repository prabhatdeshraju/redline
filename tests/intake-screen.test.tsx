/* What the reader sees on /workspace before, during and after a document is
 * read, and when one is refused.
 *
 * Rendered from the stage the intake screen can be in, which is the same value
 * the client component sets, so these are the screens the application serves.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { IntakeView, type IntakeStage } from "@/components/operate/intake";
import { WorkspaceShell } from "@/components/operate/workspace-shell";
import type { Extraction, ExtractionRefusal } from "@/lib/extraction/outcome";
import { refusal } from "@/lib/extraction/outcome";

function view(stage: IntakeStage): string {
  return renderToStaticMarkup(<IntakeView stage={stage} />);
}

const EXTRACTION: Extraction = {
  format: "pdf",
  documentName: "meridian-msa.pdf",
  text:
    "10.1 Contractor shall defend, indemnify and hold harmless Client from and " +
    "against any and all claims connected with the Services.\n\n" +
    "11.2 Client's total liability shall not exceed five hundred dollars ($500).",
  characters: 209,
  diagnostics: {
    pages: 3,
    pagesWithoutText: [],
    multiColumnPages: [{ pageNumber: 2, columns: 2 }],
    runningLinesRemoved: ["MERIDIAN HARBOR GROUP LLC - MASTER SERVICES AGREEMENT"],
    hyphenationsJoined: 8,
    hyphensKept: 1,
    sentencesJoinedAcrossPages: 1,
    ligaturesDecomposed: 8,
    imageOnlyPages: [],
  },
};

describe("the empty intake screen", () => {
  const html = view({ step: "waiting" });

  it("is the reviewed intake view from the static reference", () => {
    expect(html).toContain('class="intake"');
    expect(html).toContain('class="intake__head"');
    expect(html).toContain('class="intake__scope"');
    expect(html).toContain("Bring the document you are about to sign.");
  });

  it("offers all three ways in: paste, a file, and going ahead", () => {
    expect(html).toContain('id="paste"');
    expect(html).toContain('type="file"');
    expect(html).toContain("Choose a file…");
    expect(html).toContain("Read this document");
  });

  it("accepts a PDF, a DOCX and plain text, and nothing else", () => {
    expect(html).toContain(".pdf");
    expect(html).toContain(".docx");
    expect(html).toContain("text/plain");
    expect(html).not.toContain("image/");
  });

  it("states what leaves the machine before the reader has chosen anything", () => {
    expect(html).toContain("What leaves this machine");
    expect(html).toContain("It is read in your browser");
    expect(html).toContain("It is never uploaded");
    expect(html).toContain("the extracted text, and nothing else");
  });

  it("teaches what a negotiable document is, and what is out of scope", () => {
    expect(html).toContain("negotiable document");
    expect(html).toContain("Terms of service");
    expect(html).toContain("Scanned or photographed documents.");
  });

  it("does not submit anywhere: no action, no method, no multipart encoding", () => {
    expect(html).not.toContain("enctype");
    expect(html).toMatch(/<form class="intake__form">/);
  });
});

describe("while a document is being read", () => {
  it("says where the reading is happening", () => {
    const html = view({ step: "reading", documentName: "meridian-msa.pdf" });

    expect(html).toContain("Extracting the text of meridian-msa.pdf in your browser");
    expect(html).toContain('aria-live="polite"');
  });
});

describe("after a document is read", () => {
  const html = view({ step: "extracted", extraction: EXTRACTION });

  it("shows how much text was recovered, in figures", () => {
    expect(html).toContain("What was recovered");
    expect(html).toContain('<span class="tnum">209</span>');
    expect(html).toContain("characters of text were recovered");
  });

  it("shows the text itself, so a file that failed to parse is visible", () => {
    expect(html).toContain("10.1 Contractor shall defend");
    expect(html).toContain('class="extract"');
    expect(html).toContain('class="doc__cl"');
  });

  it("states what would leave the machine, with the exact count, before it does", () => {
    expect(html).toContain("What leaves this machine");
    expect(html).toContain("are the whole of what would be sent");
    expect(html).toContain("Nothing has been sent");
  });

  it("says what had to be repaired to recover continuous sentences", () => {
    expect(html).toContain("How this was read");
    expect(html).toContain("3 pages read.");
    expect(html).toContain("read column by column");
    expect(html).toContain("8 words broken across a line end were rejoined.");
    expect(html).toContain("1 sentence carried on across a page break");
    expect(html).toContain("typeset ligatures");
  });

  it("offers no analysis, because analysis is not built, and says so", () => {
    expect(html).toContain("What happens next");
    expect(html).toContain("not built yet");
    /* No button that does nothing. */
    expect(html).not.toContain("Inspect this document");
  });

  it("lets the reader bring a different document", () => {
    expect(html).toContain("Bring a different document");
  });
});

describe("a refusal", () => {
  const refusals: ExtractionRefusal[] = [
    refusal("no-text-layer", {
      documentName: "scan.pdf",
      imageOnlyPages: [1, 2],
      pages: 2,
    }),
    refusal("part-of-the-document-is-a-scan", {
      documentName: "part-scan.pdf",
      imageOnlyPages: [4],
      pages: 9,
    }),
    refusal("too-long", {
      documentName: "long.pdf",
      characters: 412_000,
      limit: 250_000,
    }),
    refusal("unsupported-file", {
      documentName: "photo.jpeg",
      fileName: "photo.jpeg",
    }),
    refusal("file-would-not-open", { documentName: "locked.pdf" }),
    refusal("no-text-in-the-document", { documentName: "blank.docx" }),
  ];

  it("explains the reason rather than reporting a code, every time", () => {
    for (const each of refusals) {
      const html = view({ step: "refused", refusal: each });

      expect(html).toContain(each.heading);
      expect(html).not.toMatch(/\berror\b/i);
      expect(html).not.toMatch(/\bfailed\b/i);
      expect(html).not.toMatch(/try again/i);
    }
  });

  it("never offers a verdict and never uses the words the product avoids", () => {
    for (const each of refusals) {
      const html = view({ step: "refused", refusal: each });

      expect(html).not.toMatch(/you.ll be fine|don.t sign|do not sign this/i);
      expect(html).not.toMatch(/\bfinding(s)?\b/i);
      expect(html).not.toMatch(/\bthreshold(s)?\b/i);
    }
  });

  it("says a scan is a scan, and why OCR is not the answer", () => {
    const html = view({ step: "refused", refusal: refusals[0] });

    expect(html).toContain("This document is a scan");
    expect(html).toContain("Every page in this file is an image");
    expect(html).toContain("Reading a character wrongly");
  });

  it("names the scanned pages when only part of a document is a scan", () => {
    const html = view({ step: "refused", refusal: refusals[1] });

    expect(html).toContain("page 4");
    expect(html).toContain("9");
  });

  it("states the length and the limit on a document that is too long", () => {
    const html = view({ step: "refused", refusal: refusals[2] });

    expect(html).toContain("412,000");
    expect(html).toContain("250,000");
    expect(html).toContain("Nothing has been cut short");
  });

  it("offers a way on", () => {
    for (const each of refusals) {
      expect(view({ step: "refused", refusal: each })).toContain(
        "Bring a different document",
      );
    }
  });
});

describe("the head bar", () => {
  it("says there is no document yet, and that nothing has been read", () => {
    const html = renderToStaticMarkup(
      <WorkspaceShell state={{ accounts: "not-configured" }} />,
    );

    expect(html).toContain("<dt>Document</dt><dd>None brought yet</dd>");
    expect(html).toContain("<dt>Extracted</dt><dd>Nothing read yet</dd>");
    expect(html).toContain("No document read · No account system in this build");
  });

  it("carries the intake screen with no account system configured at all", () => {
    const html = renderToStaticMarkup(
      <WorkspaceShell state={{ accounts: "not-configured" }} />,
    );

    expect(html).toContain("Bring the document you are about to sign.");
    expect(html).toContain("no account system configured");
  });
});
