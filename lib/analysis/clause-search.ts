/* What the model is asked for, and the shape its answer has to take.
 *
 * Two things live here: the JSON schema the endpoint enforces, and the
 * instructions, both generated from `taxonomy.ts` rather than written out as
 * prose. That is the spec's "clause taxonomy is data, not prose" applied to the
 * one place it would otherwise leak — adding a clause type is a change to the
 * taxonomy and to the labelled corpus, never an edit to a paragraph in a prompt.
 *
 * TWO THINGS THE SCHEMA DELIBERATELY DOES NOT ASK FOR
 *
 * Severity. It is fixed per clause type by the taxonomy and is never a
 * per-document judgement, so that two runs of the same document rank its flags
 * the same way (ADR 0003). A schema with a severity field would invite a model to
 * supply one, and a supplied one would eventually be used. The boundary reads the
 * band out of the taxonomy for whatever clause type comes back.
 *
 * A location, a clause number, or an offset. ADR 0001 rejected citing a location:
 * section numbering is often absent, duplicated or wrong in extracted text, and a
 * pointer is not something a reader can search their own copy for. The sentence
 * is the citation.
 *
 * WHY ONE CLAUSE TYPE
 *
 * `CLAUSE_TYPES_IN_SCOPE` is the list this build searches for, and it holds one
 * entry: personal guarantees. Ticket 05 adds the other seven by extending the
 * list — the schema, the instructions, the parsing and the gate are all written
 * against the list rather than against the one member, so there is nothing to
 * rewrite. A reader is told what was searched for out of this same list, so the
 * interface cannot claim more was checked than was.
 */

import type { JsonSchema, ModelRequest } from "@/lib/model/model-client";

import type { Threshold } from "./analysis";
import { clauseTypeEntry, type ClauseType } from "./taxonomy";

/** The clause types this build searches for. One of the eight; the rest are
 *  ticket 05. */
export const CLAUSE_TYPES_IN_SCOPE: readonly ClauseType[] = [
  "personal-guarantee",
];

/** The name the structured-output mechanism carries. Not a prompt. */
export const FLAG_SCHEMA_NAME = "redline_flags";

/** The answer's shape, enforced by the endpoint rather than asked for in prose.
 *
 * `clauseType` is an enum of the types in scope, so a type outside the published
 * taxonomy cannot come back at all, and one of the other seven cannot come back
 * from a build that has not been measured against it. */
export function flagResponseSchema(
  clauseTypes: readonly ClauseType[] = CLAUSE_TYPES_IN_SCOPE,
): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["flags"],
    properties: {
      flags: {
        type: "array",
        description:
          "One entry per instance found. Empty when the document contains none.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["clauseType", "sourceSentence", "whatItPermits"],
          properties: {
            clauseType: {
              type: "string",
              enum: [...clauseTypes],
            },
            sourceSentence: {
              type: "string",
              description:
                "One sentence copied character for character out of the document.",
            },
            whatItPermits: {
              type: "string",
              description:
                "What this clause does to the reader, in concrete terms.",
            },
          },
        },
      },
    },
  };
}

function searchedFor(clauseTypes: readonly ClauseType[]): string {
  return clauseTypes
    .map((clauseType) => {
      const entry = clauseTypeEntry(clauseType);
      return [
        `- ${entry.clauseType} — ${entry.title}.`,
        `  The harm that makes it worth flagging: ${entry.worstCase}`,
      ].join("\n");
    })
    .join("\n");
}

function readersOwnLimits(thresholds: readonly Threshold[]): string {
  if (thresholds.length === 0) return "";
  return [
    "",
    "The reader has written down terms they will not accept, in their own words:",
    ...thresholds.map((threshold) => `- ${threshold}`),
    "",
    "A clause of a type above that also crosses one of these is still one flag of",
    "that type. Do not invent a clause type for a threshold, and do not leave out a",
    "clause because it is not on that list.",
  ].join("\n");
}

/** The instructions. Everything in them is a rule from the ADRs or from the
 *  taxonomy; none of it asks for JSON, because the schema does that. */
export function flagInstructions(
  clauseTypes: readonly ClauseType[] = CLAUSE_TYPES_IN_SCOPE,
  thresholds: readonly Threshold[] = [],
): string {
  return [
    "You read a document somebody is about to sign and find the clauses that shift",
    "risk onto them. They are the weaker party: less legal budget, less time, less",
    "leverage than whoever wrote the document, and they usually need the deal more.",
    "",
    "Find every instance of these clause types and nothing else:",
    "",
    searchedFor(clauseTypes),
    readersOwnLimits(thresholds),
    "",
    "THE SENTENCE",
    "",
    "Each instance you report carries one sentence copied out of the document,",
    "character for character: the same words, the same punctuation, the same",
    "apostrophes and quotation marks, the same spacing. Do not tidy it, do not",
    "shorten it, do not join two sentences, do not use an ellipsis, do not correct a",
    "typo, do not translate it. The reader searches their own copy of the document",
    "for that sentence to check your work, so a sentence that does not occur in the",
    "text exactly as you wrote it is thrown away and the clause goes unreported.",
    "Choose the one sentence that does the damage, not the whole clause and not the",
    "heading above it.",
    "",
    "If a clause is real but you cannot reproduce a sentence from it exactly, leave",
    "it out rather than approximating one.",
    "",
    "WHAT IT DOES TO THE READER",
    "",
    "Say what the clause does to this reader, concretely, in one or two sentences.",
    "Name the consequence, not the category: not \"this is a personal guarantee\" but",
    "what the document lets the other side do, to whom, and to what.",
    "",
    "Be flat and certain about what the document says — that is a fact, and it is",
    "never softened. Carry the uncertainty where it belongs, on what a clause would",
    "mean legally: whether a court would enforce it, in which jurisdiction, against",
    "which assets. Never tell the reader whether to sign, never advise them, never",
    "state a legal outcome as a fact, and never recommend anything.",
    "",
    "WHAT NOT TO DO",
    "",
    "Flag a clause because of what it does to the reader, not because it is unusual.",
    "Standard boilerplate that shifts serious risk is still reported. An unusual but",
    "fair term is not.",
    "",
    "Report each instance separately: three separate indemnities are three entries,",
    "not one. Do not report the same sentence twice.",
    "",
    "Report nothing that is not in the document. An empty list is the right answer",
    "for a document that contains none of these clause types, and inventing a",
    "concern to look useful is worse than finding nothing.",
  ].join("\n");
}

/** The document, as the message the answer has to come out of. */
export function flagInput(documentText: string): string {
  return ["THE DOCUMENT", "", documentText].join("\n");
}

/** The whole request, assembled. The boundary hands this to whichever model
 *  client it was given. */
export function flagRequest(
  documentText: string,
  thresholds: readonly Threshold[],
  clauseTypes: readonly ClauseType[] = CLAUSE_TYPES_IN_SCOPE,
): ModelRequest {
  return {
    purpose: "flags",
    instructions: flagInstructions(clauseTypes, thresholds),
    input: flagInput(documentText),
    responseSchema: {
      name: FLAG_SCHEMA_NAME,
      schema: flagResponseSchema(clauseTypes),
    },
  };
}
