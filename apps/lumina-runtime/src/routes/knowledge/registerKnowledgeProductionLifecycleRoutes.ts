import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  CanonicalKnowledgeItem,
  CanonicalKnowledgeStore,
} from "../../canonical-knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "../../knowledge/organizational-memory/index.js";

import type {
  KnowledgePackageService,
} from "../../knowledge-preservation/package/index.js";

import type {
  KnowledgeManufacturingRunService,
} from "../../knowledge-preservation/manufacturing/index.js";

import type {
  KnowledgeManufacturingReplayService,
} from "../../knowledge-preservation/manufacturing/index.js";

export interface KnowledgeProductionLifecycleMemoryStore {
  list():
    OrganizationalMemoryRecord[];
}

export interface KnowledgeProductionLifecycleRuntime {
  packageService:
    KnowledgePackageService;

  manufacturingRunService:
    KnowledgeManufacturingRunService;

  replayService:
    KnowledgeManufacturingReplayService;

  canonicalStore:
    CanonicalKnowledgeStore;

  memoryStore:
    KnowledgeProductionLifecycleMemoryStore;
}

function canonicalPackageId(
  item:
    CanonicalKnowledgeItem,
): string | null {
  const governance =
    item.metadata
      .governance;

  if (
    !governance ||
    typeof governance !==
      "object" ||
    Array.isArray(
      governance,
    )
  ) {
    return null;
  }

  const packageId =
    (
      governance as
        Record<
          string,
          unknown
        >
    ).packageId;

  return typeof packageId ===
      "string" &&
    packageId.trim()
    ? packageId
    : null;
}

export function registerKnowledgeProductionLifecycleRoutes(
  app:
    Express,

  runtime:
    KnowledgeProductionLifecycleRuntime,
): void {
  app.get(
    "/api/knowledge/production-lifecycle",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      const manufacturingRuns =
        runtime.manufacturingRunService
          .list();

      const packages =
        runtime.packageService
          .list()
          .sort(
            (
              left,
              right,
            ) =>
              right.updatedAt -
              left.updatedAt,
          );

      const packageIds =
        new Set(
          packages.map(
            (knowledgePackage) =>
              knowledgePackage.id,
          ),
        );

      const canonicalItems =
        runtime.canonicalStore
          .list()
          .filter(
            (item) => {
              const packageId =
                canonicalPackageId(
                  item,
                );

              return (
                packageId !==
                  null &&
                packageIds.has(
                  packageId,
                )
              );
            },
          );

      const organizationalMemory =
        runtime.memoryStore
          .list()
          .filter(
            (record) => {
              const packageId =
                record.governance
                  ?.packageId;

              return (
                typeof packageId ===
                  "string" &&
                packageIds.has(
                  packageId,
                )
              );
            },
          );

      return res.json({
        ok:
          true,

        manufacturingRuns,

        manufacturingReplay:
          runtime.replayService
            .get(),

        packages,

        canonicalItems,

        organizationalMemory,

        summary: {
          manufacturingRuns:
            manufacturingRuns.length,

          activeManufacturingRuns:
            manufacturingRuns.filter(
              (run) =>
                run.status ===
                "active",
            ).length,

          blockedManufacturingRuns:
            manufacturingRuns.filter(
              (run) =>
                run.status ===
                "blocked",
            ).length,

          failedManufacturingRuns:
            manufacturingRuns.filter(
              (run) =>
                run.status ===
                "failed",
            ).length,

          completedManufacturingRuns:
            manufacturingRuns.filter(
              (run) =>
                run.status ===
                "completed",
            ).length,

          packages:
            packages.length,

          awaitingReview:
            packages.filter(
              (item) =>
                item.state ===
                "awaiting_review",
            ).length,

          approved:
            packages.filter(
              (item) =>
                item.state ===
                "approved",
            ).length,

          canonical:
            packages.filter(
              (item) =>
                item.state ===
                  "canonical" ||
                item.state ===
                  "adapted",
            ).length,

          adapted:
            packages.filter(
              (item) =>
                item.state ===
                "adapted",
            ).length,

          canonicalItems:
            canonicalItems.length,

          organizationalMemory:
            organizationalMemory.length,
        },
      });
    },
  );
}
