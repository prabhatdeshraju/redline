/* @vitest-environment node
 *
 * The one module that talks to a model, checked on what it puts on the wire and
 * on every way a call can fail.
 *
 * Nothing here reaches a network. The call itself is injected, so what is asserted
 * is the request this product actually sends — the pinned provider, fallbacks off,
 * reasoning effort, the JSON schema, and a model identifier that came from the
 * environment rather than from the code. No call has ever been made from this
 * suite against a real key.
 */

import { describe, expect, it } from "vitest";

import { flagRequest } from "@/lib/analysis/clause-search";
import {
  MODEL_ENDPOINT,
  MODEL_ID_VARIABLE,
  MODEL_KEY_VARIABLE,
  PINNED_PROVIDER,
  REASONING_EFFORT,
  createOpenRouterClient,
  modelClientFromEnvironment,
  modelConfiguration,
  requestBody,
  type Send,
} from "@/lib/model/openrouter";

const KEY = "sk-not-a-real-key-0123456789";
/** A value no model provider serves. It exists to prove the identifier travels
 *  from the environment to the wire, and that nothing in the code supplies one. */
const IDENTIFIER = "a-configured-model-identifier";

const request = flagRequest("Contractor guarantees the debt.", []);

type Sent = { readonly url: string; readonly init: Parameters<Send>[1] };

function recording(
  status: number,
  body: string,
): { readonly send: Send; readonly sent: Sent[] } {
  const sent: Sent[] = [];
  const send: Send = async (url, init) => {
    sent.push({ url, init });
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
    };
  };
  return { send, sent };
}

const answering = (payload: unknown): string =>
  JSON.stringify({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  });

describe("what the environment has to supply", () => {
  it("reports both variables missing, by name", () => {
    const configuration = modelConfiguration({});

    expect(configuration.outcome).toBe("unconfigured");
    if (configuration.outcome !== "unconfigured") return;
    expect(configuration.missing).toEqual([
      MODEL_KEY_VARIABLE,
      MODEL_ID_VARIABLE,
    ]);
  });

  it("reports a missing model identifier as a configuration error, not a default", () => {
    const configuration = modelConfiguration({ [MODEL_KEY_VARIABLE]: KEY });

    expect(configuration.outcome).toBe("unconfigured");
    if (configuration.outcome !== "unconfigured") return;
    expect(configuration.missing).toEqual([MODEL_ID_VARIABLE]);
    expect(configuration.statement).toContain(MODEL_ID_VARIABLE);
    expect(configuration.statement).toMatch(/no default/i);
  });

  it("treats an empty or blank value as absent", () => {
    expect(
      modelConfiguration({
        [MODEL_KEY_VARIABLE]: "   ",
        [MODEL_ID_VARIABLE]: "",
      }).outcome,
    ).toBe("unconfigured");
  });

  it("is configured when both are set, and never prints the key", () => {
    const configuration = modelConfiguration({
      [MODEL_KEY_VARIABLE]: KEY,
      [MODEL_ID_VARIABLE]: IDENTIFIER,
    });

    expect(configuration.outcome).toBe("configured");
    if (configuration.outcome !== "configured") return;
    expect(configuration.modelId).toBe(IDENTIFIER);
    expect(JSON.stringify({ ...configuration, apiKey: "" })).not.toContain(KEY);
  });
});

describe("an unconfigured environment reaches no network", () => {
  it("answers every call with a configuration failure instead", async () => {
    const { send, sent } = recording(200, answering({ flags: [] }));
    const client = modelClientFromEnvironment({}, { send });

    const outcome = await client(request);

    expect(sent).toHaveLength(0);
    expect(outcome.outcome).toBe("unavailable");
    if (outcome.outcome !== "unavailable") return;
    expect(outcome.failure.kind).toBe("not-configured");
    expect(outcome.failure.statement).toContain(MODEL_KEY_VARIABLE);
  });
});

describe("the request that goes on the wire", () => {
  async function sendOne() {
    const { send, sent } = recording(200, answering({ flags: [] }));
    await modelClientFromEnvironment(
      { [MODEL_KEY_VARIABLE]: KEY, [MODEL_ID_VARIABLE]: IDENTIFIER },
      { send },
    )(request);
    expect(sent).toHaveLength(1);
    return {
      sent: sent[0],
      body: JSON.parse(sent[0].init.body) as Record<string, unknown>,
    };
  }

  it("goes to the OpenAI-compatible chat-completions endpoint, as a bearer token", async () => {
    const { sent } = await sendOne();

    expect(sent.url).toBe(MODEL_ENDPOINT);
    expect(sent.init.method).toBe("POST");
    expect(sent.init.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(sent.init.headers["Content-Type"]).toBe("application/json");
  });

  it("carries the model identifier the environment supplied", async () => {
    const { body } = await sendOne();

    expect(body.model).toBe(IDENTIFIER);
  });

  it("pins the provider and turns fallbacks off", async () => {
    const { body } = await sendOne();

    expect(body.provider).toEqual({
      order: [PINNED_PROVIDER],
      allow_fallbacks: false,
      require_parameters: true,
    });
  });

  it("asks for low reasoning effort and no variation between runs", async () => {
    const { body } = await sendOne();

    expect(body.reasoning).toEqual({ effort: REASONING_EFFORT });
    expect(REASONING_EFFORT).toBe("low");
    expect(body.temperature).toBe(0);
  });

  it("asks for structure with a schema rather than with a sentence in the prompt", async () => {
    const { body } = await sendOne();

    const format = body.response_format as {
      type: string;
      json_schema: { name: string; strict: boolean; schema: Record<string, unknown> };
    };
    expect(format.type).toBe("json_schema");
    expect(format.json_schema.strict).toBe(true);
    expect(format.json_schema.schema).toEqual(request.responseSchema.schema);

    const messages = body.messages as { role: string; content: string }[];
    expect(messages.map((message) => message.role)).toEqual(["system", "user"]);
    /* No "reply in JSON" anywhere in the instructions: the schema is the
       constraint, and asking twice would hide which one was doing the work. */
    expect(messages[0].content).not.toMatch(/\bJSON\b/);
  });

  it("sends the document as the user message and the rules as the system one", async () => {
    const { body } = await sendOne();
    const messages = body.messages as { role: string; content: string }[];

    expect(messages[1].content).toContain("Contractor guarantees the debt.");
    expect(messages[0].content).toContain("personal-guarantee");
  });

  it("builds the same body outside the call, so this can be read without a network", () => {
    expect(requestBody(IDENTIFIER, request)).toMatchObject({
      model: IDENTIFIER,
      temperature: 0,
      reasoning: { effort: REASONING_EFFORT },
    });
  });
});

describe("every way a call can fail", () => {
  const client = (send: Send) =>
    createOpenRouterClient({ apiKey: KEY, modelId: IDENTIFIER, send });

  it("answers a parsed payload when the call succeeds", async () => {
    const outcome = await client(
      recording(200, answering({ flags: [{ clauseType: "personal-guarantee" }] }))
        .send,
    )(request);

    expect(outcome.outcome).toBe("answered");
    if (outcome.outcome !== "answered") return;
    expect(outcome.payload).toEqual({
      flags: [{ clauseType: "personal-guarantee" }],
    });
  });

  it("reports a refusal with the status the endpoint gave", async () => {
    const outcome = await client(
      recording(402, '{"error":{"message":"insufficient credits"}}').send,
    )(request);

    expect(outcome.outcome).toBe("unavailable");
    if (outcome.outcome !== "unavailable") return;
    expect(outcome.failure.kind).toBe("refused-by-the-endpoint");
    expect(outcome.failure.statement).toContain("402");
    expect(outcome.failure.statement).toContain("insufficient credits");
  });

  it("reports a network failure as one, naming what went wrong", async () => {
    const outcome = await client(async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    })(request);

    expect(outcome.outcome).toBe("unavailable");
    if (outcome.outcome !== "unavailable") return;
    expect(outcome.failure.kind).toBe("network-failure");
    expect(outcome.failure.statement).toContain("ENOTFOUND");
  });

  it("reports an envelope that is not JSON", async () => {
    const outcome = await client(recording(200, "<html>proxy error</html>").send)(
      request,
    );

    expect(outcome.outcome).toBe("unavailable");
    if (outcome.outcome !== "unavailable") return;
    expect(outcome.failure.kind).toBe("answer-was-not-json");
  });

  it("reports content that is not JSON, rather than trying to repair it", async () => {
    const outcome = await client(
      recording(
        200,
        JSON.stringify({
          choices: [{ message: { content: "Here is what I found: ..." } }],
        }),
      ).send,
    )(request);

    expect(outcome.outcome).toBe("unavailable");
    if (outcome.outcome !== "unavailable") return;
    expect(outcome.failure.kind).toBe("answer-was-not-json");
  });

  it("reports an answer that carried no content", async () => {
    for (const body of [
      JSON.stringify({ choices: [] }),
      JSON.stringify({ choices: [{ message: { content: "" } }] }),
      JSON.stringify({ id: "x" }),
    ]) {
      const outcome = await client(recording(200, body).send)(request);

      expect(outcome.outcome).toBe("unavailable");
      if (outcome.outcome !== "unavailable") continue;
      expect(outcome.failure.kind).toBe("answer-was-empty");
    }
  });

  it("puts the key in no failure statement", async () => {
    const sends: Send[] = [
      recording(402, "no credit").send,
      recording(200, "not json").send,
      recording(200, JSON.stringify({ choices: [] })).send,
      async () => {
        throw new Error("socket hang up");
      },
    ];

    for (const send of sends) {
      const outcome = await client(send)(request);
      if (outcome.outcome !== "unavailable") continue;
      expect(outcome.failure.statement).not.toContain(KEY);
      expect(outcome.failure.statement).toMatch(/Nothing was analysed\.$/);
    }
  });
});
