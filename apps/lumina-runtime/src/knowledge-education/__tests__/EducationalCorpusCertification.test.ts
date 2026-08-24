import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyEducationalCorpus,
  validateEducationalCorpusCertification,
} from "../EducationalCorpusCertification.js";

import type {
  EducationalCorpusCertificationCandidate,
} from "../EducationalCorpusCertificationCandidate.js";


function candidate():
  EducationalCorpusCertificationCandidate {
  return {
    candidateId:
      "educational-corpus-certification-candidate:test",

    state:
      "READY",

    corpusId:
      "educational-corpus:test",

    sourceContractId:
      "educational-corpus-source-contract:test",

    dayZeroCertificationId:
      "genesis-day-zero-certification:test",

    coverage: {
      constitutionalLiteracy: {
        satisfiedRequirements: [
          "constitutional:vision-2050",
          "constitutional:platform-constitution",
          "constitutional:ca-005",
        ],

        missingRequirements:
          [],

        satisfiedCount:
          3,

        requirementCount:
          3,

        completion:
          100,

        measurementVersion:
          "education-coverage-v1",
      },
    },

    summary: {
      sourceArtifacts:
        12,

      curriculumItems:
        10,

      unresolvedItems:
        0,

      excludedItems:
        2,

      blockedItems:
        0,

      exceptions:
        0,
    },

    excludedMaterial: [
      {
        artifactId:
          "artifact-excluded-1",

        decision:
          "EXCLUDED",

        reasons: [
          "educational-source-not-approved",
        ],
      },

      {
        artifactId:
          "artifact-excluded-2",

        decision:
          "EXCLUDED",

        reasons: [
          "outside-approved-curriculum",
        ],
      },
    ],

    exceptions:
      [],

    approval: {
      singleHumanApprovalRequired:
        true,

      perArtifactApprovalRequired:
        false,

      available:
        true,

      reason:
        "Ready for one corpus-level approval.",
    },

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}


function decision() {
  return {
    certifiedBy:
      "korelumina-human-governance",

    certifiedAt:
      1000,

    reason:
      "Educational Corpus reviewed and accepted.",

    acknowledgedExcludedArtifactIds: [
      "artifact-excluded-1",
      "artifact-excluded-2",
    ],
  };
}


test(
  "READY Educational Corpus candidate can be explicitly certified",
  () => {
    const certification =
      certifyEducationalCorpus({
        candidate:
          candidate(),

        decision:
          decision(),
      });

    assert.equal(
      certification.state,
      "CERTIFIED",
    );

    assert.equal(
      certification.corpusId,
      "educational-corpus:test",
    );

    assert.equal(
      certification
        .constitutionalCoverage
        .completion,
      100,
    );

    assert.equal(
      certification
        .downstream
        .initialCompetencyCertified,
      false,
    );

    assert.equal(
      certification
        .downstream
        .chiefAgentActivationAuthorized,
      false,
    );
  },
);


test(
  "certification identity is deterministic",
  () => {
    const first =
      certifyEducationalCorpus({
        candidate:
          candidate(),

        decision:
          decision(),
      });

    const second =
      certifyEducationalCorpus({
        candidate:
          candidate(),

        decision:
          decision(),
      });

    assert.equal(
      first.certificationId,
      second.certificationId,
    );
  },
);


test(
  "non-READY candidate cannot be certified",
  () => {
    const input =
      candidate();

    const incomplete:
      EducationalCorpusCertificationCandidate = {
      ...input,

      state:
        "INCOMPLETE",

      approval: {
        ...input.approval,

        available:
          false,
      },

      exceptions: [
        {
          code:
            "required-constitutional-curriculum-missing",

          category:
            "curriculum-coverage",

          subjectId:
            "constitutional:vision-2050",
        },
      ],
    };

    assert.throws(
      () =>
        certifyEducationalCorpus({
          candidate:
            incomplete,

          decision:
            decision(),
        }),
      /candidate_not_ready/,
    );
  },
);


test(
  "excluded material must be acknowledged exactly",
  () => {
    assert.throws(
      () =>
        certifyEducationalCorpus({
          candidate:
            candidate(),

          decision: {
            ...decision(),

            acknowledgedExcludedArtifactIds: [
              "artifact-excluded-1",
            ],
          },
        }),
      /excluded_acknowledgement_mismatch/,
    );
  },
);


test(
  "duplicate excluded acknowledgement is rejected",
  () => {
    assert.throws(
      () =>
        certifyEducationalCorpus({
          candidate:
            candidate(),

          decision: {
            ...decision(),

            acknowledgedExcludedArtifactIds: [
              "artifact-excluded-1",
              "artifact-excluded-1",
              "artifact-excluded-2",
            ],
          },
        }),
      /duplicate_excluded_acknowledgement/,
    );
  },
);


test(
  "unchanged candidate validates certification as VALID",
  () => {
    const current =
      candidate();

    const certification =
      certifyEducationalCorpus({
        candidate:
          current,

        decision:
          decision(),
      });

    const validation =
      validateEducationalCorpusCertification({
        certification,

        currentCandidate:
          current,
      });

    assert.equal(
      validation.state,
      "VALID",
    );

    assert.deepEqual(
      validation.blockers,
      [],
    );
  },
);


test(
  "corpus identity change makes certification stale",
  () => {
    const original =
      candidate();

    const certification =
      certifyEducationalCorpus({
        candidate:
          original,

        decision:
          decision(),
      });

    const changed:
      EducationalCorpusCertificationCandidate = {
      ...original,

      candidateId:
        "educational-corpus-certification-candidate:changed",

      corpusId:
        "educational-corpus:changed",
    };

    const validation =
      validateEducationalCorpusCertification({
        certification,

        currentCandidate:
          changed,
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "educational-corpus-changed",
      ),
    );
  },
);


test(
  "Day-0 certification change makes Educational Corpus certification stale",
  () => {
    const original =
      candidate();

    const certification =
      certifyEducationalCorpus({
        candidate:
          original,

        decision:
          decision(),
      });

    const changed:
      EducationalCorpusCertificationCandidate = {
      ...original,

      candidateId:
        "educational-corpus-certification-candidate:day-zero-changed",

      dayZeroCertificationId:
        "genesis-day-zero-certification:changed",
    };

    const validation =
      validateEducationalCorpusCertification({
        certification,

        currentCandidate:
          changed,
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "day-zero-certification-changed",
      ),
    );
  },
);


test(
  "candidate becoming non-ready blocks existing certification",
  () => {
    const original =
      candidate();

    const certification =
      certifyEducationalCorpus({
        candidate:
          original,

        decision:
          decision(),
      });

    const blocked:
      EducationalCorpusCertificationCandidate = {
      ...original,

      candidateId:
        "educational-corpus-certification-candidate:blocked",

      state:
        "BLOCKED",

      approval: {
        ...original.approval,

        available:
          false,
      },
    };

    const validation =
      validateEducationalCorpusCertification({
        certification,

        currentCandidate:
          blocked,
      });

    assert.equal(
      validation.state,
      "BLOCKED",
    );
  },
);
