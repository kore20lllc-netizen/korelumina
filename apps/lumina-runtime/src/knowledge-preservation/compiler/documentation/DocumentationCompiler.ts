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

function readDocumentContent(
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

function documentSummary(
  content: string,
): string {
  const normalized =
    content
      .replace(/\s+/g, " ")
      .trim();

  if (
    !normalized
  ) {
    return "Approved documentation evidence.";
  }

  return normalized.length > 500
    ? `${normalized.slice(0, 497)}...`
    : normalized;
}

export class DocumentationCompiler
  implements KnowledgeCompiler
{
  readonly name =
    "documentation-compiler";

  readonly version =
    "1.0.0";

  supports(
    evidence: EvidenceItem,
  ): boolean {
    return (
      evidence.type ===
      "document"
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
      readDocumentContent(
        evidence,
      );

    return [
      {
        id:
          `document:${evidence.id}`,

        candidateType:
          "CandidateArtifact",

        title:
          evidence.title,

        summary:
          documentSummary(
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
            "documentation-compiler",

          confidenceBasis:
            "direct-document-evidence",
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

          authorityClass:
            evidence.metadata.authorityClass,

          approvalState:
            evidence.metadata.approvalState,

          owner:
            evidence.metadata.owner,

          scope:
            evidence.metadata.scope,

          version:
            evidence.metadata.version,

          sourceLocation:
            evidence.metadata.sourceLocation,

          supersedes:
            evidence.metadata.supersedes,

          supersededBy:
            evidence.metadata.supersededBy,

          lineage:
            evidence.metadata.lineage,

          dependencies:
            evidence.metadata.dependencies,

          originalMetadata: {
            ...evidence.metadata,
          },
        },
      },
    ];
  }
}
