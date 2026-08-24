import type {
  Express,
  Request,
  Response,
} from "express";

import {
  knowledgeOperationsService,
} from "../../knowledge-operations/KnowledgeOperationsService.js";

import type {
  KnowledgeOperationsService,
} from "../../knowledge-operations/KnowledgeOperationsService.js";


export interface KnowledgeOperationsRouteDependencies {
  service?:
    Pick<
      KnowledgeOperationsService,
      "getSnapshot"
    >;
}


export function registerKnowledgeOperationsRoutes(
  app: Express,

  dependencies:
    KnowledgeOperationsRouteDependencies = {},
): void {
  const service =
    dependencies.service ??
    knowledgeOperationsService;
  app.get(
    "/api/knowledge/operations",
    (
      _req: Request,
      res: Response,
    ) => {
      res.json(
        service.getSnapshot(),
      );
    },
  );
}
