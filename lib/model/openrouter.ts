/* The one place in Redline that talks to a model.
 *
 *     createOpenRouterClient({ apiKey, modelId }) -> ModelClient
 *     modelClientFromEnvironment(process.env)     -> ModelClient
 *
 * Nothing else in the product may reach a model, and
 * `tests/one-place-talks-to-a-model.test.ts` reads the source and asserts it:
 * this is the only module that names `fetch`, the only one that names the
 * endpoint, and the only one that reads the two environment variables below. The
 * spec's reason is grounding discipline — "the analysis boundary is the only
 * caller, so there is exactly one place where grounding discipline has to hold" —
 * and a rule with one enforced location is a rule that survives the next feature.
 *
 * WHAT IS PINNED, AND WHY IT IS PINNED HERE
 *
 * - The provider is pinned to a single upstream with fallbacks off. A silent
 *   failover changes the model that produced an analysis without changing
 *   anything a reader or a report can see, and `PRD.md` §4.6 is a compliance test
 *   against a specific system rather than against "whatever answered".
 * - Structured output is asked for with a JSON schema, not with a sentence in the
 *   prompt. A prompt asking politely for JSON is a request; a schema is a
 *   constraint, and the difference shows up as a parse failure in production.
 * - The model identifier is read from the environment and appears nowhere in this
 *   repository's code. There is no default and no fallback: an unset identifier
 *   is a configuration error to report, not a value to guess. Guessing one would
 *   produce an analysis attributed to a model nobody chose.
 * - Reasoning effort is low. The work asked for here is locating and transcribing
 *   a sentence out of a supplied text, not deriving anything.
 * - Temperature is zero, because the same document should produce the same
 *   analysis twice (spec, "Reproducibility").
 *
 * The key is read, sent in a header, and never returned, logged or put into a
 * failure statement. Every statement this module produces is safe to print.
 */

import {
  answered,
  modelFailure,
  unavailable,
  type JsonSchema,
  type ModelClient,
  type ModelOutcome,
  type ModelRequest,
} from "./model-client";

/** The OpenAI-compatible chat-completions endpoint. */
export const MODEL_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** The two environment variables this module reads. Exported as constants so a
 *  caller reporting a configuration problem can name them without a second copy
 *  of the name appearing anywhere else in the code. */
export const MODEL_KEY_VARIABLE = "OPENROUTER_API_KEY";
export const MODEL_ID_VARIABLE = "OPENROUTER_MODEL";

/** The single upstream provider. Fallbacks are off, so a run either reaches this
 *  provider or fails and says so. */
export const PINNED_PROVIDER = "fireworks";

export const REASONING_EFFORT = "low";

/** How long one call may take before it is abandoned and reported as a network
 *  failure. A request that hangs forever is indistinguishable, to whoever is
 *  waiting, from a product that is broken. */
export const REQUEST_TIMEOUT_MS = 120_000;

export type Environment = Readonly<Record<string, string | undefined>>;

/** The platform's own network call, or whatever a test hands in. Narrow on
 *  purpose: this module makes one kind of call and needs one kind of answer. */
export type Send = (
  url: string,
  init: {
    readonly method: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
    readonly signal?: AbortSignal;
  },
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  text: () => Promise<string>;
}>;

export type ModelConfiguration =
  | {
      readonly outcome: "configured";
      readonly apiKey: string;
      readonly modelId: string;
    }
  | {
      readonly outcome: "unconfigured";
      /** The variables that are missing, by name. */
      readonly missing: readonly string[];
      /** One sentence naming what is missing. Safe to print. */
      readonly statement: string;
    };

/** What the environment says about model access. The key's value is carried in
 *  the return value for the client to use, and is never printed. */
export function modelConfiguration(env: Environment): ModelConfiguration {
  const apiKey = (env[MODEL_KEY_VARIABLE] ?? "").trim();
  const modelId = (env[MODEL_ID_VARIABLE] ?? "").trim();

  const missing: string[] = [];
  if (apiKey.length === 0) missing.push(MODEL_KEY_VARIABLE);
  if (modelId.length === 0) missing.push(MODEL_ID_VARIABLE);

  if (missing.length === 1) {
    return {
      outcome: "unconfigured",
      missing,
      statement: `${missing[0]} is not set in this environment, so no model can be called. It has no default in the code: a model identifier is a decision, not something to guess at.`,
    };
  }
  if (missing.length === 2) {
    return {
      outcome: "unconfigured",
      missing,
      statement: `Neither ${MODEL_KEY_VARIABLE} nor ${MODEL_ID_VARIABLE} is set in this environment, so no model can be called. Neither has a default in the code.`,
    };
  }

  return { outcome: "configured", apiKey, modelId };
}

/** The body that goes on the wire, built separately from the call that sends it,
 *  so what is sent can be asserted without a network. */
export function requestBody(
  modelId: string,
  request: ModelRequest,
): Readonly<Record<string, unknown>> {
  return {
    model: modelId,
    messages: [
      { role: "system", content: request.instructions },
      { role: "user", content: request.input },
    ],
    temperature: 0,
    reasoning: { effort: REASONING_EFFORT },
    provider: {
      order: [PINNED_PROVIDER],
      allow_fallbacks: false,
      require_parameters: true,
    },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: request.responseSchema.name,
        strict: true,
        schema: request.responseSchema.schema as JsonSchema,
      },
    },
  };
}

/** The content of the first choice, or null when the answer carried none. */
function contentOf(envelope: unknown): string | null {
  if (typeof envelope !== "object" || envelope === null) return null;
  const choices = (envelope as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  const content = (message as { content?: unknown }).content;
  if (typeof content !== "string" || content.trim().length === 0) return null;
  return content;
}

/** At most this many characters of the endpoint's own error text are repeated in
 *  a failure statement: enough to tell a payment problem from a rate limit from a
 *  model identifier nobody recognises, short enough not to paste a wall of HTML
 *  into a report. */
const ERROR_EXCERPT = 300;

export type OpenRouterOptions = {
  readonly apiKey: string;
  readonly modelId: string;
  /** Injected in tests. Production uses the platform's own. */
  readonly send?: Send;
  readonly timeoutMs?: number;
};

export function createOpenRouterClient(options: OpenRouterOptions): ModelClient {
  const send: Send = options.send ?? ((url, init) => fetch(url, init));
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

  return async (request: ModelRequest): Promise<ModelOutcome> => {
    let response: Awaited<ReturnType<Send>>;
    try {
      response = await send(MODEL_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody(options.modelId, request)),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      /* The key is never in this message. Only the reason the call did not
         complete, which is what whoever is waiting needs. */
      return unavailable(
        modelFailure(
          "network-failure",
          `The model could not be reached: ${error instanceof Error ? error.message : String(error)}. Nothing was analysed.`,
        ),
      );
    }

    let raw: string;
    try {
      raw = await response.text();
    } catch (error) {
      return unavailable(
        modelFailure(
          "network-failure",
          `The model's answer could not be read: ${error instanceof Error ? error.message : String(error)}. Nothing was analysed.`,
        ),
      );
    }

    if (!response.ok) {
      return unavailable(
        modelFailure(
          "refused-by-the-endpoint",
          `The model endpoint refused the request with status ${response.status}: ${raw.slice(0, ERROR_EXCERPT).trim() || "no reason given"}. Nothing was analysed.`,
        ),
      );
    }

    let envelope: unknown;
    try {
      envelope = JSON.parse(raw);
    } catch {
      return unavailable(
        modelFailure(
          "answer-was-not-json",
          "The model endpoint answered with something that was not JSON. Nothing was analysed.",
        ),
      );
    }

    const content = contentOf(envelope);
    if (content === null) {
      return unavailable(
        modelFailure(
          "answer-was-empty",
          "The model answered with no content. Nothing was analysed.",
        ),
      );
    }

    try {
      return answered(JSON.parse(content));
    } catch {
      /* A schema was asked for, so this is the endpoint or the provider not
         honouring it rather than a prompt that was not firm enough. It is
         reported rather than repaired: half an analysis is worse than none. */
      return unavailable(
        modelFailure(
          "answer-was-not-json",
          "The model answered with text rather than the JSON structure that was asked for. Nothing was analysed.",
        ),
      );
    }
  };
}

/** The production client.
 *
 * Always a client, even when the environment is incomplete: an unconfigured one
 * reports `not-configured` on every call and reaches no network. The caller has
 * one code path and one kind of thing to report, and a missing key can never be
 * mistaken for a document with nothing in it. */
export function modelClientFromEnvironment(
  env: Environment,
  options: { readonly send?: Send; readonly timeoutMs?: number } = {},
): ModelClient {
  const configuration = modelConfiguration(env);

  if (configuration.outcome === "unconfigured") {
    return async () =>
      unavailable(modelFailure("not-configured", configuration.statement));
  }

  return createOpenRouterClient({
    apiKey: configuration.apiKey,
    modelId: configuration.modelId,
    send: options.send,
    timeoutMs: options.timeoutMs,
  });
}
