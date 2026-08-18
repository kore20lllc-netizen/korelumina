import type {
  TextGenerationClient,
} from "../../ai/model/index.js";

import type {
  ChiefAgentReasoningInput,
  ChiefAgentReasoningProvider,
  ChiefAgentReasoningResult,
} from "./ChiefAgentReasoningDestinationAdapter.js";

interface ParsedReasoningResult {
  title?: unknown;
  disposition?: unknown;
  conclusion?: unknown;
  confidence?: unknown;
  evidence?: unknown;
  assumptions?: unknown;
}

function stripJsonFence(
  text: string,
): string {
  return text
    .trim()
    .replace(
      /^```json\s*/i,
      "",
    )
    .replace(
      /^```\s*/i,
      "",
    )
    .replace(
      /```$/i,
      "",
    )
    .trim();
}

function requireNonEmptyString(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `chief_agent_reasoning_invalid_${field}`,
    );
  }

  return value.trim();
}

function requireDisposition(
  value: unknown,
):
  | "authorize"
  | "review"
  | "deny" {
  if (
    value !== "authorize" &&
    value !== "review" &&
    value !== "deny"
  ) {
    throw new Error(
      "chief_agent_reasoning_invalid_disposition",
    );
  }

  return value;
}

function requireConfidence(
  value: unknown,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(
      "chief_agent_reasoning_invalid_confidence",
    );
  }

  return value;
}

function requireStringArray(
  value: unknown,
  field: string,
): string[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        typeof item === "string",
    )
  ) {
    throw new Error(
      `chief_agent_reasoning_invalid_${field}`,
    );
  }

  return value.map(
    (item) =>
      item.trim(),
  );
}

function buildPrompt(
  input:
    ChiefAgentReasoningInput,
): string {
  const canonicalKnowledge =
    input.knowledge
      .canonicalKnowledge
      .map(
        (item) => ({
          id:
            item.id,
          type:
            item.type,
          title:
            item.title,
          summary:
            item.summary,
          confidence:
            item.confidence,
          evidenceRefs:
            item.evidenceRefs,
        }),
      );

  const organizationalMemory =
    input.knowledge
      .organizationalMemory
      .map(
        (record) => ({
          id:
            record.id,
          title:
            record.title,
          summary:
            record.summary,
          source:
            record.source,
          references:
            record.references,
        }),
      );

  return [
    "You are the KoreLumina Chief Agent reasoning engine.",
    "",
    "Use only the governed knowledge supplied below.",
    "Do not invent evidence identifiers.",
    "Do not cite raw Evidence, IR, knowledge packages, or unreviewed material.",
    "If the supplied knowledge explicitly supports proceeding, use disposition authorize.",
    "If proceeding requires human judgment despite sufficient governed evidence, use disposition review.",
    "If governed knowledge is insufficient, contradictory, or explicitly does not authorize the requested action, use disposition deny.",
    "A deny disposition must never be softened merely because an approver was supplied.",
    "",
    "Return JSON only. No markdown. No commentary.",
    "",
    "Required schema:",
    "{",
    '  "title": "short reasoning title",',
    '  "disposition": "authorize | review | deny",',
    '  "conclusion": "reasoned conclusion",',
    '  "confidence": 0.0,',
    '  "evidence": ["canonical-or-memory-id"],',
    '  "assumptions": ["explicit assumption"]',
    "}",
    "",
    `Event type: ${input.eventType}`,
    `Organization: ${input.organizationId ?? "unspecified"}`,
    `Project: ${input.projectId ?? "unspecified"}`,
    `Question: ${input.query ?? input.eventType}`,
    "",
    "Canonical knowledge:",
    JSON.stringify(
      canonicalKnowledge,
      null,
      2,
    ),
    "",
    "Organizational memory:",
    JSON.stringify(
      organizationalMemory,
      null,
      2,
    ),
  ].join("\n");
}

function parseResult(
  text: string,
  input:
    ChiefAgentReasoningInput,
): ChiefAgentReasoningResult {
  let parsed:
    ParsedReasoningResult;

  try {
    parsed =
      JSON.parse(
        stripJsonFence(
          text,
        ),
      ) as ParsedReasoningResult;
  } catch {
    throw new Error(
      "chief_agent_reasoning_invalid_json",
    );
  }

  const evidence =
    requireStringArray(
      parsed.evidence,
      "evidence",
    );

  const allowedEvidence =
    new Set([
      ...input.knowledge
        .canonicalKnowledge
        .map(
          (item) => item.id,
        ),
      ...input.knowledge
        .organizationalMemory
        .map(
          (record) => record.id,
        ),
    ]);

  for (
    const evidenceId
    of evidence
  ) {
    if (
      !allowedEvidence.has(
        evidenceId,
      )
    ) {
      throw new Error(
        `chief_agent_reasoning_unauthorized_evidence:${evidenceId}`,
      );
    }
  }

  return {
    title:
      requireNonEmptyString(
        parsed.title,
        "title",
      ),

    disposition:
      requireDisposition(
        parsed.disposition,
      ),

    conclusion:
      requireNonEmptyString(
        parsed.conclusion,
        "conclusion",
      ),

    confidence:
      requireConfidence(
        parsed.confidence,
      ),

    evidence,

    assumptions:
      requireStringArray(
        parsed.assumptions,
        "assumptions",
      ),
  };
}

export class TextGenerationChiefAgentReasoningProvider
  implements ChiefAgentReasoningProvider
{
  constructor(
    private readonly textClient:
      TextGenerationClient,
  ) {}

  async reason(
    input:
      ChiefAgentReasoningInput,
  ): Promise<ChiefAgentReasoningResult> {
    const generated =
      await this.textClient
        .generateText({
          prompt:
            buildPrompt(
              input,
            ),
        });

    const result =
      parseResult(
        generated.text,
        input,
      );

    return {
      ...result,

      metadata: {
        model:
          generated.model,

        provider:
          "text-generation",
      },
    };
  }
}
