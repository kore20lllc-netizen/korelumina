import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  EducationalCorpusCertificationService,
  EducationalCorpusRuntimeService,
  KnowledgeEducationProjectionService,
} from "../../knowledge-education/index.js";

import {
  requireRuntimeAccess,
} from "../runtimeAccess.js";


export interface KnowledgeEducationRuntime {
  projectionService:
    KnowledgeEducationProjectionService;

  educationalCorpusService:
    EducationalCorpusRuntimeService;

  educationalCorpusCertificationService:
    EducationalCorpusCertificationService;
}


function bodyRecord(
  value:
    unknown,
): Record<
  string,
  unknown
> {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "educational_corpus_certification_request_body_invalid",
    );
  }

  return value as Record<
    string,
    unknown
  >;
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


  app.get(
    "/api/knowledge/education/corpus",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      try {
        return res.json({
          ok:
            true,

          projection:
            runtime
              .educationalCorpusService
              .read(),
        });
      } catch (
        error
      ) {
        return res
          .status(
            409,
          )
          .json({
            ok:
              false,

            error:
              error instanceof Error
                ? error.message
                : "educational_corpus_read_failed",
          });
      }
    },
  );


  app.put(
    "/api/knowledge/education/corpus",
    requireRuntimeAccess,
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      try {
        return res.json({
          ok:
            true,

          projection:
            runtime
              .educationalCorpusService
              .persistCurrent(),
        });
      } catch (
        error
      ) {
        return res
          .status(
            409,
          )
          .json({
            ok:
              false,

            error:
              error instanceof Error
                ? error.message
                : "educational_corpus_persist_failed",
          });
      }
    },
  );


  app.get(
    "/api/knowledge/education/corpus-certification",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      try {
        return res.json({
          ok:
            true,

          projection:
            runtime
              .educationalCorpusCertificationService
              .read(),
        });
      } catch (
        error
      ) {
        return res
          .status(
            409,
          )
          .json({
            ok:
              false,

            error:
              error instanceof Error
                ? error.message
                : "educational_corpus_certification_read_failed",
          });
      }
    },
  );


  app.put(
    "/api/knowledge/education/corpus-certification",
    requireRuntimeAccess,
    (
      req:
        Request,

      res:
        Response,
    ) => {
      try {
        const body =
          bodyRecord(
            req.body,
          );

        if (
          !Array.isArray(
            body.acknowledgedExcludedArtifactIds,
          ) ||
          !body
            .acknowledgedExcludedArtifactIds
            .every(
              value =>
                typeof value ===
                "string",
            )
        ) {
          throw new Error(
            "educational_corpus_certification_acknowledged_exclusions_invalid",
          );
        }

        const projection =
          runtime
            .educationalCorpusCertificationService
            .certify({
              certifiedBy:
                String(
                  body.certifiedBy ??
                  "",
                ),

              certifiedAt:
                Number(
                  body.certifiedAt,
                ),

              reason:
                String(
                  body.reason ??
                  "",
                ),

              acknowledgedExcludedArtifactIds:
                body
                  .acknowledgedExcludedArtifactIds as
                  string[],
            });

        return res.json({
          ok:
            true,

          projection,
        });
      } catch (
        error
      ) {
        return res
          .status(
            409,
          )
          .json({
            ok:
              false,

            error:
              error instanceof Error
                ? error.message
                : "educational_corpus_certification_write_failed",
          });
      }
    },
  );
}
