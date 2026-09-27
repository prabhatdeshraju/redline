/* The eight clause types, as data.
 *
 * `PRD.md` §5 fixes the list and ADR 0003 publishes it. It is data rather than
 * prose in a prompt because three things read it: the interface, which shows the
 * reader what was looked for; the all-clear, which lists what was checked and
 * found absent; and the harness, which reports recall per clause type. Adding a
 * type is a change here plus a change to the labelled corpus, never a prose edit
 * (spec, "Clause taxonomy is data, not prose").
 *
 * Severity is the worst outcome a clause permits, independent of how likely that
 * outcome is, and it is fixed per clause type rather than judged per document —
 * so the ordering of two flags is reproducible across runs of the same document
 * (ADR 0003).
 *
 * The slugs are the ones `tests/fixtures/README.md` already established. There is
 * one vocabulary for clause types in this repository and this is it.
 */

/** One of the three bands in `PRD.md` §5. No other value is valid. */
export type Severity = "highest" | "high" | "medium";

/** One of the fixed eight. The set is closed: "anything else risky" cannot be
 *  measured, so it cannot support a claim that the analysis is trustworthy
 *  (ADR 0003). */
export type ClauseType =
  | "personal-guarantee"
  | "uncapped-indemnification"
  | "non-compete-non-solicit"
  | "ip-assignment-work-for-hire"
  | "limitation-of-liability"
  | "termination-and-notice"
  | "payment-terms"
  | "scope-and-change-control";

export type ClauseTypeEntry = {
  readonly clauseType: ClauseType;
  /** The heading `PRD.md` §5 gives this type. */
  readonly title: string;
  readonly severity: Severity;
  /** The worst outcome the clause permits, transcribed from `PRD.md` §5. It is
   *  the band's justification, and it is what a reader-facing description has to
   *  be faithful to. */
  readonly worstCase: string;
};

/** Bumped when a type is added, removed, or moves band. A recall number is only
 *  comparable against another run of the same version. */
export const CLAUSE_TAXONOMY_VERSION = 1;

export const CLAUSE_TAXONOMY: readonly ClauseTypeEntry[] = [
  {
    clauseType: "personal-guarantee",
    title: "Personal guarantees",
    severity: "highest",
    worstCase:
      "The reader's personal assets satisfy a business debt, converting a bounded business risk into an unbounded personal one.",
  },
  {
    clauseType: "uncapped-indemnification",
    title: "Uncapped indemnification",
    severity: "highest",
    worstCase:
      "Liability far exceeding the value of the contract, triggered by a third party's claim rather than by anything the reader did wrong.",
  },
  {
    clauseType: "non-compete-non-solicit",
    title: "Non-compete and non-solicit",
    severity: "high",
    worstCase:
      "Barred from earning in the reader's own field, or from working with the clients they already have.",
  },
  {
    clauseType: "ip-assignment-work-for-hire",
    title: "IP assignment and work-for-hire",
    severity: "high",
    worstCase:
      "The reader loses ownership of work they expected to reuse, including portfolio rights and tooling built along the way.",
  },
  {
    clauseType: "limitation-of-liability",
    title: "Limitation of liability and remedy-stripping",
    severity: "high",
    worstCase:
      "The other side is functionally exculpated from its own wrongdoing and the reader has no remedy worth pursuing.",
  },
  {
    clauseType: "termination-and-notice",
    title: "Termination and notice",
    severity: "medium",
    worstCase:
      "Terminated without notice and unpaid for work already delivered, or locked in by a notice period the reader cannot afford to serve.",
  },
  {
    clauseType: "payment-terms",
    title: "Payment terms and nonpayment exposure",
    severity: "medium",
    worstCase:
      "Unpaid for work delivered, bounded by the contract value, which is why it ranks here rather than higher.",
  },
  {
    clauseType: "scope-and-change-control",
    title: "Scope and change control",
    severity: "medium",
    worstCase:
      "Unbounded unpaid work through reasonable revisions or undefined deliverables.",
  },
];

/** Every clause type, in severity order: the order the list is published in and
 *  the order flags rank in. */
export const CLAUSE_TYPES: readonly ClauseType[] = CLAUSE_TAXONOMY.map(
  (entry) => entry.clauseType,
);

const BY_CLAUSE_TYPE = new Map<ClauseType, ClauseTypeEntry>(
  CLAUSE_TAXONOMY.map((entry) => [entry.clauseType, entry]),
);

/** The taxonomy's entry for a clause type. Throws on a type that is not in the
 *  list, because the caller reading a label or a model's answer needs to know
 *  that it was not one of the eight rather than receive a blank. */
export function clauseTypeEntry(clauseType: ClauseType): ClauseTypeEntry {
  const entry = BY_CLAUSE_TYPE.get(clauseType);
  if (!entry) {
    throw new Error(
      `"${clauseType}" is not one of the ${CLAUSE_TAXONOMY.length} clause types in PRD.md section 5`,
    );
  }
  return entry;
}

/** Whether a value read from outside the code — a corpus label, a model's
 *  answer — names one of the eight. */
export function isClauseType(value: unknown): value is ClauseType {
  return typeof value === "string" && BY_CLAUSE_TYPE.has(value as ClauseType);
}

/** The severity band this clause type carries. Fixed per type: a per-document
 *  judgement would make the ordering of the same document vary between runs. */
export function severityOf(clauseType: ClauseType): Severity {
  return clauseTypeEntry(clauseType).severity;
}

/** Worst case first. */
export const SEVERITY_ORDER: readonly Severity[] = ["highest", "high", "medium"];

export function severityRank(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

export function isSeverity(value: unknown): value is Severity {
  return (
    typeof value === "string" &&
    (SEVERITY_ORDER as readonly string[]).includes(value)
  );
}
