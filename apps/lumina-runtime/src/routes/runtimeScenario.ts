import type {
  Express,
  Request,
  Response,
} from "express";

import {
  getRuntime,
} from "../runtime/registry.js";

import {
  getRuntimeScenario,
  setRuntimeScenario,
  type RuntimeScenario,
} from "../runtime/scenario/RuntimeScenarioService.js";

const VALID_SCENARIOS =
  new Set<RuntimeScenario>([
    "normal",
    "idle",
    "spike",
    "outage",
    "recover",
  ]);

interface RuntimeScenarioBody {
  projectId?: unknown;
  scenario?: unknown;
}

export function registerRuntimeScenarioRoute(
  app: Express,
): void {
  app.post(
    "/api/runtime/scenario",
    (
      req: Request<
        Record<string, never>,
        unknown,
        RuntimeScenarioBody
      >,
      res: Response,
    ) => {
      const projectId =
        req.body?.projectId;

      const scenario =
        req.body?.scenario;

      if (
        typeof projectId !== "string" ||
        projectId.trim().length === 0
      ) {
        res.status(400).json({
          ok: false,
          error: "missing_project_id",
        });

        return;
      }

      if (
        typeof scenario !== "string" ||
        !VALID_SCENARIOS.has(
          scenario as RuntimeScenario,
        )
      ) {
        res.status(400).json({
          ok: false,
          error: "invalid_scenario",
        });

        return;
      }

      const runtime =
        getRuntime(projectId);

      if (!runtime) {
        res.status(404).json({
          ok: false,
          error: "runtime_not_found",
        });

        return;
      }

      const previousScenario =
        getRuntimeScenario(projectId);

      const state =
        setRuntimeScenario(
          projectId,
          scenario as RuntimeScenario,
        );

      res.json({
        ok: true,
        projectId,
        previousScenario,
        scenario: state.scenario,
        updatedAt: state.updatedAt,
      });
    },
  );
}
