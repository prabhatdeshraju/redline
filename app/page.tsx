import { FlagAccordion } from "@/components/flag-accordion";

/* The landing page, ported from landing/index.html without design changes.
   The markup below is the shipped, design-reviewed page: every element,
   class name, attribute and word is as it was. Progressive enhancement
   lives in <FlagAccordion />, which stands in for the old redline.js. */

export default function LandingPage() {
  return (
    <>
      <a className="skip" href="#schedule">Skip to the schedule of flags</a>

      <div className="sheet">
        <div className="sheet__edge" aria-hidden="true"></div>

        <header className="masthead">
          <div className="masthead__id">
            <p className="wordmark">Redline</p>
            <p className="masthead__line">Inspects a document you can still change, clause by clause.</p>
          </div>
          <dl className="titleblock">
            <div className="titleblock__cell">
              <dt>Document class</dt>
              <dd>Negotiable only</dd>
            </div>
            <div className="titleblock__cell">
              <dt>Method</dt>
              <dd>Eight clause types</dd>
            </div>
            <div className="titleblock__cell">
              <dt>Ranked by</dt>
              <dd>Worst case</dd>
            </div>
          </dl>
        </header>

        <main>
          <section className="hook">
            <h1 className="hook__head">What this document lets them do to you.</h1>
            <p className="hook__stand">Redline reads a negotiable document — a client agreement, statement of work, vendor or service agreement, or lease, anything you still have standing to change — and returns a numbered schedule of flags, ranked by the worst outcome each clause permits. Every flag quotes the sentence it came from, so you can find it in your own copy and check it yourself.</p>
          </section>

          <section className="schedule" id="schedule" aria-labelledby="schedule-head">
            <div className="schedhead">
              <h2 className="schedhead__title" id="schedule-head">Schedule of flags</h2>
              <dl className="schedhead__meta">
                <div className="schedhead__cell">
                  <dt>Document</dt>
                  <dd>Freelance services agreement</dd>
                </div>
                <div className="schedhead__cell">
                  <dt>Inspected</dt>
                  <dd><time dateTime="2026-09-24">24 Sep 2026</time></dd>
                </div>
                <div className="schedhead__cell">
                  <dt>Flags</dt>
                  <dd><span className="tnum">3</span> of <span className="tnum">8</span> clause types</dd>
                </div>
              </dl>
              <a className="action action--inband" href="/workspace">Inspect your own document</a>
            </div>

            <p className="synthetic">Example inspection — the agreement quoted below was written for this page, not a real client’s document.</p>

            <ol className="flags">
              <li>
                <article className="flag flag--lead" id="flag-01">
                  <h3 className="flag__head">
                    <button type="button" className="flag__toggle" aria-expanded="true" aria-controls="flag-01-body">
                      <span className="flag__num tnum">01</span>
                      <span className="sev sev--1">
                        <span className="sev__hatch" aria-hidden="true"></span>
                        <span className="sev__name">Highest severity</span>
                      </span>
                      <span className="flag__type">Personal guarantee</span>
                      <span className="flag__ref tnum">§ 12.4</span>
                      <span className="flag__chevron" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square"><path d="M3 6.5 8 11l5-4.5"/></svg>
                      </span>
                    </button>
                  </h3>
                  <div className="flag__body" id="flag-01-body">
                    <figure className="source">
                      <span className="source__caret" aria-hidden="true">
                        <svg viewBox="0 0 32 20" width="32" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M2 18 16 3l14 15"/></svg>
                      </span>
                      <span className="source__leader" aria-hidden="true"></span>
                      <blockquote className="source__quote">
                        <p>The Contractor personally and unconditionally guarantees all obligations of the Contractor’s company under this Agreement, and this guarantee shall survive termination and remain enforceable against the Contractor individually.</p>
                      </blockquote>
                      <figcaption className="source__cite">Source sentence · <span className="tnum">§ 12.4</span> · quoted verbatim</figcaption>
                    </figure>
                    <div className="flag__cols">
                      <div className="worst">
                        <h4 className="minor">What it permits at worst</h4>
                        <p>Your own assets — not your company’s — can be used to satisfy a claim under this agreement. The guarantee outlives the agreement that created it.</p>
                        <p className="hedge">Whether a court would enforce it, and against which assets, depends on your jurisdiction and how the guarantee was executed.</p>
                      </div>
                      <div className="counter">
                        <h4 className="minor">Counter-offer to send back</h4>
                        <p className="counter__text">Delete clause 12.4. If the Client needs security, offer instead: “The Contractor’s liability under this Agreement is limited to the fees paid or payable under it, and no personal guarantee is given.”</p>
                      </div>
                    </div>
                  </div>
                </article>
              </li>

              <li>
                <article className="flag" id="flag-02">
                  <h3 className="flag__head">
                    <button type="button" className="flag__toggle" aria-expanded="false" aria-controls="flag-02-body">
                      <span className="flag__num tnum">02</span>
                      <span className="sev sev--1">
                        <span className="sev__hatch" aria-hidden="true"></span>
                        <span className="sev__name">Highest severity</span>
                      </span>
                      <span className="flag__type">Uncapped indemnification</span>
                      <span className="flag__ref tnum">§ 9.1</span>
                      <span className="flag__chevron" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square"><path d="M3 6.5 8 11l5-4.5"/></svg>
                      </span>
                    </button>
                  </h3>
                  <div className="flag__body" id="flag-02-body">
                    <figure className="source">
                      <span className="source__caret" aria-hidden="true">
                        <svg viewBox="0 0 32 20" width="32" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M2 18 16 3l14 15"/></svg>
                      </span>
                      <span className="source__leader" aria-hidden="true"></span>
                      <blockquote className="source__quote">
                        <p>The Contractor shall indemnify, defend and hold harmless the Client against any and all claims, losses, damages, liabilities and expenses of any kind arising out of or relating to the Services, without limitation.</p>
                      </blockquote>
                      <figcaption className="source__cite">Source sentence · <span className="tnum">§ 9.1</span> · quoted verbatim</figcaption>
                    </figure>
                    <div className="flag__cols">
                      <div className="worst">
                        <h4 className="minor">What it permits at worst</h4>
                        <p>You pay the Client’s legal costs and losses for a third party’s claim even where you did nothing wrong, with no ceiling and no relation to what you were paid.</p>
                        <p className="hedge">Courts do read some indemnities more narrowly than they are written; how narrowly depends on the wording and the jurisdiction.</p>
                      </div>
                      <div className="counter">
                        <h4 className="minor">Counter-offer to send back</h4>
                        <p className="counter__text">Tie it to fault and cap it: “The Contractor shall indemnify the Client against claims arising from the Contractor’s gross negligence or wilful misconduct, up to the total fees paid under this Agreement.”</p>
                      </div>
                    </div>
                  </div>
                </article>
              </li>

              <li>
                <article className="flag" id="flag-03">
                  <h3 className="flag__head">
                    <button type="button" className="flag__toggle" aria-expanded="false" aria-controls="flag-03-body">
                      <span className="flag__num tnum">03</span>
                      <span className="sev sev--2">
                        <span className="sev__hatch" aria-hidden="true"></span>
                        <span className="sev__name">High severity</span>
                      </span>
                      <span className="flag__type">IP assignment and work-for-hire</span>
                      <span className="flag__ref tnum">§ 6.2</span>
                      <span className="flag__chevron" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square"><path d="M3 6.5 8 11l5-4.5"/></svg>
                      </span>
                    </button>
                  </h3>
                  <div className="flag__body" id="flag-03-body">
                    <figure className="source">
                      <span className="source__caret" aria-hidden="true">
                        <svg viewBox="0 0 32 20" width="32" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M2 18 16 3l14 15"/></svg>
                      </span>
                      <span className="source__leader" aria-hidden="true"></span>
                      <blockquote className="source__quote">
                        <p>All work product, together with all tools, libraries, methods and know-how used or developed in connection with the Services, is a work made for hire and all rights therein vest exclusively in the Client upon creation.</p>
                      </blockquote>
                      <figcaption className="source__cite">Source sentence · <span className="tnum">§ 6.2</span> · quoted verbatim</figcaption>
                    </figure>
                    <div className="flag__cols">
                      <div className="worst">
                        <h4 className="minor">What it permits at worst</h4>
                        <p>The tooling you arrived with, and everything you build alongside the deliverable, transfers to the Client on creation. Reuse and portfolio rights go with it.</p>
                        <p className="hedge">Most commissioned freelance work does not legally qualify as work made for hire even where a contract says it is; what the clause then achieves varies.</p>
                      </div>
                      <div className="counter">
                        <h4 className="minor">Counter-offer to send back</h4>
                        <p className="counter__text">Separate the deliverable from your toolkit: “The Client owns the deliverables on payment in full. The Contractor retains ownership of pre-existing and general-purpose tools, libraries and know-how, and grants the Client a licence to use them as embedded in the deliverables.”</p>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            </ol>
          </section>

          <section className="scope" aria-labelledby="scope-head">
            <div className="scope__intro">
              <h2 className="section-head" id="scope-head">What was looked for</h2>
              <p>The list is fixed and published. You can see what was inspected and what was not — which is the only thing that makes a clean result mean anything.</p>

              <div className="key">
                <h3 className="key__label">Key to the marks</h3>
                <dl className="key__list">
                  <div className="key__item">
                    <dt><span className="sev sev--1"><span className="sev__hatch" aria-hidden="true"></span><span className="sev__name">Highest severity</span></span></dt>
                    <dd>Unbounded, or reaching your own assets.</dd>
                  </div>
                  <div className="key__item">
                    <dt><span className="sev sev--2"><span className="sev__hatch" aria-hidden="true"></span><span className="sev__name">High severity</span></span></dt>
                    <dd>Bounded, but it can cost you your ownership, your remedy, or your ability to earn.</dd>
                  </div>
                  <div className="key__item">
                    <dt><span className="sev sev--3"><span className="sev__hatch" aria-hidden="true"></span><span className="sev__name">Medium severity</span></span></dt>
                    <dd>Bounded by the value of the agreement.</dd>
                  </div>
                </dl>
                <p className="key__note">Rank is what a clause permits at worst, never how common it is. Denser hatch, worse worst case.</p>
              </div>
            </div>

            <div className="scope__col">
            <ol className="scopelist">
              <li className="scoperow scoperow--flagged">
                <span className="scoperow__n tnum">1</span>
                <span className="scoperow__name">Personal guarantees</span>
                <span className="scoperow__status">
                  <span className="sev sev--1"><span className="sev__hatch" aria-hidden="true"></span><span className="sev__name">Flagged · highest</span></span>
                </span>
              </li>
              <li className="scoperow scoperow--flagged">
                <span className="scoperow__n tnum">2</span>
                <span className="scoperow__name">Uncapped indemnification</span>
                <span className="scoperow__status">
                  <span className="sev sev--1"><span className="sev__hatch" aria-hidden="true"></span><span className="sev__name">Flagged · highest</span></span>
                </span>
              </li>
              <li className="scoperow">
                <span className="scoperow__n tnum">3</span>
                <span className="scoperow__name">Non-compete and non-solicit</span>
                <span className="scoperow__status"><span className="sound"><span className="sound__tick" aria-hidden="true"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><path d="M2.5 8.5 6 12l7.5-8"/></svg></span>Inspected · not found</span></span>
              </li>
              <li className="scoperow scoperow--flagged">
                <span className="scoperow__n tnum">4</span>
                <span className="scoperow__name">IP assignment and work-for-hire</span>
                <span className="scoperow__status">
                  <span className="sev sev--2"><span className="sev__hatch" aria-hidden="true"></span><span className="sev__name">Flagged · high</span></span>
                </span>
              </li>
              <li className="scoperow">
                <span className="scoperow__n tnum">5</span>
                <span className="scoperow__name">Limitation of liability and remedy-stripping</span>
                <span className="scoperow__status"><span className="sound"><span className="sound__tick" aria-hidden="true"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><path d="M2.5 8.5 6 12l7.5-8"/></svg></span>Inspected · not found</span></span>
              </li>
              <li className="scoperow">
                <span className="scoperow__n tnum">6</span>
                <span className="scoperow__name">Termination and notice</span>
                <span className="scoperow__status"><span className="sound"><span className="sound__tick" aria-hidden="true"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><path d="M2.5 8.5 6 12l7.5-8"/></svg></span>Inspected · not found</span></span>
              </li>
              <li className="scoperow">
                <span className="scoperow__n tnum">7</span>
                <span className="scoperow__name">Payment terms and nonpayment exposure</span>
                <span className="scoperow__status"><span className="sound"><span className="sound__tick" aria-hidden="true"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><path d="M2.5 8.5 6 12l7.5-8"/></svg></span>Inspected · not found</span></span>
              </li>
              <li className="scoperow">
                <span className="scoperow__n tnum">8</span>
                <span className="scoperow__name">Scope and change control</span>
                <span className="scoperow__status"><span className="sound"><span className="sound__tick" aria-hidden="true"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><path d="M2.5 8.5 6 12l7.5-8"/></svg></span>Inspected · not found</span></span>
              </li>
            </ol>
            <div className="scope__notes">
              <p>A clause that is not on this list is not looked for. A risk that comes from something the document <em>does not say</em> — no notice period, no payment terms, no liability cap — has no sentence to quote, so it is not flagged either.</p>
              <p>You can also declare terms you will not accept, in your own words. Redline treats a match as disqualifying however that clause would otherwise rank.</p>
            </div>
            </div>
          </section>

          <section className="allclear" aria-labelledby="allclear-head">
            <p className="stamp">All clear</p>
            <div className="allclear__body">
              <h2 className="section-head" id="allclear-head">When nothing matches, that is the result you get.</h2>
              <p>An all-clear arrives with the full list of what was checked and found absent. Never an empty screen, and never padded with a manufactured top three so the inspection looks like it earned its keep.</p>
            </div>
          </section>

          <section className="limits" aria-labelledby="limits-head">
            <h2 className="section-head" id="limits-head">Limitations of this inspection</h2>
            <ul className="limitlist">
              <li>
                <h3 className="minor">No verdict</h3>
                <p>Redline never tells you whether to sign, and it is not legal advice. It is flat about what the document says and hedged about what that means.</p>
              </li>
              <li>
                <h3 className="minor">Negotiable documents only</h3>
                <p>Terms of service and other take-it-or-leave-it documents are out of scope. A counter-offer needs someone on the other side who can accept it.</p>
              </li>
              <li>
                <h3 className="minor">Typed text only</h3>
                <p>Scanned or photographed documents are not inspected. A misread character produces a quotation that is wrong in the one way you could not catch.</p>
              </li>
              <li>
                <h3 className="minor">Before you sign</h3>
                <p>Replacement wording is worth nothing once the document is signed. Redline is for the moment the terms can still change.</p>
              </li>
              <li>
                <h3 className="minor">Worst case, not likelihood</h3>
                <p>Late payment is the most common harm a freelancer meets. It still ranks below a personal guarantee, because ranking is by what a clause permits at worst.</p>
              </li>
              <li>
                <h3 className="minor">No sentence, no flag</h3>
                <p>Where the exact wording cannot be quoted, the flag is dropped rather than approximated. That is a defect to fix, not a result to serve you.</p>
              </li>
            </ul>
          </section>

          <section className="bring" id="bring" aria-labelledby="bring-head">
            <h2 className="bring__head" id="bring-head">Bring the document you are about to sign.</h2>
            <p className="bring__line">Paste the text or upload the file. It is read in your browser; only the extracted text is sent to be inspected.</p>
            <a className="action action--lg" href="/workspace">Inspect your own document</a>
          </section>
        </main>

        <footer className="sheetfoot">
          <p className="sheetfoot__mark">Redline</p>
          <p className="sheetfoot__note">Redline describes what a document says. It does not advise you whether to sign, and it is not a substitute for a lawyer. Documents on this page are synthetic examples.</p>
          <p className="sheetfoot__sheet tnum">Sheet 1 of 1</p>
        </footer>
      </div>


      <FlagAccordion />
    </>
  );
}
