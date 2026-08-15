import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  KnowledgeEducationProjectionService,
} from "../../knowledge-education/index.js";

export interface KnowledgeEducationRuntime {
  projectionService:
    KnowledgeEducationProjectionService;
}

export function registerKnowledgeEducationRoutes(
  app:
    Express,

  runtime:
    KnowledgeEducationRuntime,
): void {
  app.get(
    "/api/knowledge/education",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      return res.json(
        runtime
          .projectionService
          .snapshot(),
      );
    },
  );
}
