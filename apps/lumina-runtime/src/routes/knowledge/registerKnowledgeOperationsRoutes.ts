import type {
  Express,
  Request,
  Response,
} from "express";

import {
  knowledgeOperationsService,
} from "../../knowledge-operations/KnowledgeOperationsService.js";
import { listCapabilityProviders } from "../../knowledge/capability/index.js";

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


  app.get(
    "/api/knowledge/capabilities",
    (_req, res) => {
      res.json({
        ok: true,
        providers: listCapabilityProviders().map(provider => ({
          id: provider.id,
        })),
      });
    },
  );

}