"use client";

/* The screen that shows a flag.
 *
 * The second half of ticket 04. The analysis boundary decides what is true; this
 * decides what the reader sees of it, and the two are kept apart: every state
 * below is a pure function of one `InspectionStage`, so the failure a reader would
 * meet with no key configured is reachable from a test without a network, a key or
 * a browser.
 *
 * Straight out of workspace/index.html, the reviewed static reference: the ruled
 * schedule of flags, the severity mark with its hatch, the source figure with its
 * mark-orange top rule, the extraction note, the inspection scope, and the key to
 * the marks. Every class comes from the Operate stylesheet.
 *
 * FOUR RULES THIS FILE EXISTS TO KEEP
 *
 * A failure is never an all-clear. `FlagAnalysis` is a union and no failure is
 * expressible as flags, so there is no code path here on which "we could not look"
 * can be drawn as "we found nothing" — each failure gets its own heading, its own
 * sentence, and a ruled note saying in words that it is not an all-clear
 * (`PRD.md` §4.4, ADR 0004).
 *
 * A drop is not a clean document. `citations.dropped` is what the citation gate
 * threw away because it could not find the quoted sentence in the reader's text.
 * That is evidence the text was not recovered faithfully, so it is named in the
 * extraction note rather than showing fewer flags quietly (ADR 0001, `PRD.md`
 * §4.8).
 *
 * Only what was searched for is claimed. The scope list is built from
 * `CLAUSE_TYPES_IN_SCOPE` beside the published taxonomy, and a clause type this
 * build does not look for is marked as not looked for — never as inspected and
 * absent, which would claim coverage nothing has measured (ADR 0003).
 *
 * Severity is stated twice. A named rank in condensed caps and a hatch whose
 * density carries the same information; colour is never the only signal
 * (DESIGN.md, The Double-Encoded Severity Rule).
 *
 * The flag row is a real disclosure control, and it opens open. Nothing
 * content-bearing waits on JavaScript: the first paint has every flag expanded and
 * every source sentence on the page, and the button only collapses one afterwards
 * (DESIGN.md, The Already-Visible Rule and The Open-Without-JS Rule).
 */

import { useState, type ReactNode } from "react";

import { inspectDocumentText } from "@/app/(operate)/workspace/inspect";
import { CopySentence } from "@/components/operate/copy-sentence";
import { rankedBySeverity, type Flag } from "@/lib/analysis/analysis";
import type { AnalysisFailure, FlagAnalysis } from "@/lib/analysis/boundary";
import {
  isAllClear,
  type CitationRecord,
  type CitedAnalysis,
} from "@/lib/analysis/citation-gate";
import { CLAUSE_TYPES_IN_SCOPE } from "@/lib/analysis/clause-search";
import {
  CLAUSE_TAXONOMY,
  clauseTypeEntry,
  type Severity,
} from "@/lib/analysis/taxonomy";
import { sourceWindows, type SourceWindow } from "@/lib/operate/source-window";

/* ------------------------------------------------------------------ *
 * The stage
 * ------------------------------------------------------------------ */

export type InspectionStage =
  /** The text is read and the reader has not asked for it to be inspected yet. */
  | { readonly step: "not-asked" }
  | { readonly step: "inspecting" }
  | { readonly step: "inspected"; readonly analysis: CitedAnalysis }
  | { readonly step: "unavailable"; readonly failure: AnalysisFailure };

/** What the boundary does to the analysis, in the shape the screen holds it. */
export function stageOf(result: FlagAnalysis): InspectionStage {
  return result.outcome === "analysed"
    ? { step: "inspected", analysis: result.analysis }
    : { step: "unavailable", failure: result.failure };
}

/* ------------------------------------------------------------------ *
 * What this build searched for, said once
 * ------------------------------------------------------------------ */

const count = (value: number): string => value.toLocaleString("en-US");

const SEARCHED = CLAUSE_TYPES_IN_SCOPE.map((clauseType) =>
  clauseTypeEntry(clauseType).title.toLowerCase(),
);

const PUBLISHED_TYPES = CLAUSE_TAXONOMY.length;
const SEARCHED_TYPES = CLAUSE_TYPES_IN_SCOPE.length;
const UNSEARCHED_TYPES = PUBLISHED_TYPES - SEARCHED_TYPES;

/** "personal guarantees", or "a, b and c" when ticket 05 extends the list. Read
 *  off the list the boundary searches rather than written out, so the interface
 *  cannot claim more was looked for than was. */
const SEARCHED_FOR: string =
  SEARCHED.length <= 1
    ? (SEARCHED[0] ?? "no clause type")
    : `${SEARCHED.slice(0, -1).join(", ")} and ${SEARCHED[SEARCHED.length - 1]}`;

/** The sentence every state of this screen can say truthfully, and which keeps a
 *  silence about the other seven from reading as coverage. */
function WhatWasLookedFor() {
  return (
    <p className="summary__text">
      This build looks for <span className="tnum">{count(SEARCHED_TYPES)}</span>{" "}
      of the <span className="tnum">{count(PUBLISHED_TYPES)}</span> published
      clause types: {SEARCHED_FOR}. The other{" "}
      <span className="tnum">{count(UNSEARCHED_TYPES)}</span> are not looked for
      here, so nothing on this page says whether they are in your document.
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * Marks
 * ------------------------------------------------------------------ */

/** The three ranks, and only these words (CONTEXT.md, DESIGN.md). */
const RANK: Readonly<Record<Severity, string>> = {
  highest: "Highest",
  high: "High",
  medium: "Medium",
};

/** The hatch duty cycles, worst case densest. The swatch never appears without
 *  its rank name and the name never without the swatch. */
const HATCH: Readonly<Record<Severity, string>> = {
  highest: "sev--1",
  high: "sev--2",
  medium: "sev--3",
};

function SeverityMark({
  severity,
  name,
}: {
  readonly severity: Severity;
  readonly name?: string;
}) {
  return (
    <span className={`sev ${HATCH[severity]}`}>
      <span className="sev__hatch" aria-hidden="true" />
      <span className="sev__name">{name ?? `${RANK[severity]} severity`}</span>
    </span>
  );
}

function Tick() {
  return (
    <span className="sound__tick" aria-hidden="true">
      <svg
        viewBox="0 0 16 16"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      >
        <path d="M2.5 8.5 6 12l7.5-8" />
      </svg>
    </span>
  );
}

function Chevron() {
  return (
    <span className="flag__chev" aria-hidden="true">
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      >
        <path d="M3 6.5 8 11l5-4.5" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The sentence in its surroundings
 * ------------------------------------------------------------------ */

/** The sentence marked inside the passage it came out of.
 *
 * Shown so the reader can judge whether the sentence was read fairly: a clause
 * that limits the one before it, or a carve-out in the next, changes what the flag
 * means, and a sentence lifted out on its own hides both. The marked run is set
 * apart by weight, by ink strength and by a mark-orange rule — three signals, so
 * colour is never carrying it alone — and the ends of the window say when the
 * passage continues rather than implying the document stops there. */
function Surroundings({
  windows,
  sentence,
}: {
  readonly windows: readonly SourceWindow[];
  readonly sentence: string;
}) {
  if (windows.length === 0) {
    return (
      <p>
        This sentence does not occur in the text this browser is holding, so
        there is no passage to show around it. Every flag is checked against the
        text it was produced from before it is shown, so the two texts have come
        apart: read the flag above against your own copy of the document and not
        against anything here.
      </p>
    );
  }

  const repeated = windows.length > 1;

  return (
    <>
      {repeated ? (
        <p className="sect-note">
          This sentence occurs <span className="tnum">{count(windows.length)}</span>{" "}
          times in your document. Every place it occurs is shown below. Redline
          does not say which of them the flag was written from, because the flag
          quotes the sentence and not a location.
        </p>
      ) : null}
      <div
        className="extract"
        tabIndex={0}
        role="group"
        aria-label="The source sentence in its surroundings"
      >
        {windows.map((window) => (
          <p className="doc__cl" key={window.index}>
            {repeated ? (
              <span className="doc__n tnum">
                {count(window.occurrence)} of {count(window.occurrences)}
              </span>
            ) : null}
            {window.cutBefore ? "… " : null}
            {window.before}
            <mark>
              <span className="u-sr">The source sentence begins. </span>
              {sentence}
              <span className="u-sr"> The source sentence ends.</span>
            </mark>
            {window.after}
            {window.cutAfter ? " …" : null}
          </p>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * A flag
 * ------------------------------------------------------------------ */

const pad = (value: number): string => String(value).padStart(2, "0");

function FlagRow({
  flag,
  position,
  documentText,
}: {
  readonly flag: Flag;
  readonly position: number;
  readonly documentText: string;
}) {
  /* Open, and open on the first paint. The button collapses it; nothing depends
     on the button having run (DESIGN.md, The Open-Without-JS Rule). */
  const [open, setOpen] = useState(true);

  const entry = clauseTypeEntry(flag.clauseType);
  const windows = sourceWindows(documentText, flag.sourceSentence);
  const number = pad(position);
  const bodyId = `flag-${number}-body`;

  const where =
    windows.length === 0
      ? "Not in this text"
      : windows.length === 1
        ? "One place in your document"
        : `${count(windows.length)} places in your document`;

  return (
    <li>
      <article
        className={[
          "flag",
          position === 1 ? "flag--lead" : "",
          open ? "is-open" : "",
        ]
          .filter((each) => each.length > 0)
          .join(" ")}
        id={`flag-${number}`}
      >
        <h3 className="flag__head">
          <button
            type="button"
            className="flag__toggle"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(!open)}
          >
            <span className="flag__num tnum">{number}</span>
            <SeverityMark severity={flag.severity} />
            <span className="flag__type">{entry.title}</span>
            <span className="flag__ref tnum">{where}</span>
            <Chevron />
          </button>
        </h3>

        <div className="flag__body" id={bodyId} hidden={!open}>
          <figure className="source">
            <blockquote>
              <p>{flag.sourceSentence}</p>
            </blockquote>
            <figcaption>
              Source sentence · quoted verbatim
              <CopySentence sentence={flag.sourceSentence} />
            </figcaption>
          </figure>

          <div className="flag__cols">
            <div>
              <h4 className="minor">What it permits at worst</h4>
              <p>{flag.whatItPermits}</p>
              <p className="hedge">
                What this clause would mean in law — whether a court would
                enforce it, in which jurisdiction, and against what — is not
                something the document settles. Redline states what the document
                says and stops there.
              </p>
            </div>
            <div>
              <h4 className="minor">Where it sits in your document</h4>
              <Surroundings windows={windows} sentence={flag.sourceSentence} />
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * The extraction note: what the citation gate dropped
 * ------------------------------------------------------------------ */

const DROP_REASON = {
  "not-in-the-document":
    "the sentence quoted for it does not occur in the text recovered from your document, so there was nothing you could check it against",
  "empty-source-sentence":
    "it quoted no sentence at all, so there was nothing you could check it against",
} as const;

/** Flags the gate threw away, named rather than subtracted.
 *
 * A document producing drops is an extraction defect: the wording could not be
 * matched in the recovered text. Showing fewer flags and saying nothing would turn
 * that into a cleaner-looking result than the run actually was (ADR 0001,
 * `PRD.md` §4.8). */
function ExtractionNote({ citations }: { readonly citations: CitationRecord }) {
  if (citations.dropped.length === 0) return null;

  const dropped = citations.dropped.length;

  return (
    <aside className="notice" aria-labelledby="extraction-note-head">
      <h3 className="notice__head" id="extraction-note-head">
        Extraction note
      </h3>
      <div>
        <p>
          {dropped === 1 ? "One flag was" : `${count(dropped)} flags were`}{" "}
          dropped before reaching this page. The analysis produced{" "}
          <span className="tnum">{count(citations.checked)}</span> in all,{" "}
          <span className="tnum">{count(citations.cited)}</span> of which could
          quote a sentence that occurs in your text word for word.
        </p>
        <ul className="intake__no">
          {citations.dropped.map((drop) => (
            <li key={`${drop.flag.clauseType}-${drop.reason}-${drop.flag.sourceSentence.slice(0, 32)}`}>
              <b>{clauseTypeEntry(drop.flag.clauseType).title}</b> —{" "}
              {DROP_REASON[drop.reason]}.
            </li>
          ))}
        </ul>
        <p>
          A drop means the text was not recovered faithfully enough to match the
          wording, not that the document is clean. Where a clause type appears
          above, read this page as silent about it rather than as clearing it.
        </p>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ *
 * The inspection scope, and the key to the marks
 * ------------------------------------------------------------------ */

function Key() {
  return (
    <div className="key">
      <h3 className="key__label">Key to the marks</h3>
      <dl className="key__list">
        <div className="key__item">
          <dt>
            <SeverityMark severity="highest" />
          </dt>
          <dd>Unbounded, or reaching your own assets.</dd>
        </div>
        <div className="key__item">
          <dt>
            <SeverityMark severity="high" />
          </dt>
          <dd>
            Bounded, but it can cost you your ownership, your remedy, or your
            ability to earn.
          </dd>
        </div>
        <div className="key__item">
          <dt>
            <SeverityMark severity="medium" />
          </dt>
          <dd>Bounded by the value of the agreement.</dd>
        </div>
      </dl>
      <p className="key__note">
        Denser hatch, worse worst case. A rank is the worst outcome a clause
        permits, never how common the clause is.
      </p>
    </div>
  );
}

function InspectionScope({ flags }: { readonly flags: readonly Flag[] }) {
  const flagged = new Set(flags.map((flag) => flag.clauseType));
  const searched = new Set(CLAUSE_TYPES_IN_SCOPE);

  return (
    <section aria-labelledby="scope-head">
      <div className="sect-bar">
        <h2 className="sect-head" id="scope-head">
          What was looked for
        </h2>
        <p className="sect-note">
          The list is fixed and published. A clause type this build does not look
          for is named as not looked for, never as absent.
        </p>
      </div>

      <ol className="scopelist">
        {CLAUSE_TAXONOMY.map((entry, index) => (
          <li
            className={`scoperow${flagged.has(entry.clauseType) ? " scoperow--flagged" : ""}`}
            key={entry.clauseType}
          >
            <span className="scoperow__n tnum">{count(index + 1)}</span>
            <span className="scoperow__name">{entry.title}</span>
            <span className="scoperow__status">
              {!searched.has(entry.clauseType) ? (
                <span className="unsearched">Not looked for in this build</span>
              ) : flagged.has(entry.clauseType) ? (
                <SeverityMark
                  severity={entry.severity}
                  name={`Flagged · ${RANK[entry.severity].toLowerCase()}`}
                />
              ) : (
                <span className="sound">
                  <Tick />
                  Inspected · not found
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>

      <p className="scope__note">
        A risk that comes from something the document <em>does not say</em> — no
        notice period, no cap on liability — has no sentence to quote, so it is
        not flagged either.
      </p>

      <Key />
    </section>
  );
}

function Limitations() {
  return (
    <section aria-labelledby="limits-head">
      <h2 className="sect-head" id="limits-head">
        Limitations of this inspection
      </h2>
      <ul className="limitlist">
        <li>
          <b>No verdict.</b> Redline never tells you whether to sign, and it is
          not legal advice.
        </li>
        <li>
          <b>
            <span className="tnum">{count(SEARCHED_TYPES)}</span> of{" "}
            <span className="tnum">{count(PUBLISHED_TYPES)}</span> clause types.
          </b>{" "}
          This build looks for {SEARCHED_FOR} and nothing else. Silence about the
          rest is silence, not absence.
        </li>
        <li>
          <b>No sentence, no flag.</b> Where the exact wording cannot be quoted
          out of your own text, the flag is dropped rather than approximated —
          and the drop is reported.
        </li>
        <li>
          <b>Negotiable documents only.</b> Take-it-or-leave-it documents, where
          there is nobody to accept a counter-offer, are out of scope.
        </li>
        <li>
          <b>Typed text only.</b> Scanned or photographed documents are not
          inspected, because a misread character produces a quotation that is
          wrong in the one way you could not catch.
        </li>
        <li>
          <b>One extraction.</b> The sentences quoted are checked against the
          text recovered in this browser. Read the same document out of a
          different file and the wording may differ.
        </li>
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The result
 * ------------------------------------------------------------------ */

function AllClear() {
  return (
    <section className="allclear-block" aria-labelledby="allclear-head">
      <p className="stamp">All clear</p>
      <div>
        <h2 className="sect-head" id="allclear-head">
          Nothing of what was looked for is in this document
        </h2>
        <p className="summary__text">
          Redline looked for {SEARCHED_FOR} in the text you brought and found
          none. Nothing was dropped on the way, so this is the whole of what the
          analysis produced.
        </p>
        <WhatWasLookedFor />
        <p className="summary__hedge">
          An all-clear is the most dangerous thing Redline can print, so it is
          shown with the full list of clause types below and with what was not
          looked for marked as such.
        </p>
      </div>
    </section>
  );
}

function Schedule({
  analysis,
  documentText,
}: {
  readonly analysis: CitedAnalysis;
  readonly documentText: string;
}) {
  const flags = rankedBySeverity(analysis.flags);

  return (
    <section aria-labelledby="schedule-head">
      <div className="sect-bar">
        <h2 className="sect-head" id="schedule-head">
          Schedule of flags
        </h2>
        <p className="sect-note">
          Ranked by what each clause permits at worst, never by how common it is.
        </p>
      </div>
      <ol className="flags">
        {flags.map((flag, index) => (
          <FlagRow
            key={`${flag.clauseType}-${flag.sourceSentence.slice(0, 48)}`}
            flag={flag}
            position={index + 1}
            documentText={documentText}
          />
        ))}
      </ol>
    </section>
  );
}

function Inspected({
  analysis,
  documentText,
}: {
  readonly analysis: CitedAnalysis;
  readonly documentText: string;
}) {
  const flags = analysis.flags.length;

  return (
    <>
      {isAllClear(analysis) ? (
        <AllClear />
      ) : (
        <section className="summary" aria-labelledby="inspected-head">
          <h2 className="sect-head" id="inspected-head">
            What was flagged
          </h2>
          <div className="sect-body">
            <p className="summary__text">
              {flags === 0 ? (
                <>
                  No flag survived the check that every quoted sentence occurs in
                  your own text, so there is none to show. That is not an
                  all-clear: read the extraction note below.
                </>
              ) : (
                <>
                  <span className="tnum">{count(flags)}</span>{" "}
                  {flags === 1 ? "flag" : "flags"} from the text you brought.
                  Each one quotes a sentence out of your own document, and you
                  can search your copy for it word for word.
                </>
              )}
            </p>
            <WhatWasLookedFor />
            <p className="summary__hedge">
              Redline describes what the document says. What a clause would mean
              in law depends on your jurisdiction and on how the agreement is
              executed.
            </p>
            <ExtractionNote citations={analysis.citations} />
          </div>
        </section>
      )}

      {flags > 0 ? (
        <Schedule analysis={analysis} documentText={documentText} />
      ) : null}

      <InspectionScope flags={analysis.flags} />
      <Limitations />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * When it could not run
 * ------------------------------------------------------------------ */

/** Every way the inspection can fail to happen, with what the reader is told.
 *
 * Keyed by the model client's own failure where there was one and by the
 * boundary's otherwise, so each of the seven is a designed state with its own
 * heading rather than one apology with a code in it. None of them is drawn as an
 * all-clear, and every one of them says so in words. */
type FailureCopy = {
  readonly heading: string;
  readonly what: string;
  readonly next: string;
  /** Whether asking again could plausibly answer differently. */
  readonly askAgain: boolean;
};

const FAILURES: Readonly<Record<string, FailureCopy>> = {
  "not-configured": {
    heading: "No model access is configured here",
    what: "Redline reaches a model through one endpoint, and this deployment has neither the key nor the model identifier it needs, so the inspection did not run. Your text stayed in this browser: with nowhere to send it, nothing was sent.",
    next: "Whoever set this deployment up supplies those two values, which are named below. Until they are set, no document can be inspected here.",
    askAgain: false,
  },
  "refused-by-the-endpoint": {
    heading: "The endpoint refused the request",
    what: "The request arrived and the endpoint answered by refusing it, so no clause type was looked for in your document. What it said is below, in its own words.",
    next: "Asking again sends the same text again. A refusal that repeats is about the account behind this deployment rather than about your document.",
    askAgain: true,
  },
  "network-failure": {
    heading: "The model could not be reached",
    what: "Nothing answered, so the inspection did not run and no clause type was looked for.",
    next: "Your text is still here in this browser. Asking again sends it again.",
    askAgain: true,
  },
  "answer-was-empty": {
    heading: "The answer carried nothing in it",
    what: "A reply arrived with no content at all, so there was nothing in it to read a flag out of. An empty reply and a document with nothing in it are two different things.",
    next: "Asking again puts the same text to the model a second time.",
    askAgain: true,
  },
  "answer-was-not-json": {
    heading: "The answer was not in the form Redline asked for",
    what: "Redline asks for its answer in a fixed structure, and what came back could not be read as that structure, so no flag could be taken out of it. Half an analysis is not shown in place of one.",
    next: "Asking again is worth doing once: the same request answers correctly most of the time.",
    askAgain: true,
  },
  "answer-was-not-the-shape-asked-for": {
    heading: "The answer was readable, and was not what was asked for",
    what: "What came back parsed, and it did not carry the list of flags Redline asks for, so there was nothing in it to show you. Nothing was guessed at to fill the gap.",
    next: "Asking again is worth doing once.",
    askAgain: true,
  },
  "nothing-to-analyse": {
    heading: "There was no text to inspect",
    what: "The text handed over was empty, so nothing was looked for in it.",
    next: "Bring the document again, or paste its text, and the inspection runs on what is recovered from it.",
    askAgain: false,
  },
};

const LAST_RESORT: FailureCopy = {
  heading: "The inspection did not run",
  what: "The analysis stopped before it produced anything, and what is below is the whole of what was reported about it.",
  next: "Asking again sends the same text again.",
  askAgain: true,
};

/** The kind the copy is keyed by: the model's own where there was one, because
 *  "no key was set" and "the endpoint refused" are different things to be told and
 *  the boundary carries both as `model-unavailable`. */
export function failureKindOf(failure: AnalysisFailure): string {
  return failure.modelFailure?.kind ?? failure.kind;
}

function Unavailable({
  failure,
  onInspect,
}: {
  readonly failure: AnalysisFailure;
  readonly onInspect?: () => void;
}) {
  const copy = FAILURES[failureKindOf(failure)] ?? LAST_RESORT;

  return (
    <section className="summary" aria-labelledby="unavailable-head">
      <h2 className="sect-head" id="unavailable-head">
        {copy.heading}
      </h2>
      <div className="sect-body">
        <p className="summary__text">{copy.what}</p>
        <p className="summary__text">{copy.next}</p>

        <aside className="notice" aria-labelledby="not-an-all-clear-head">
          <h3 className="notice__head" id="not-an-all-clear-head">
            This is not an all-clear
          </h3>
          <div>
            <p>
              No clause type was looked for in your document, so nothing here
              says your document is free of any of them. Redline found nothing
              because it could not look, and that is a different result from an
              all-clear.
            </p>
          </div>
        </aside>

        {failure.modelFailure ? (
          <aside className="notice" aria-labelledby="reported-head">
            <h3 className="notice__head" id="reported-head">
              What was reported
            </h3>
            <div>
              <p>{failure.modelFailure.statement}</p>
            </div>
          </aside>
        ) : null}

        {copy.askAgain && onInspect ? (
          <div className="intake__row">
            <button type="button" className="btn btn--primary" onClick={onInspect}>
              Ask for the inspection again
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Before, and during
 * ------------------------------------------------------------------ */

function NotAsked({ onInspect }: { readonly onInspect?: () => void }) {
  return (
    <section className="summary" aria-labelledby="inspect-head">
      <h2 className="sect-head" id="inspect-head">
        Have this text inspected
      </h2>
      <div className="sect-body">
        <WhatWasLookedFor />
        <p className="summary__text">
          Every flag quotes one sentence out of the text above, so you can search
          your own copy of the document for it and check the work. A clause
          Redline cannot quote exactly is not shown as a flag; it is reported as
          dropped.
        </p>
        <p className="summary__text">
          The extracted text above is what is sent to be inspected, and it is all
          that is sent. The file itself stays in this browser, and you do not
          need an account.
        </p>
        <div className="intake__row">
          <button type="button" className="btn btn--primary" onClick={onInspect}>
            Inspect this document
          </button>
        </div>
      </div>
    </section>
  );
}

/** Waiting, named rather than spun (DESIGN.md, Analysing State). Each step is
 *  something that is actually done, in the order it is done: the text is already
 *  out of the file, the clause types in scope are being looked for, and every
 *  sentence quoted back is checked against the text before anything is shown. */
function Inspecting() {
  return (
    <section
      className="analysing"
      aria-live="polite"
      aria-labelledby="inspecting-head"
    >
      <h2 className="sect-head" id="inspecting-head">
        Inspecting
      </h2>
      <ol className="steps">
        <li className="step is-done">Text extracted in your browser</li>
        <li className="step is-active">
          Looking for{" "}
          <span className="tnum">{count(SEARCHED_TYPES)}</span> of{" "}
          <span className="tnum">{count(PUBLISHED_TYPES)}</span> clause types:{" "}
          {SEARCHED_FOR}
        </li>
        <li className="step">
          Checking every quoted sentence against your own text
        </li>
      </ol>
      <div className="skeleton" aria-hidden="true">
        <span className="skel skel--wide" />
        <span className="skel" />
        <span className="skel skel--row" />
        <span className="skel skel--row" />
        <span className="skel skel--row" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The screen, as a pure function of its stage
 * ------------------------------------------------------------------ */

export type InspectionViewProps = {
  readonly stage: InspectionStage;
  /** The text the analysis was produced from. Where the surrounding context for
   *  each source sentence is found. */
  readonly documentText: string;
  readonly onInspect?: () => void;
};

export function InspectionView({
  stage,
  documentText,
  onInspect,
}: InspectionViewProps): ReactNode {
  switch (stage.step) {
    case "not-asked":
      return <NotAsked onInspect={onInspect} />;
    case "inspecting":
      return <Inspecting />;
    case "inspected":
      return (
        <Inspected analysis={stage.analysis} documentText={documentText} />
      );
    case "unavailable":
      return <Unavailable failure={stage.failure} onInspect={onInspect} />;
  }
}

/* ------------------------------------------------------------------ *
 * The client component
 * ------------------------------------------------------------------ */

/** What the browser does when the reader asks for the inspection: hand the
 *  extracted text to the server function and hold whichever half of the union
 *  comes back. The key is never here — see `app/(operate)/workspace/inspect.ts`. */
export type Inspector = (documentText: string) => Promise<FlagAnalysis>;

/** The connection itself failing — the browser could not reach this application,
 *  rather than the application not reaching a model. The reader is told the same
 *  thing either way, because the same thing is true of both: nothing answered and
 *  nothing was looked for. */
function couldNotAsk(reason: unknown): AnalysisFailure {
  const said = reason instanceof Error ? reason.message : String(reason);
  return {
    kind: "model-unavailable",
    statement: `The analysis did not run. ${said}`,
    modelFailure: {
      kind: "network-failure",
      statement: `The inspection could not be asked for: ${said}. Nothing was analysed.`,
    },
  };
}

export function Inspection({
  documentText,
  inspect = inspectDocumentText,
}: {
  readonly documentText: string;
  /** Injected in tests, which hand it the real analysis boundary over a model
   *  client answering out of the labelled fixtures. Production uses the server
   *  function. */
  readonly inspect?: Inspector;
}) {
  const [stage, setStage] = useState<InspectionStage>({ step: "not-asked" });

  const onInspect = () => {
    setStage({ step: "inspecting" });
    void Promise.resolve(inspect(documentText)).then(
      (result) => setStage(stageOf(result)),
      (reason: unknown) =>
        setStage({ step: "unavailable", failure: couldNotAsk(reason) }),
    );
  };

  return (
    <InspectionView
      stage={stage}
      documentText={documentText}
      onInspect={onInspect}
    />
  );
}
