import fs from "node:fs";

import type {
  EvidenceItem,
} from "../../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  KnowledgeCompiler,
} from "../KnowledgeCompiler.js";

function readConversationContent(
  evidence: EvidenceItem,
): string {
  if (
    evidence.contentRef &&
    fs.existsSync(
      evidence.contentRef,
    )
  ) {
    return fs.readFileSync(
      evidence.contentRef,
      "utf8",
    );
  }

  const inlineContent =
    evidence.metadata.content;

  return typeof inlineContent === "string"
    ? inlineContent
    : "";
}

function conversationSummary(
  content: string,
): string {
  const normalized =
    content
      .replace(/\s+/g, " ")
      .trim();

  if (
    !normalized
  ) {
    return "Captured governed conversation evidence.";
  }

  return normalized.length > 500
    ? `${normalized.slice(0, 497)}...`
    : normalized;
}

export class ConversationCompiler
  implements KnowledgeCompiler
{
  readonly name =
    "conversation-compiler";

  readonly version =
    "1.0.0";

  supports(
    evidence: EvidenceItem,
  ): boolean {
    return (
      evidence.type ===
      "conversation"
    );
  }

  async compile(
    evidence: EvidenceItem,
  ): Promise<
    KnowledgeIRItem[]
  > {
    if (
      !this.supports(
        evidence,
      )
    ) {
      return [];
    }

    const now =
      Date.now();

    const content =
      readConversationContent(
        evidence,
      );

    return [
      {
        id:
          `conversation:${evidence.id}`,

        candidateType:
          "CandidateLesson",

        title:
          evidence.title,

        summary:
          conversationSummary(
            content,
          ),

        confidence:
          typeof evidence.metadata.confidence ===
          "number"
            ? evidence.metadata.confidence
            : 1,

        evidenceRefs: [
          evidence.id,
        ],

        proposedRelationships: {
          ...evidence.relationships,
        },

        extractedAt:
          now,

        compiler: {
          compilerName:
            this.name,

          compilerVersion:
            this.version,

          evidenceSourceType:
            evidence.type,

          extractedAt:
            now,

          extractionMethod:
            "conversation-compiler",

          confidenceBasis:
            "direct-conversation-evidence",
        },

        status:
          "extracted",

        metadata: {
          source:
            evidence.source,

          contentRef:
            evidence.contentRef,

          checksum:
            evidence.checksum,

          capturedAt:
            evidence.capturedAt,

          observedAt:
            evidence.observedAt,

          conversationId:
            evidence.metadata.conversationId,

          sessionId:
            evidence.metadata.sessionId,

          participants:
            evidence.metadata.participants,

          owner:
            evidence.metadata.owner,

          scope:
            evidence.metadata.scope,

          version:
            evidence.metadata.version,

          sourceLocation:
            evidence.metadata.sourceLocation,

          lineage:
            evidence.metadata.lineage,

          dependencies:
            evidence.metadata.dependencies,

          supersedes:
            evidence.metadata.supersedes,

          supersededBy:
            evidence.metadata.supersededBy,

          approvalState:
            evidence.metadata.approvalState,

          originalMetadata: {
            ...evidence.metadata,
          },
        },
      },
    ];
  }
}
