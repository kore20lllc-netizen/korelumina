import type {
  TextGenerationClient,
} from "../../ai/model/index.js";

import type {
  ChiefAgentReasoningInput,
  ChiefAgentReasoningProvider,
  ChiefAgentReasoningResult,
} from "./ChiefAgentReasoningDestinationAdapter.js";
import {
  readMissionProposal,
} from "../mission/MissionProposal.js";

interface ParsedReasoningResult {
  title?: unknown;
  disposition?: unknown;
  conclusion?: unknown;
  confidence?: unknown;
  evidence?: unknown;
  assumptions?: unknown;
  missionProposal?: unknown;
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
  const governedContent =
    new Map(
      (
        input.knowledge
          .governedContent
          ?.included ?? []
      ).map(
        (entry) => [
          entry.id,
          entry,
        ],
      ),
    );

  const canonicalKnowledge =
    input.knowledge
      .canonicalKnowledge
      .map(
        (item) => {
          const content =
            governedContent.get(
              item.id,
            );

          return {
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
            ...(content
              ? {
                  certifiedContent:
                    content.content,
                  certifiedContentTruncated:
                    content.truncated,
                }
              : {}),
          };
        },
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

  const operationalState =
    input.operationalState;

  const operationalSection =
    operationalState
      ? [
          "",
          `Live operational state (read-only, captured ${operationalState.capturedAt}):`,
          JSON.stringify(
            {
              entries:
                operationalState.entries,
              unavailable:
                operationalState.unavailable,
            },
            null,
            2,
          ),
        ]
      : [];

  return [
    "You are the KoreLumina Chief Agent reasoning engine.",
    "",
    "Use only the governed knowledge supplied below.",
    "Where an item includes certifiedContent, that is the certified text of the document; base your reasoning on it. Items without it are known only by title and summary.",
    "Do not invent evidence identifiers.",
    "Do not cite raw Evidence, IR, knowledge packages, or unreviewed material.",
    "If the supplied knowledge explicitly supports proceeding, use disposition authorize.",
    "If proceeding requires human judgment despite sufficient governed evidence, use disposition review.",
    "If governed knowledge is insufficient, contradictory, or explicitly does not authorize the requested action, use disposition deny.",
    "A deny disposition must never be softened merely because an approver was supplied.",
    ...(operationalState
      ? [
          "",
          "Live operational state describes what is happening on the platform now: activation, learning, pending approvals, recent decisions, and knowledge waiting for canonical review.",
          "Use it to answer questions about current, pending, waiting, running, or recent work, and cite its operational ids when you rely on it.",
          "It is not governed knowledge: it never authorizes an action by itself, and governed knowledge decides what should be done about it.",
          "If a part is listed as unavailable, say you could not see it; do not guess.",
        ]
      : []),
    "",
    "Return JSON only. No markdown. No commentary.",
    "",
    "Required schema:",
    "{",
    '  "title": "short reasoning title",',
    '  "disposition": "authorize | review | deny",',
    '  "conclusion": "reasoned conclusion",',
    '  "confidence": 0.0,',
    '  "evidence": ["canonical-memory-or-operational-id"],',
    '  "assumptions": ["explicit assumption"],',
    '  "missionProposal": null',
    "}",
    "",
    "missionProposal is optional and normally null. Fill it only when the owner asks you to propose or plan a mission, or when the question can only be answered by work that should become a mission.",
    "A proposal is never approved by you: it becomes a mission awaiting the owner's approval. Do not propose with disposition deny.",
    "To propose a new mission:",
    '  {"title": "...", "objective": "...", "description": "...", "type": "engineering | architecture | recovery | knowledge-acquisition | documentation | deployment | maintenance | research | governance | security | operational", "priority": "critical | high | normal | low", "risks": ["..."], "relatedRepositories": ["..."], "plan": {"epics": [{"title": "...", "tasks": [{"title": "...", "acceptanceCriteria": ["..."]}]}], "validationPlan": ["..."], "requiredDocuments": ["..."]}}',
    "To propose a plan for an existing draft or planned mission, give its id and the plan only:",
    '  {"missionId": "MS-YYYY-NNNN", "plan": {...}}',
    "Every plan needs at least one task with acceptance criteria. Only use mission ids listed in the live operational state.",
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
    ...operationalSection,
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
      ...(input.operationalState
        ?.entries ?? []
      ).map(
        (entry) => entry.id,
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

    ...missionProposalFrom(
      parsed.missionProposal,
    ),
  };
}

/*
 * MS-3: a malformed proposal never fails the reply; it is dropped and
 * the reason is kept with the reasoning.
 */
function missionProposalFrom(
  value: unknown,
): Pick<ChiefAgentReasoningResult, "missionProposal" | "metadata"> {
  const reading =
    readMissionProposal(
      value,
    );

  if (!reading) {
    return {};
  }

  return "proposal" in reading
    ? { missionProposal: reading.proposal }
    : { metadata: { missionProposalInvalid: reading.invalid } };
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
        ...(result.metadata ?? {}),

        model:
          generated.model,

        provider:
          "text-generation",
      },
    };
  }
}
