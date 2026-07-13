import type {
  Express,
  Request,
  Response,
} from "express";

import {
  knowledgeOperationsService,
} from "../../knowledge-operations/KnowledgeOperationsService.js";

export function registerKnowledgeOperationsRoutes(
  app: Express,
): void {
  app.get(
    "/api/knowledge/operations",
    (
      _req: Request,
      res: Response,
    ) => {
      res.json(
        knowledgeOperationsService.getSnapshot(),
      );
    },
  );
}
