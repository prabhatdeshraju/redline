/* What a model call looks like from the inside of Redline.
 *
 * This module is the seam and nothing else: it describes a request, an answer and
 * the ways a call can fail, and it contains no endpoint, no key, no model
 * identifier and no network. The one implementation that does reach a network is
 * `lib/model/openrouter.ts`, and `tests/one-place-talks-to-a-model.test.ts`
 * asserts that it stays the only one.
 *
 * WHY A FUNCTION TYPE RATHER THAN A CLASS OR A MODULE-LEVEL SINGLETON
 *
 * The analysis boundary is handed a `ModelClient`. Production hands it one built
 * from the environment; the suite hands it one that answers out of the labelled
 * sidecars. That is what makes the boundary testable without a key while still
 * doing its own real work — parsing the answer, applying the taxonomy, running
 * the citation gate, counting what the gate dropped. A singleton reached by
 * import would make the boundary untestable without either a key or a module
 * mock, and a mocked module is a test of the mock.
 *
 * WHY FAILURE IS A RETURN VALUE
 *
 * Every way a model call can fail is a thing the reader has to be told, flatly,
 * in one sentence (ADR 0004): no key, no model identifier, an endpoint that
 * refused, a network that did not answer, an answer that was not JSON. None of
 * them may surface as an empty analysis, because an empty analysis reads as an
 * all-clear and a false all-clear is the most dangerous output this product can
 * produce (`PRD.md` §4.4). Making the failure part of the return type is what
 * stops a caller from accidentally treating one as "nothing found".
 */

/** A JSON Schema object, as the endpoint's structured-output mechanism takes it.
 *  Structure is asked for with a schema rather than with a sentence in the
 *  prompt, so a malformed answer is the endpoint's problem and not ours. */
export type JsonSchema = {
  readonly [key: string]: unknown;
};

/** Which entry point of the analysis boundary is calling.
 *
 * One member today. The summary (ticket 06) and question answering (ticket 10)
 * are the other two entry points the spec names, and they arrive as members here
 * rather than as second clients: there is one place that talks to a model. */
export type ModelPurpose = "flags";

export type ModelRequest = {
  readonly purpose: ModelPurpose;
  /** What the model is being asked to do. Instructions only; no document text. */
  readonly instructions: string;
  /** The document text the answer has to come out of. */
  readonly input: string;
  /** The shape the answer must take, enforced by the endpoint. */
  readonly responseSchema: {
    readonly name: string;
    readonly schema: JsonSchema;
  };
};

export type ModelFailureKind =
  /** No API key, or no model identifier, in the environment. A configuration
   *  error to report, never a value to guess. */
  | "not-configured"
  /** The endpoint answered, and the answer was a refusal or an error status. */
  | "refused-by-the-endpoint"
  /** No answer arrived: a dropped connection, a DNS failure, a timeout. */
  | "network-failure"
  /** An answer arrived carrying no content at all. */
  | "answer-was-empty"
  /** An answer arrived and was not the JSON that was asked for. */
  | "answer-was-not-json";

export type ModelFailure = {
  readonly kind: ModelFailureKind;
  /** One sentence, flat, stating what happened. Safe to show a reader and safe
   *  to print: it never carries a key. */
  readonly statement: string;
};

export type ModelOutcome =
  /** The parsed JSON the model answered with. `unknown` on purpose: the endpoint
   *  enforced a schema, the caller validates anyway, and a type assertion here
   *  would be a claim about a value that arrived over a network. */
  | { readonly outcome: "answered"; readonly payload: unknown }
  | { readonly outcome: "unavailable"; readonly failure: ModelFailure };

export type ModelClient = (request: ModelRequest) => Promise<ModelOutcome>;

export function modelFailure(
  kind: ModelFailureKind,
  statement: string,
): ModelFailure {
  return { kind, statement };
}

export function unavailable(failure: ModelFailure): ModelOutcome {
  return { outcome: "unavailable", failure };
}

export function answered(payload: unknown): ModelOutcome {
  return { outcome: "answered", payload };
}
