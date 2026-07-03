import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  KnowledgeOperationsSnapshot,
} from "../../knowledge-operations/index.js";

export function registerKnowledgeOperationsRoutes(
  app: Express,
): void {
  app.get(
    "/api/knowledge/operations",
    (
      _req: Request,
      res: Response,
    ) => {
      const snapshot: KnowledgeOperationsSnapshot =
        {
          generatedAt:
            Date.now(),

          recovery: {
            status:
              "idle",

            processedEvidence:
              0,

            totalEvidence:
              0,

            progress:
              0,
          },

          evidence: {
            total: 0,

            byType: {},
          },

          knowledge: {
            candidateItems:
              0,

            canonicalItems:
              0,

            promotionRate:
              0,
          },

          coverage: {
            documentation:
              0,

            git:
              0,

            conversations:
              0,

            runtime:
              0,

            issues:
              0,

            pullRequests:
              0,
          },
        };

      res.json(
        snapshot,
      );
    },
  );
}
