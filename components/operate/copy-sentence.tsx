"use client";

/* Putting the source sentence on the clipboard, byte for byte.
 *
 * The one property of Redline's output a reader can verify without trusting
 * anything — search your own copy of the document for the quoted sentence and see
 * that it is there, word for word (ADR 0001, `PRD.md` §4.1). That check only works
 * if what lands on the clipboard is the sentence exactly as the flag carries it,
 * so the string copied is the flag's own `sourceSentence` and never the text
 * scraped back out of the rendered page: the quotation marks around the sentence
 * on screen are drawn by CSS, the surrounding markup collapses whitespace, and a
 * sentence recovered from the DOM would differ from the one the citation gate
 * matched in exactly the invisible ways that break a search.
 *
 * WHY THE REFUSAL IS A STATE AND NOT A SILENCE
 *
 * A clipboard write can be declined — an insecure origin, a permission the reader
 * withheld, a browser that has no clipboard interface at all. A control that
 * appears to work and does nothing would leave the reader pasting whatever was on
 * the clipboard before into their search, so a decline is said out loud and the
 * reader is told the sentence is above them to select by hand.
 */

import { useEffect, useRef, useState } from "react";

/** How long the confirmation stands before the control goes quiet again. The
 *  Operate toast's own dwell (DESIGN.md, Toast). */
const CONFIRMATION_MS = 4500;

type CopyState = "ready" | "copied" | "not-allowed";

type CopySentenceProps = {
  /** The sentence, exactly as the flag carries it. What lands on the clipboard. */
  readonly sentence: string;
  /** The lettering on the control. */
  readonly label?: string;
  /** Injected in tests, so the real control can be driven against a clipboard
   *  that records what it was handed. Production uses the browser's own. */
  readonly writeText?: (text: string) => Promise<void>;
};

function browserClipboard(): ((text: string) => Promise<void>) | null {
  if (typeof navigator === "undefined") return null;
  const clipboard = navigator.clipboard;
  if (!clipboard || typeof clipboard.writeText !== "function") return null;
  return (text: string) => clipboard.writeText(text);
}

export function CopySentence({
  sentence,
  label = "Copy the sentence",
  writeText,
}: CopySentenceProps) {
  const [state, setState] = useState<CopyState>("ready");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const settle = (next: CopyState) => {
    setState(next);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("ready"), CONFIRMATION_MS);
  };

  const copy = async () => {
    const write = writeText ?? browserClipboard();
    if (!write) {
      settle("not-allowed");
      return;
    }
    try {
      await write(sentence);
      settle("copied");
    } catch {
      settle("not-allowed");
    }
  };

  return (
    <>
      <button type="button" className="btn btn--small" onClick={() => void copy()}>
        {label}
      </button>
      {/* Always in the document, so the confirmation is announced when it
          arrives rather than the region appearing with it. */}
      <span role="status">
        {state === "copied" ? (
          <>
            Copied · <span className="tnum">{sentence.length}</span> characters,
            exactly as quoted
          </>
        ) : null}
        {state === "not-allowed" ? (
          <>
            This browser did not allow copying · select the sentence above and
            copy it with your keyboard
          </>
        ) : null}
      </span>
    </>
  );
}
