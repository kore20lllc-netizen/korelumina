import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  KnowledgeManufacturingRunService,
} from "../../knowledge-preservation/manufacturing/index.js";

import type {
  KnowledgeManufacturingReplayService,
} from "../../knowledge-preservation/manufacturing/index.js";

export interface KnowledgeManufacturingReplayRuntime {
  manufacturingRunService:
    KnowledgeManufacturingRunService;

  replayService:
    KnowledgeManufacturingReplayService;
}

function readRunId(
  value:
    unknown,
): string {
  return typeof value ===
      "string"
    ? value.trim()
    : "";
}

export function registerKnowledgeManufacturingReplayRoutes(
  app:
    Express,

  runtime:
    KnowledgeManufacturingReplayRuntime,
): void {
  app.get(
    "/api/knowledge/manufacturing-replay",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      return res.json({
        ok:
          true,

        replay:
          runtime.replayService
            .get(),
      });
    },
  );

  app.post(
    "/api/knowledge/manufacturing-replay/start",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const runId =
        readRunId(
          req.body?.runId,
        );

      if (
        !runId
      ) {
        return res
          .status(
            400,
          )
          .json({
            ok:
              false,

            error:
              "knowledge_manufacturing_run_id_required",
          });
      }

      const run =
        runtime
          .manufacturingRunService
          .get(
            runId,
          );

      if (
        !run
      ) {
        return res
          .status(
            404,
          )
          .json({
            ok:
              false,

            error:
              "knowledge_manufacturing_run_not_found",
          });
      }

      const replay =
        runtime.replayService
          .start(
            run,
          );

      return res.json({
        ok:
          true,

        replay,
      });
    },
  );

  app.post(
    "/api/knowledge/manufacturing-replay/step",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const replay =
        runtime.replayService
          .get();

      if (
        !replay ||
        !replay.active
      ) {
        return res
          .status(
            409,
          )
          .json({
            ok:
              false,

            error:
              "knowledge_manufacturing_replay_not_active",
          });
      }

      const run =
        runtime
          .manufacturingRunService
          .get(
            replay.runId,
          );

      if (
        !run
      ) {
        runtime.replayService
          .reset();

        return res
          .status(
            404,
          )
          .json({
            ok:
              false,

            error:
              "knowledge_manufacturing_run_not_found",
          });
      }

      const updated =
        runtime.replayService
          .step(
            run,
          );

      return res.json({
        ok:
          true,

        replay:
          updated,
      });
    },
  );

  app.post(
    "/api/knowledge/manufacturing-replay/stop",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      return res.json({
        ok:
          true,

        replay:
          runtime.replayService
            .stop(),
      });
    },
  );
}
