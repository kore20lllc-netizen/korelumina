import type {
  Express,
  Request,
  Response,
} from "express";

import {
  createInitialCompetencyEvidenceRecord,
} from "../../knowledge-education/index.js";

import type {
  EducationalCorpusCertificationService,
  EducationalCorpusRuntimeService,
  InitialCompetencyAssessmentService,
  InitialCompetencyCertificationService,
  InitialCompetencyEvidenceValidationService,
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

  initialCompetencyAssessmentService:
    InitialCompetencyAssessmentService;

  initialCompetencyEvidenceService:
    InitialCompetencyEvidenceValidationService;

  initialCompetencyCertificationService:
    InitialCompetencyCertificationService;
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
    "/api/knowledge/education/initial-competency",
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

          assessment:
            runtime
              .initialCompetencyAssessmentService
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
                : "initial_competency_assessment_read_failed",
          });
      }
    },
  );


  app.get(
    "/api/knowledge/education/initial-competency/evidence",
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

          evidence:
            runtime
              .initialCompetencyEvidenceService
              .list(),
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
                : "initial_competency_evidence_read_failed",
          });
      }
    },
  );


  app.post(
    "/api/knowledge/education/initial-competency/evidence",
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

        const evidence =
          createInitialCompetencyEvidenceRecord({
            evidenceId:
              String(
                body.evidenceId ??
                "",
              ),

            competencyId:
              String(
                body.competencyId ??
                "",
              ),

            source:
              String(
                body.source ??
                "",
              ) as Parameters<
                typeof createInitialCompetencyEvidenceRecord
              >[0]["source"],

            sourceRef:
              String(
                body.sourceRef ??
                "",
              ),

            claim:
              String(
                body.claim ??
                "",
              ),

            observedAt:
              Number(
                body.observedAt,
              ),
          });

        return res.json({
          ok:
            true,

          evidence:
            runtime
              .initialCompetencyEvidenceService
              .submit(
                evidence,
              ),
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
                : "initial_competency_evidence_submit_failed",
          });
      }
    },
  );


  app.post(
    "/api/knowledge/education/initial-competency/evidence/:evidenceId/decision",
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

        const rawDecision =
          String(
            body.decision ??
            "",
          );

        if (
          rawDecision !==
            "VALIDATED" &&
          rawDecision !==
            "REJECTED"
        ) {
          throw new Error(
            "initial_competency_evidence_validation_decision_invalid",
          );
        }

        return res.json({
          ok:
            true,

          evidence:
            runtime
              .initialCompetencyEvidenceService
              .validate({
                evidenceId:
                  Array.isArray(
                    req.params.evidenceId,
                  )
                    ? req.params.evidenceId[0] ?? ""
                    : req.params.evidenceId,

                decision:
                  rawDecision,

                validatedBy:
                  String(
                    body.validatedBy ??
                    "",
                  ),

                validatedAt:
                  Number(
                    body.validatedAt,
                  ),
              }),
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
                : "initial_competency_evidence_validation_failed",
          });
      }
    },
  );


  app.get(
    "/api/knowledge/education/initial-competency/certification",
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
              .initialCompetencyCertificationService
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
                : "initial_competency_certification_read_failed",
          });
      }
    },
  );


  app.put(
    "/api/knowledge/education/initial-competency/certification",
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

        return res.json({
          ok:
            true,

          projection:
            runtime
              .initialCompetencyCertificationService
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
              }),
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
                : "initial_competency_certification_failed",
          });
      }
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
