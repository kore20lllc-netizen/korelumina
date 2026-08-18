import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  GovernedCanonicalPromotionService,
} from "../../knowledge-preservation/promotion/index.js";

export interface CanonicalPromotionRuntime {
  promotionService:
    GovernedCanonicalPromotionService;
}

export function registerCanonicalPromotionRoutes(
  app:
    Express,

  runtime:
    CanonicalPromotionRuntime,
): void {
  app.post(
    "/api/knowledge/canonical-promotion",
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

      try {
        const result =
          runtime.promotionService
            .promoteApprovedPackage(
              packageId,
            );

        return res.json({
          ok:
            true,

          knowledgePackage:
            result.knowledgePackage,

          canonicalItems:
            result.canonicalItems,
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

        if (
          message ===
          "knowledge_package_not_found"
        ) {
          return res.status(
            404,
          ).json({
            ok:
              false,

            error:
              message,
          });
        }

        if (
          message ===
            "knowledge_package_not_approved" ||
          message ===
            "governed_approval_proof_missing" ||
          message ===
            "governed_approval_history_missing"
        ) {
          return res.status(
            409,
          ).json({
            ok:
              false,

            error:
              message,
          });
        }

        return res.status(
          400,
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
