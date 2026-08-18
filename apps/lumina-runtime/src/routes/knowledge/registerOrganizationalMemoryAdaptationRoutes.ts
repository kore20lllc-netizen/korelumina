import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  CanonicalKnowledgeStore,
} from "../../canonical-knowledge/index.js";

import type {
  GovernedCanonicalMemoryAdaptationService,
} from "../../knowledge/organizational-memory/index.js";

import type {
  KnowledgePackageService,
} from "../../knowledge-preservation/package/index.js";

interface CanonicalizationMetadata {
  canonicalItemIds?:
    unknown;
}

export interface OrganizationalMemoryAdaptationRuntime {
  packageService:
    KnowledgePackageService;

  canonicalStore:
    CanonicalKnowledgeStore;

  adaptationService:
    GovernedCanonicalMemoryAdaptationService;
}

export function registerOrganizationalMemoryAdaptationRoutes(
  app:
    Express,

  runtime:
    OrganizationalMemoryAdaptationRuntime,
): void {
  app.post(
    "/api/knowledge/organizational-memory-adaptation",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const body =
        req.body ?? {};

      const packageId =
        typeof body.packageId ===
          "string"
          ? body.packageId.trim()
          : "";

      const explicitOrganizationId =
        typeof body.organizationId ===
          "string"
          ? body.organizationId.trim()
          : "";

      const teamId =
        typeof body.teamId ===
          "string" &&
        body.teamId.trim()
          ? body.teamId.trim()
          : undefined;

      const organizationId =
        explicitOrganizationId ||
        teamId ||
        "";

      const projectId =
        typeof body.projectId ===
          "string" &&
        body.projectId.trim()
          ? body.projectId.trim()
          : undefined;

      if (
        !packageId
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "knowledge_package_id_required",
        });
      }

      if (
        !organizationId
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "organization_id_required",
        });
      }

      if (
        body.generalization
          ?.generalized !== true ||
        body.generalization
          ?.customerSpecificContentRetained !== false
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "organizational_memory_generalization_declaration_required",
        });
      }

      const knowledgePackage =
        runtime.packageService.get(
          packageId,
        );

      if (
        !knowledgePackage
      ) {
        return res.status(
          404,
        ).json({
          ok:
            false,

          error:
            "knowledge_package_not_found",
        });
      }

      if (
        knowledgePackage.state !==
        "canonical"
      ) {
        return res.status(
          409,
        ).json({
          ok:
            false,

          error:
            "knowledge_package_not_canonical",
        });
      }

      const canonicalization =
        knowledgePackage.metadata
          .canonicalization as
          | CanonicalizationMetadata
          | undefined;

      const canonicalItemIds =
        Array.isArray(
          canonicalization
            ?.canonicalItemIds,
        )
          ? canonicalization
              .canonicalItemIds
              .filter(
                (
                  id,
                ): id is string =>
                  typeof id ===
                    "string" &&
                  Boolean(
                    id.trim(),
                  ),
              )
          : [];

      if (
        canonicalItemIds.length ===
        0
      ) {
        return res.status(
          409,
        ).json({
          ok:
            false,

          error:
            "canonical_item_references_missing",
        });
      }

      const canonicalItems =
        canonicalItemIds.map(
          (canonicalItemId) =>
            runtime.canonicalStore.get(
              canonicalItemId,
            ),
        );

      if (
        canonicalItems.some(
          (item) =>
            !item,
        )
      ) {
        return res.status(
          409,
        ).json({
          ok:
            false,

          error:
            "canonical_item_not_available",
        });
      }

      try {
        const result =
          runtime.adaptationService
            .adaptAndPersist({
              organizationId,

              projectId,

              teamId,

              items:
                canonicalItems as NonNullable<
                  (typeof canonicalItems)[number]
                >[],

              generalization: {
                generalized:
                  true,

                customerSpecificContentRetained:
                  false,
              },
            });

        const adaptedPackage =
          runtime.packageService
            .markAdapted(
              knowledgePackage.id,
              result.records.map(
                (record) =>
                  record.id,
              ),
            );

        return res.json({
          ok:
            true,

          packageId:
            adaptedPackage.id,

          packageState:
            adaptedPackage.state,

          records:
            result.records,
        });
      } catch (
        error
      ) {
        const message =
          error instanceof Error
            ? error.message
            : String(
                error,
              );

        return res.status(
          409,
        ).json({
          ok:
            false,

          error:
            message,
        });
      }
    },
  );
}
