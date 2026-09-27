/* The sheet every Operate screen is drawn on.

   One centred sheet with the hatched bound edge pinned to its left, a ruled head
   bar carrying the wordmark, the screen's name and its micro-labelled metadata
   cells, whole-screen actions at the right, and the closing rule above the
   footer. Straight out of workspace/index.html, the reviewed static reference;
   every class comes from the Operate stylesheet and nothing here styles
   anything itself. */

import type { ReactNode } from "react";

type SheetFrameProps = {
  /** The screen's name, set in the head bar at the Operate Display step. */
  readonly name: string;
  /** Contents of the head bar's metadata list, as <div><dt>/<dd></div> cells. */
  readonly meta?: ReactNode;
  readonly actions?: ReactNode;
  readonly actionsLabel?: string;
  /** Where the skip link lands, and what it is called. */
  readonly skipLabel: string;
  /** The footer's condensed-caps sheet line: the state of this screen, stated. */
  readonly sheetLine: string;
  readonly children: ReactNode;
};

export function SheetFrame({
  name,
  meta,
  actions,
  actionsLabel,
  skipLabel,
  sheetLine,
  children,
}: SheetFrameProps) {
  return (
    <>
      <a className="skip" href="#report">
        {skipLabel}
      </a>

      <div className="sheet">
        <div className="sheet__edge" aria-hidden="true" />

        <header className="whead">
          <div className="whead__id">
            <p className="wordmark">Redline</p>
            <div className="whead__doc">
              <h1 className="whead__name">{name}</h1>
              {meta ? <dl className="whead__meta">{meta}</dl> : null}
            </div>
          </div>
          {actions ? (
            <nav className="whead__actions" aria-label={actionsLabel}>
              {actions}
            </nav>
          ) : null}
        </header>

        <main id="report" className="report">
          {children}
        </main>

        <footer className="wfoot">
          <p className="wfoot__note">
            Redline describes what a document says. It does not advise you
            whether to sign, and it is not a substitute for a lawyer.
          </p>
          <p className="wfoot__sheet tnum">{sheetLine}</p>
        </footer>
      </div>
    </>
  );
}
