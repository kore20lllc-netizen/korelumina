import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  LegacyHistoricalReconciliationOrchestratorPackageResult,
} from "../../knowledge-preservation/governance/index.js";


export interface LegacyHistoricalReconciliationRoutePort {
  executeOne(
    input: {
      packageId:
        string;

      actorId:
        string;

      executedAt?:
        number;
    },
  ):
    LegacyHistoricalReconciliationOrchestratorPackageResult;
}

export interface LegacyHistoricalReconciliationRouteRuntime {
  orchestrator:
    LegacyHistoricalReconciliationRoutePort;
}


function stringValue(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


export function registerLegacyHistoricalReconciliationRoutes(
  app:
    Express,

  runtime:
    LegacyHistoricalReconciliationRouteRuntime,
): void {
  app.post(
    "/api/knowledge/governance/legacy-historical-reconciliation",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const body =
        req.body ??
        {};

      const packageId =
        stringValue(
          body.packageId,
        );

      const actorId =
        stringValue(
          body.actorId,
        );

      if (
        !packageId
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "legacy_historical_reconciliation_package_id_required",
        });
      }

      if (
        !actorId
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "legacy_historical_reconciliation_actor_id_required",
        });
      }

      /*
       * This route intentionally exposes only one explicit package.
       *
       * It accepts no caller-supplied Genesis proof, governance
       * identity, policy identity, canonical identity, or batch.
       * Proof resolution and mutation authority remain inside the
       * certified Runtime governance services.
       */
      const result =
        runtime
          .orchestrator
          .executeOne({
            packageId,
            actorId,

            executedAt:
              typeof body.executedAt ===
                "number"
                ? body.executedAt
                : undefined,
          });

      if (
        result.disposition ===
          "exception"
      ) {
        return res.status(
          409,
        ).json({
          ok:
            false,

          ...result,
        });
      }

      return res.json({
        ok:
          true,

        ...result,
      });
    },
  );
}
