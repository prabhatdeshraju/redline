/* Intake: the state the workspace is in before a document has been read.
 *
 * Straight out of workspace/index.html's intake view — the reviewed static
 * reference — plus the two states that follow it: what was recovered, and a
 * refusal. Every class comes from the Operate stylesheet.
 *
 * The screen is split in two on purpose. `IntakeView` is a pure function of the
 * stage, so all four states are reachable from a test without a browser, a file
 * or a parser. `Intake` is the thin client component that owns the stage and
 * calls the extraction boundary.
 */

"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ACCEPTED_FILE_TYPES,
  extractDocument,
} from "@/lib/extraction/extract";
import type { Extraction, ExtractionRefusal } from "@/lib/extraction/outcome";

export type IntakeStage =
  | { readonly step: "waiting" }
  | { readonly step: "reading"; readonly documentName: string | null }
  | { readonly step: "extracted"; readonly extraction: Extraction }
  | { readonly step: "refused"; readonly refusal: ExtractionRefusal };

type IntakeViewProps = {
  readonly stage: IntakeStage;
  /** Set when the reader asked to go ahead with an empty box and no file. */
  readonly nothingGiven?: boolean;
  readonly onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  readonly onFileChosen?: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onStartOver?: () => void;
  readonly pastedRef?: React.RefObject<HTMLTextAreaElement | null>;
  readonly fileRef?: React.RefObject<HTMLInputElement | null>;
  /** What comes after the recovered text once there is some: the inspection
   *  (`components/operate/inspection.tsx`). A slot rather than an import, because
   *  this screen's job ends when the text is out of the file — what is then done
   *  with the text is the analysis boundary's side of the product, and intake
   *  stays testable without it. */
  readonly next?: ReactNode;
};

const count = (value: number): string => value.toLocaleString("en-US");
const plural = (value: number, one: string, many: string): string =>
  value === 1 ? one : many;
const was = (value: number): string => (value === 1 ? "was" : "were");

/* ------------------------------------------------------------------ *
 * What leaves the machine — stated before anything leaves it
 * ------------------------------------------------------------------ */

/** The sentence this whole screen exists to be able to say truthfully.
 *
 * It is shown before the reader chooses a file, and again beside the recovered
 * text with the exact number of characters in it. Nothing is sent from this
 * build at all, and saying so is part of stating what leaves. */
function WhatLeaves({ characters }: { readonly characters?: number }) {
  return (
    <aside className="notice" aria-labelledby="leaves-head">
      <h3 className="notice__head" id="leaves-head">
        What leaves this machine
      </h3>
      <div>
        <p>
          The file is read here, in your browser. It is never uploaded: Redline
          has no address a document can be sent to, and no part of this page asks
          for one.
        </p>
        <p>
          {characters === undefined ? (
            <>
              What would be sent to be inspected is the extracted text, and
              nothing else — no file, no images, no name, no author, none of the
              details a document file carries about itself. You see that text,
              and how long it is, before any of it goes anywhere.
            </>
          ) : (
            <>
              The <span className="tnum">{count(characters)}</span> characters
              below are the whole of what would be sent to be inspected — no
              file, no images, and none of the details the file carries about
              itself. Nothing has been sent: this build reads a document and
              stops there.
            </>
          )}
        </p>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ *
 * The four states
 * ------------------------------------------------------------------ */

function Waiting({
  nothingGiven,
  onSubmit,
  onFileChosen,
  pastedRef,
  fileRef,
}: IntakeViewProps) {
  return (
    <section className="intake" aria-labelledby="intake-head">
      <div className="intake__main">
        <h2 className="intake__head" id="intake-head">
          Bring the document you are about to sign.
        </h2>
        <p className="intake__lead">
          Paste the text or choose a file. It is read in your browser — only the
          extracted text is sent to be inspected.
        </p>

        <form className="intake__form" onSubmit={onSubmit}>
          <label className="minor" htmlFor="paste">
            Paste the document text
          </label>
          <textarea
            id="paste"
            ref={pastedRef}
            className="field field--area"
            rows={10}
            placeholder="Paste the full text of the agreement…"
            aria-invalid={nothingGiven ? true : undefined}
            aria-describedby={nothingGiven ? "intake-err" : undefined}
          />
          {nothingGiven ? (
            <p className="intake__err" id="intake-err" role="alert">
              Paste the document text, or choose a file, before going on.
            </p>
          ) : null}
          <div className="intake__row">
            <label className="btn" htmlFor="file-input">
              Choose a file…
            </label>
            <input
              type="file"
              id="file-input"
              ref={fileRef}
              className="u-sr"
              accept={ACCEPTED_FILE_TYPES}
              onChange={onFileChosen}
            />
            <span className="intake__or">or</span>
            <button type="submit" className="btn btn--primary">
              Read this document
            </button>
          </div>
          <p className="qform__note">
            PDF, DOCX or plain text. A file is read where it already is; it is
            not uploaded.
          </p>
        </form>
      </div>

      <aside className="intake__scope">
        <h3 className="minor">What Redline inspects</h3>
        <p>
          A <b>negotiable document</b> — one whose terms you still have standing
          to change. A client agreement, a statement of work, a vendor or service
          agreement, a lease.
        </p>
        <h3 className="minor">What it will not inspect</h3>
        <ul className="intake__no">
          <li>
            <b>Terms of service</b> and other take-it-or-leave-it documents.
            There is nobody on the other side to accept a counter-offer.
          </li>
          <li>
            <b>Scanned or photographed documents.</b> A misread character
            produces a quotation that is wrong in the one way you could not
            catch.
          </li>
          <li>
            <b>Documents you have already signed.</b> Replacement wording is
            worth nothing once it is signed.
          </li>
        </ul>
        <p className="intake__undecided">
          A terms-of-service upload is refused with this explanation today. What
          Redline should do with one instead is an open product decision.
        </p>
      </aside>
    </section>
  );
}

function Reading({ documentName }: { readonly documentName: string | null }) {
  return (
    <section className="analysing" aria-live="polite" aria-labelledby="reading-head">
      <h2 className="sect-head" id="reading-head">
        Reading
      </h2>
      <ol className="steps">
        <li className="step is-active">
          {documentName
            ? `Extracting the text of ${documentName} in your browser`
            : "Extracting the text in your browser"}
        </li>
      </ol>
      <div className="skeleton" aria-hidden="true">
        <span className="skel skel--wide" />
        <span className="skel" />
        <span className="skel skel--row" />
        <span className="skel skel--row" />
      </div>
    </section>
  );
}

/** What extraction had to repair to recover continuous sentences.
 *
 * Shown rather than kept quiet because a flag Redline cannot quote is a defect
 * in this step (ADR 0001), and a reader who can see what was repaired can see
 * where to look when a quotation does not match their copy. */
function WhatWasRepaired({ extraction }: { readonly extraction: Extraction }) {
  const { diagnostics } = extraction;
  const notes: string[] = [];

  if (diagnostics.pages > 0) {
    notes.push(
      `${count(diagnostics.pages)} ${diagnostics.pages === 1 ? "page" : "pages"} read.`,
    );
  }
  if (diagnostics.multiColumnPages.length > 0) {
    const pages = diagnostics.multiColumnPages
      .map((each) => each.pageNumber)
      .join(", ");
    notes.push(
      `Set in columns on ${diagnostics.multiColumnPages.length === 1 ? "page" : "pages"} ${pages}, and read column by column.`,
    );
  }
  if (diagnostics.runningLinesRemoved.length > 0) {
    notes.push(
      `A line repeating at the head or foot of each page was set aside so it did not land in the middle of a sentence: “${diagnostics.runningLinesRemoved[0]}”.`,
    );
  }
  if (diagnostics.hyphenationsJoined > 0) {
    notes.push(
      `${count(diagnostics.hyphenationsJoined)} ${plural(diagnostics.hyphenationsJoined, "word", "words")} broken across a line end ${was(diagnostics.hyphenationsJoined)} rejoined.`,
    );
  }
  if (diagnostics.hyphensKept > 0) {
    notes.push(
      `${count(diagnostics.hyphensKept)} ${plural(diagnostics.hyphensKept, "hyphen", "hyphens")} ${was(diagnostics.hyphensKept)} kept, because the document writes those compounds out elsewhere.`,
    );
  }
  if (diagnostics.sentencesJoinedAcrossPages > 0) {
    notes.push(
      `${count(diagnostics.sentencesJoinedAcrossPages)} ${plural(diagnostics.sentencesJoinedAcrossPages, "sentence", "sentences")} carried on across a page break and ${was(diagnostics.sentencesJoinedAcrossPages)} joined up.`,
    );
  }
  if (diagnostics.ligaturesDecomposed > 0) {
    notes.push(
      `${count(diagnostics.ligaturesDecomposed)} typeset ${plural(diagnostics.ligaturesDecomposed, "ligature", "ligatures")} ${was(diagnostics.ligaturesDecomposed)} written out as the letters they stand for, so you can search your own copy for the word.`,
    );
  }
  if (diagnostics.pagesWithoutText.length > 0) {
    notes.push(
      `No text on ${diagnostics.pagesWithoutText.length === 1 ? "page" : "pages"} ${diagnostics.pagesWithoutText.join(", ")}.`,
    );
  }

  if (notes.length === 0) return null;

  return (
    <aside className="notice" aria-labelledby="repaired-head">
      <h3 className="notice__head" id="repaired-head">
        How this was read
      </h3>
      <ul className="intake__no">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </aside>
  );
}

function ExtractedText({ text }: { readonly text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter((each) => each.trim().length > 0);

  return (
    <div className="extract" tabIndex={0} role="group" aria-label="The extracted text">
      {paragraphs.map((paragraph, index) => (
        <p className="doc__cl" key={`${index}-${paragraph.slice(0, 24)}`}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function Extracted({
  extraction,
  onStartOver,
  next,
}: {
  readonly extraction: Extraction;
  readonly onStartOver?: () => void;
  readonly next?: ReactNode;
}) {
  const where =
    extraction.format === "pasted-text"
      ? "the text you pasted"
      : (extraction.documentName ?? "the file you chose");

  return (
    <>
      <section className="summary" aria-labelledby="recovered-head">
        <h2 className="sect-head" id="recovered-head">
          What was recovered
        </h2>
        <div className="sect-body">
          <p className="summary__text">
            <span className="tnum">{count(extraction.characters)}</span>{" "}
            characters of text were recovered from {where}. Read the beginning of
            it below: if it is not your document, or there is far less of it than
            there should be, the file did not come apart cleanly and nothing
            inspected from it would be worth having.
          </p>
          <p className="summary__hedge">
            Redline describes what a document says. It does not advise you
            whether to sign.
          </p>
          <WhatLeaves characters={extraction.characters} />
          <WhatWasRepaired extraction={extraction} />
        </div>
      </section>

      <section className="summary" aria-labelledby="text-head">
        <h2 className="sect-head" id="text-head">
          The text
        </h2>
        <div className="sect-body">
          <p className="doc__meta tnum">
            {where} · extracted text ·{" "}
            <span className="tnum">{count(extraction.characters)}</span>{" "}
            characters
          </p>
          <ExtractedText text={extraction.text} />
          <div className="intake__row">
            <button type="button" className="btn" onClick={onStartOver}>
              Bring a different document
            </button>
          </div>
        </div>
      </section>

      {next}
    </>
  );
}

function Refused({
  refusal,
  onStartOver,
}: {
  readonly refusal: ExtractionRefusal;
  readonly onStartOver?: () => void;
}) {
  return (
    <section className="summary" aria-labelledby="refused-head">
      <h2 className="sect-head" id="refused-head">
        {refusal.heading}
      </h2>
      <div className="sect-body">
        <p className="summary__text">{refusal.explanation}</p>
        <p className="summary__hedge">{refusal.whatToDo}</p>
        {refusal.characters !== undefined && refusal.limit !== undefined ? (
          <aside className="notice" aria-labelledby="length-head">
            <h3 className="notice__head" id="length-head">
              Length
            </h3>
            <div>
              <p>
                This document: <span className="tnum">{count(refusal.characters)}</span>{" "}
                characters. What Redline carries:{" "}
                <span className="tnum">{count(refusal.limit)}</span>.
              </p>
            </div>
          </aside>
        ) : null}
        <div className="intake__row">
          <button type="button" className="btn btn--primary" onClick={onStartOver}>
            Bring a different document
          </button>
        </div>
      </div>
    </section>
  );
}

/** The intake screen, as a pure function of its stage. */
export function IntakeView(props: IntakeViewProps) {
  switch (props.stage.step) {
    case "waiting":
      return (
        <>
          <Waiting {...props} />
          <section className="summary" aria-labelledby="leaves-section-head">
            <h2 className="sect-head" id="leaves-section-head">
              Before anything is sent
            </h2>
            <div className="sect-body">
              <WhatLeaves />
            </div>
          </section>
        </>
      );
    case "reading":
      return <Reading documentName={props.stage.documentName} />;
    case "extracted":
      return (
        <Extracted
          extraction={props.stage.extraction}
          onStartOver={props.onStartOver}
          next={props.next}
        />
      );
    case "refused":
      return (
        <Refused refusal={props.stage.refusal} onStartOver={props.onStartOver} />
      );
  }
}

/* ------------------------------------------------------------------ *
 * The client component
 * ------------------------------------------------------------------ */

/** Owns the stage and calls the extraction boundary.
 *
 * Both paths run here in the browser. There is no form action, no route and no
 * fetch: the only way out of this component is the stage it reports upwards. */
export function Intake({
  onStage,
  next,
}: {
  readonly onStage?: (stage: IntakeStage) => void;
  /** What follows the recovered text: the inspection, handed in by the shell. */
  readonly next?: ReactNode;
}) {
  const [stage, setStage] = useState<IntakeStage>({ step: "waiting" });
  const [nothingGiven, setNothingGiven] = useState(false);
  const pastedRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const move = (next: IntakeStage) => {
    setStage(next);
    onStage?.(next);
  };

  const settle = (outcome: Awaited<ReturnType<typeof extractDocument>>) => {
    move(
      outcome.outcome === "extracted"
        ? { step: "extracted", extraction: outcome.extraction }
        : { step: "refused", refusal: outcome.refusal },
    );
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = pastedRef.current?.value ?? "";
    if (text.trim().length === 0) {
      setNothingGiven(true);
      return;
    }
    setNothingGiven(false);
    move({ step: "reading", documentName: null });
    void extractDocument({ kind: "pasted-text", text }).then(settle);
  };

  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setNothingGiven(false);
    move({ step: "reading", documentName: file.name });
    void extractDocument({ kind: "file", file }).then(settle);
  };

  const onStartOver = () => {
    if (fileRef.current) fileRef.current.value = "";
    setNothingGiven(false);
    move({ step: "waiting" });
  };

  return (
    <IntakeView
      stage={stage}
      nothingGiven={nothingGiven}
      onSubmit={onSubmit}
      onFileChosen={onFileChosen}
      onStartOver={onStartOver}
      pastedRef={pastedRef}
      fileRef={fileRef}
      next={next}
    />
  );
}
