import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  AgentContextRequest,
  KnowledgeContextBuilder,
} from "../../knowledge-platform/context/index.js";


export interface GovernedRetrievalObservationRuntime {
  knowledgeContextBuilder:
    KnowledgeContextBuilder;
}


const allowedRoles =
  new Set<
    AgentContextRequest["role"]
  >([
    "architect",
    "runtime",
    "builder",
    "recovery",
    "documentation",
    "reviewer",
  ]);


export function registerGovernedRetrievalObservationRoute(
  app:
    Express,

  runtime:
    GovernedRetrievalObservationRuntime,
): void {
  app.get(
    "/api/knowledge/context",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      try {
        const role =
          String(
            req.query.role ??
            "",
          ) as AgentContextRequest["role"];

        const objective =
          String(
            req.query.objective ??
            "",
          ).trim();

        const query =
          typeof req.query.query ===
            "string"
            ? req.query.query.trim()
            : undefined;

        const rawMax =
          req.query.maxKnowledgeItems;

        const maxKnowledgeItems =
          rawMax ===
            undefined
            ? undefined
            : Number(
                rawMax,
              );

        if (
          !allowedRoles.has(
            role,
          )
        ) {
          throw new Error(
            "knowledge_context_role_invalid",
          );
        }

        if (
          objective.length ===
            0
        ) {
          throw new Error(
            "knowledge_context_objective_required",
          );
        }

        if (
          maxKnowledgeItems !==
            undefined &&
          (
            !Number.isInteger(
              maxKnowledgeItems,
            ) ||
            maxKnowledgeItems <=
              0
          )
        ) {
          throw new Error(
            "knowledge_context_max_items_invalid",
          );
        }

        const context =
          runtime
            .knowledgeContextBuilder
            .build({
              role,
              objective,
              query:
                query &&
                query.length >
                  0
                  ? query
                  : undefined,

              maxKnowledgeItems,
            });

        return res.json({
          ok:
            true,

          context,
        });
      } catch (
        error
      ) {
        return res
          .status(
            400,
          )
          .json({
            ok:
              false,

            error:
              error instanceof Error
                ? error.message
                : "knowledge_context_read_failed",
          });
      }
    },
  );
}
