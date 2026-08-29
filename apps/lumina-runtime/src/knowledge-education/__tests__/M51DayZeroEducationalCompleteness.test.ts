import assert from "node:assert/strict";
import test from "node:test";

import {
  certifiedEducationalCoverageRequirements,
} from "../measurement/index.js";

import {
  buildEducationalCorpusCertificationCandidate,
} from "../EducationalCorpusCertificationCandidate.js";

import {
  certifyEducationalCorpus,
  validateEducationalCorpusCertification,
} from "../EducationalCorpusCertification.js";

import {
  buildInitialCompetencyAssessmentCandidate,
} from "../InitialCompetencyAssessmentCandidate.js";

import {
  InitialCompetencyHumanAcceptanceService,
} from "../InitialCompetencyHumanAcceptanceService.js";

import {
  ChiefAgentProductionWorkspaceAuthorizationService,
} from "../ChiefAgentProductionWorkspaceAuthorizationService.js";


function artifact(
  moduleId: string,
  requirement: any,
  index: number,
): any {
  return {
    id:
      requirement.match.artifactIds?.[0] ??
      `artifact:${moduleId}:${index}`,

    title:
      requirement.match.titleIncludes?.[0] ??
      requirement.description,

    kind:
      requirement.match.kinds?.[0] ??
      "governance",

    category:
      requirement.match.categories?.[0] ??
      "governance",

    sourceRefs:
      requirement.match.sourceRefs ??
      [],
  };
}


function artifactsWithout(
  excluded:
    readonly string[] = [],
): any[] {
  const blocked =
    new Set(
      excluded,
    );

  return certifiedEducationalCoverageRequirements
    .filter(
      definition =>
        !blocked.has(
          definition.moduleId,
        ),
    )
    .flatMap(
      definition =>
        definition.requirements.map(
          (
            requirement,
            index,
          ) =>
            artifact(
              definition.moduleId,
              requirement,
              index,
            ),
        ),
    );
}


function candidate(
  excluded:
    readonly string[] = [],
): any {
  const artifacts =
    artifactsWithout(
      excluded,
    );

  return buildEducationalCorpusCertificationCandidate({
    runtime: {
      state:
        "CURRENT",

      persistedCorpus: {
        corpusId:
          "educational-corpus:test",

        sourceContractId:
          "educational-corpus-source-contract:test",

        dayZeroCertificationId:
          "genesis-day-zero-certification:test",

        items:
          artifacts.map(
            item => ({
              artifactId:
                item.id,
            }),
          ),

        excluded:
          [],

        summary: {
          sourceArtifacts:
            artifacts.length,

          curriculumItems:
            artifacts.length,

          unresolvedItems:
            0,

          excludedItems:
            0,

          blockedItems:
            0,
        },
      },

      currentCorpus: {
        corpusId:
          "educational-corpus:test",
      },

      unresolvedArtifactIds:
        [],
    } as any,

    artifacts,
  });
}


test(
  "constitutional-only corpus is not READY",
  () => {
    const result =
      candidate([
        "knowledge-governance",
        "operational-boundaries",
        "conversation-curriculum",
        "business-domain-literacy",
      ]);

    assert.equal(
      result.state,
      "INCOMPLETE",
    );
  },
);


for (
  const moduleId
  of [
    "knowledge-governance",
    "operational-boundaries",
    "conversation-curriculum",
    "business-domain-literacy",
  ] as const
) {
  test(
    `missing ${moduleId} yields INCOMPLETE`,
    () => {
      const result =
        candidate([
          moduleId,
        ]);

      assert.equal(
        result.state,
        "INCOMPLETE",
      );

      assert.ok(
        result.coverage
          .dayZero
          .modules[
            moduleId
          ]
          .missingRequirements
          .length >
          0,
      );
    },
  );
}


test(
  "full required module coverage produces READY",
  () => {
    const result =
      candidate();

    assert.equal(
      result.state,
      "READY",
    );

    assert.equal(
      result.coverage
        .dayZero
        .completion,
      100,
    );

    assert.deepEqual(
      result.coverage
        .dayZero
        .completeModules,
      result.coverage
        .dayZero
        .requiredModules,
    );
  },
);


test(
  "candidate identity changes when module coverage changes",
  () => {
    assert.notEqual(
      candidate()
        .candidateId,
      candidate([
        "conversation-curriculum",
      ])
        .candidateId,
    );
  },
);


test(
  "certification persists full Day-0 coverage",
  () => {
    const current =
      candidate();

    const certification =
      certifyEducationalCorpus({
        candidate:
          current,

        decision: {
          certifiedBy:
            "test",

          certifiedAt:
            1,

          reason:
            "M51.5k17",

          acknowledgedExcludedArtifactIds:
            [],
        },
      });

    assert.equal(
      certification
        .dayZeroCoverage
        ?.completion,
      100,
    );

    assert.deepEqual(
      certification
        .dayZeroCoverage
        ?.requiredModules,
      current.coverage
        .dayZero
        .requiredModules,
    );
  },
);


test(
  "certification validation detects module drift",
  () => {
    const original =
      candidate();

    const certification =
      certifyEducationalCorpus({
        candidate:
          original,

        decision: {
          certifiedBy:
            "test",

          certifiedAt:
            2,

          reason:
            "M51.5k17 drift",

          acknowledgedExcludedArtifactIds:
            [],
        },
      });

    const validation =
      validateEducationalCorpusCertification({
        certification,

        currentCandidate:
          candidate([
            "operational-boundaries",
          ]),
      });

    assert.equal(
      validation.state,
      "BLOCKED",
    );

    assert.ok(
      validation.blockers.includes(
        "educational-corpus-day-zero-coverage-changed",
      ),
    );
  },
);


test(
  "legacy constitutional-only certification cannot remain current",
  () => {
    const current =
      candidate();

    const modern =
      certifyEducationalCorpus({
        candidate:
          current,

        decision: {
          certifiedBy:
            "test",

          certifiedAt:
            3,

          reason:
            "legacy test",

          acknowledgedExcludedArtifactIds:
            [],
        },
      });

    const {
      dayZeroCoverage:
        _ignored,
      ...legacy
    } =
      modern;

    const validation =
      validateEducationalCorpusCertification({
        certification:
          legacy,

        currentCandidate:
          current,
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "educational-corpus-day-zero-coverage-not-certified",
      ),
    );
  },
);


test(
  "Initial Competency rejects stale corpus certification",
  () => {
    const result =
      buildInitialCompetencyAssessmentCandidate({
        corpusCertification: {
          state:
            "STALE",

          certification:
            null,
        } as any,

        education: {
          competencies:
            [],
        } as any,
      });

    assert.equal(
      result.state,
      "BLOCKED",
    );

    assert.ok(
      result.blockers.includes(
        "valid-educational-corpus-certification-required",
      ),
    );
  },
);


test(
  "human acceptance cannot bypass stale competency certification",
  () => {
    const service =
      new InitialCompetencyHumanAcceptanceService(
        {
          load:
            () =>
              ({
                acceptanceId:
                  "initial-competency-human-acceptance:test",
              } as any),

          save:
            () => {
              throw new Error(
                "unexpected write",
              );
            },
        },

        {
          read:
            () =>
              ({
                state:
                  "STALE",

                downstream: {
                  initialCompetencyCertified:
                    false,

                  chiefAgentActivationAuthorized:
                    false,
                },
              } as any),
        },
      );

    const result =
      service.read();

    assert.equal(
      result.state,
      "BLOCKED",
    );

    assert.equal(
      result.downstream
        .humanAcceptanceRecorded,
      false,
    );
  },
);


test(
  "workspace authorization cannot survive stale acceptance",
  () => {
    const service =
      new ChiefAgentProductionWorkspaceAuthorizationService(
        {
          load:
            () =>
              ({
                authorizationId:
                  "chief-agent-production-workspace-authorization:test",
              } as any),

          save:
            () => {
              throw new Error(
                "unexpected write",
              );
            },
        },

        {
          read:
            () =>
              ({
                state:
                  "BLOCKED",

                downstream: {
                  initialCompetencyCertified:
                    false,

                  humanAcceptanceRecorded:
                    false,

                  chiefAgentProductionWorkspaceAuthorized:
                    false,

                  chiefAgentActivationAuthorized:
                    false,
                },
              } as any),
        },
      );

    const result =
      service.read();

    assert.equal(
      result.state,
      "BLOCKED",
    );

    assert.equal(
      result.downstream
        .chiefAgentProductionWorkspaceAuthorized,
      false,
    );

    assert.equal(
      result.downstream
        .chiefAgentProductionWorkspaceCreated,
      false,
    );

    assert.equal(
      result.downstream
        .chiefAgentActivationAuthorized,
      false,
    );

    assert.equal(
      result.downstream
        .chiefAgentActivated,
      false,
    );
  },
);
