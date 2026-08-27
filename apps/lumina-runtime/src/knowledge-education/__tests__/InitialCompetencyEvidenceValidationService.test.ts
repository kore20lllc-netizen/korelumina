import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createInitialCompetencyEvidenceRecord,
} from "../InitialCompetencyEvidenceContract.js";

import {
  FileInitialCompetencyEvidencePersistenceStore,
} from "../InitialCompetencyEvidencePersistence.js";

import {
  InitialCompetencyEvidenceValidationService,
} from "../InitialCompetencyEvidenceValidationService.js";


function withService(
  run:
    (
      service:
        InitialCompetencyEvidenceValidationService,
    ) => void,
): void {
  const root =
    mkdtempSync(
      path.join(
        os.tmpdir(),
        "korelumina-competency-evidence-",
      ),
    );

  try {
    run(
      new InitialCompetencyEvidenceValidationService(
        new FileInitialCompetencyEvidencePersistenceStore({
          storageRoot:
            root,
        }),
      ),
    );
  } finally {
    rmSync(
      root,
      {
        recursive:
          true,
        force:
          true,
      },
    );
  }
}


test(
  "pending competency evidence is persisted without changing competency state",
  () => {
    withService(
      service => {
        const evidence =
          createInitialCompetencyEvidenceRecord({
            evidenceId:
              "competency-evidence:runtime:1",

            competencyId:
              "runtime-truth-distinction",

            source:
              "runtime",

            sourceRef:
              "/api/runtime/status/project-1",

            claim:
              "Runtime state was directly observed.",

            observedAt:
              100,
          });

        service.submit(
          evidence,
        );

        const persisted =
          service.get(
            evidence.evidenceId,
          );

        assert.equal(
          persisted?.validationState,
          "PENDING",
        );

        assert.equal(
          persisted?.validatedBy,
          null,
        );

        assert.equal(
          "competencyStatus" in (
            persisted ?? {}
          ),
          false,
        );
      },
    );
  },
);


test(
  "evidence source must be permitted by the declared competency requirement",
  () => {
    withService(
      service => {
        const evidence =
          createInitialCompetencyEvidenceRecord({
            evidenceId:
              "competency-evidence:runtime:invalid-source",

            competencyId:
              "runtime-truth-distinction",

            source:
              "canonical-knowledge",

            sourceRef:
              "canonical:item:1",

            claim:
              "Incorrect source class.",

            observedAt:
              100,
          });

        assert.throws(
          () =>
            service.submit(
              evidence,
            ),
          /initial_competency_evidence_source_not_allowed/,
        );
      },
    );
  },
);


test(
  "independent validation preserves immutable evidence identity and records validation proof",
  () => {
    withService(
      service => {
        const evidence =
          createInitialCompetencyEvidenceRecord({
            evidenceId:
              "competency-evidence:retrieval:1",

            competencyId:
              "governed-retrieval",

            source:
              "canonical-knowledge",

            sourceRef:
              "canonical:platform-constitution",

            claim:
              "Authority and provenance were preserved.",

            observedAt:
              100,
          });

        service.submit(
          evidence,
        );

        const validated =
          service.validate({
            evidenceId:
              evidence.evidenceId,

            decision:
              "VALIDATED",

            validatedBy:
              "human-governance",

            validatedAt:
              200,
          });

        assert.equal(
          validated.validationState,
          "VALIDATED",
        );

        assert.equal(
          validated.validatedBy,
          "human-governance",
        );

        assert.equal(
          validated.validatedAt,
          200,
        );

        assert.equal(
          validated.competencyId,
          evidence.competencyId,
        );

        assert.equal(
          validated.source,
          evidence.source,
        );

        assert.equal(
          validated.sourceRef,
          evidence.sourceRef,
        );

        assert.equal(
          validated.claim,
          evidence.claim,
        );

        assert.equal(
          validated.observedAt,
          evidence.observedAt,
        );

        assert.equal(
          "competencyStatus" in validated,
          false,
        );
      },
    );
  },
);


test(
  "a persisted evidence decision is terminal",
  () => {
    withService(
      service => {
        const evidence =
          createInitialCompetencyEvidenceRecord({
            evidenceId:
              "competency-evidence:mission:1",

            competencyId:
              "mission-boundaries",

            source:
              "mission",

            sourceRef:
              "delegation:1",

            claim:
              "Approved mission delegation preserved boundaries.",

            observedAt:
              100,
          });

        service.submit(
          evidence,
        );

        service.validate({
          evidenceId:
            evidence.evidenceId,

          decision:
            "REJECTED",

          validatedBy:
            "human-governance",

          validatedAt:
            200,
        });

        assert.throws(
          () =>
            service.validate({
              evidenceId:
                evidence.evidenceId,

              decision:
                "VALIDATED",

              validatedBy:
                "human-governance",

              validatedAt:
                300,
            }),
          /initial_competency_evidence_already_decided/,
        );
      },
    );
  },
);
