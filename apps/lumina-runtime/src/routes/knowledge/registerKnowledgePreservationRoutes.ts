import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  EvidenceItem,
  EvidenceType,
} from "../../knowledge-preservation/evidence/index.js";

import type {
  KnowledgePreservationPlatform,
} from "../../knowledge-preservation/bootstrap/index.js";

const EVIDENCE_TYPES =
  new Set<EvidenceType>([
    "conversation",
    "commit",
    "tag",
    "branch",
    "ADR",
    "RFC",
    "document",
    "source-file",
    "runtime-event",
    "engineering-execution",
    "issue",
    "pull-request",
    "specification",
    "roadmap",
    "milestone",
    "build-output",
    "incident-log",
  ]);

function readString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value,
    )
  );
}

function readRelationships(
  value: unknown,
): Record<string, string[]> {
  if (
    !isRecord(
      value,
    )
  ) {
    return {};
  }

  const result:
    Record<string, string[]> =
      {};

  for (
    const [
      key,
      candidate,
    ]
    of Object.entries(
      value,
    )
  ) {
    if (
      Array.isArray(
        candidate,
      ) &&
      candidate.every(
        (item) =>
          typeof item ===
          "string",
      )
    ) {
      result[key] =
        candidate;
    }
  }

  return result;
}

export interface KnowledgePreservationRouteRuntime {
  preservationPlatform:
    KnowledgePreservationPlatform;
}

export function registerKnowledgePreservationRoutes(
  app: Express,
  runtime:
    KnowledgePreservationRouteRuntime,
): void {
  app.post(
    "/api/knowledge/preserve",
    async (
      req: Request,
      res: Response,
    ) => {
      const body =
        req.body ?? {};

      const id =
        readString(
          body.id,
        );

      const type =
        readString(
          body.type,
        );

      const title =
        readString(
          body.title,
        );

      const source =
        readString(
          body.source,
        );

      const contentRef =
        readString(
          body.contentRef,
        );

      if (!id) {
        return res.status(400).json({
          ok: false,
          error:
            "knowledge_evidence_id_required",
        });
      }

      if (
        !EVIDENCE_TYPES.has(
          type as EvidenceType,
        )
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "knowledge_evidence_type_invalid",
        });
      }

      if (!title) {
        return res.status(400).json({
          ok: false,
          error:
            "knowledge_evidence_title_required",
        });
      }

      if (!source) {
        return res.status(400).json({
          ok: false,
          error:
            "knowledge_evidence_source_required",
        });
      }

      if (!contentRef) {
        return res.status(400).json({
          ok: false,
          error:
            "knowledge_evidence_content_ref_required",
        });
      }

      if (
        typeof body.capturedAt !==
          "number" ||
        !Number.isFinite(
          body.capturedAt,
        )
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "knowledge_evidence_captured_at_required",
        });
      }

      if (
        typeof body.observedAt !==
          "number" ||
        !Number.isFinite(
          body.observedAt,
        )
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "knowledge_evidence_observed_at_required",
        });
      }

      const evidence:
        EvidenceItem = {
          id,

          type:
            type as EvidenceType,

          title,

          source,

          capturedAt:
            body.capturedAt,

          observedAt:
            body.observedAt,

          contentRef,

          checksum:
            typeof body.checksum ===
              "string"
              ? body.checksum.trim()
              : undefined,

          metadata:
            isRecord(
              body.metadata,
            )
              ? body.metadata
              : {},

          relationships:
            readRelationships(
              body.relationships,
            ),
        };

      try {
        await runtime
          .preservationPlatform
          .preserve(
            evidence,
          );

        const knowledgePackage =
          runtime
            .preservationPlatform
            .packageService
            .list()
            .find(
              (candidate) =>
                candidate
                  .sourceEvidenceRefs
                  .includes(
                    evidence.id,
                  ),
            );

        if (
          !knowledgePackage
        ) {
          return res.status(500).json({
            ok: false,
            error:
              "knowledge_preservation_package_not_created",
          });
        }

        return res.json({
          ok: true,
          evidenceId:
            evidence.id,
          package:
            knowledgePackage,
        });
      } catch (error) {
        return res.status(400).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    },
  );
}
