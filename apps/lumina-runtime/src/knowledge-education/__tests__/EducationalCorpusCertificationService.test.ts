import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import path from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  FileEducationalCorpusCertificationPersistenceStore,
} from "../EducationalCorpusCertificationPersistence.js";

import {
  EducationalCorpusCertificationService,
} from "../EducationalCorpusCertificationService.js";

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
        ],

        missingRequirements:
          [],

        satisfiedCount:
          1,

        requirementCount:
          1,

        completion:
          100,

        measurementVersion:
          "education-coverage-v1",
      },

      dayZero: {
        requiredModules: [
          "constitutional-literacy",
          "knowledge-governance",
          "operational-boundaries",
          "conversation-curriculum",
          "business-domain-literacy",
        ],

        completeModules: [
          "constitutional-literacy",
          "knowledge-governance",
          "operational-boundaries",
          "conversation-curriculum",
          "business-domain-literacy",
        ],

        modules: {
          "constitutional-literacy": {
            satisfiedRequirements: [
              "test:constitutional-literacy",
            ],
            missingRequirements: [],
            satisfiedCount: 1,
            requirementCount: 1,
            completion: 100,
            measurementVersion: "education-coverage-v1",
          },

          "knowledge-governance": {
            satisfiedRequirements: [
              "test:knowledge-governance",
            ],
            missingRequirements: [],
            satisfiedCount: 1,
            requirementCount: 1,
            completion: 100,
            measurementVersion: "education-coverage-v1",
          },

          "operational-boundaries": {
            satisfiedRequirements: [
              "test:operational-boundaries",
            ],
            missingRequirements: [],
            satisfiedCount: 1,
            requirementCount: 1,
            completion: 100,
            measurementVersion: "education-coverage-v1",
          },

          "conversation-curriculum": {
            satisfiedRequirements: [
              "test:conversation-curriculum",
            ],
            missingRequirements: [],
            satisfiedCount: 1,
            requirementCount: 1,
            completion: 100,
            measurementVersion: "education-coverage-v1",
          },

          "business-domain-literacy": {
            satisfiedRequirements: [
              "test:business-domain-literacy",
            ],
            missingRequirements: [],
            satisfiedCount: 1,
            requirementCount: 1,
            completion: 100,
            measurementVersion: "education-coverage-v1",
          },
        },

        satisfiedRequirements: [
          "test:business-domain-literacy",
          "test:constitutional-literacy",
          "test:conversation-curriculum",
          "test:knowledge-governance",
          "test:operational-boundaries",
        ],

        missingRequirements: [],

        satisfiedCount: 5,

        requirementCount: 5,

        completion: 100,

        measurementVersion:
          "education-coverage-v1",
      },

    },

    summary: {
      sourceArtifacts:
        1,

      curriculumItems:
        1,

      unresolvedItems:
        0,

      excludedItems:
        0,

      blockedItems:
        0,

      exceptions:
        0,
    },

    excludedMaterial:
      [],

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
        "ready",
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

    acknowledgedExcludedArtifactIds:
      [],
  };
}


test(
  "runtime state is UNSET before certification exists",
  () => {
    const service =
      new EducationalCorpusCertificationService(
        {
          load:
            () =>
              null,

          save:
            () => {},
        },

        {
          readCurrentCandidate:
            () =>
              candidate(),
        },
      );

    const result =
      service.read();

    assert.equal(
      result.state,
      "UNSET",
    );

    assert.equal(
      result.certification,
      null,
    );

    assert.equal(
      result.downstream
        .initialCompetencyCertified,
      false,
    );
  },
);


test(
  "service certifies current candidate and returns VALID",
  () => {
    let persisted =
      null as ReturnType<
        EducationalCorpusCertificationService[
          "read"
        ]
      >["certification"];

    const service =
      new EducationalCorpusCertificationService(
        {
          load:
            () =>
              persisted,

          save:
            certification => {
              persisted =
                certification;
            },
        },

        {
          readCurrentCandidate:
            () =>
              candidate(),
        },
      );

    const result =
      service.certify(
        decision(),
      );

    assert.equal(
      result.state,
      "VALID",
    );

    assert.ok(
      result.certification,
    );

    assert.equal(
      result.downstream
        .chiefAgentActivationAuthorized,
      false,
    );
  },
);


test(
  "persisted certification becomes STALE when current candidate changes",
  () => {
    let current =
      candidate();

    let persisted =
      null as ReturnType<
        EducationalCorpusCertificationService[
          "read"
        ]
      >["certification"];

    const service =
      new EducationalCorpusCertificationService(
        {
          load:
            () =>
              persisted,

          save:
            certification => {
              persisted =
                certification;
            },
        },

        {
          readCurrentCandidate:
            () =>
              current,
        },
      );

    service.certify(
      decision(),
    );

    current = {
      ...current,

      candidateId:
        "educational-corpus-certification-candidate:changed",

      corpusId:
        "educational-corpus:changed",
    };

    const result =
      service.read();

    assert.equal(
      result.state,
      "STALE",
    );

    assert.ok(
      result.validation
        ?.blockers.includes(
          "educational-corpus-changed",
        ),
    );
  },
);


test(
  "candidate becoming BLOCKED makes persisted certification BLOCKED",
  () => {
    let current =
      candidate();

    let persisted =
      null as ReturnType<
        EducationalCorpusCertificationService[
          "read"
        ]
      >["certification"];

    const service =
      new EducationalCorpusCertificationService(
        {
          load:
            () =>
              persisted,

          save:
            certification => {
              persisted =
                certification;
            },
        },

        {
          readCurrentCandidate:
            () =>
              current,
        },
      );

    service.certify(
      decision(),
    );

    current = {
      ...current,

      candidateId:
        "educational-corpus-certification-candidate:blocked",

      state:
        "BLOCKED",

      approval: {
        ...current.approval,

        available:
          false,
      },
    };

    const result =
      service.read();

    assert.equal(
      result.state,
      "BLOCKED",
    );
  },
);


test(
  "missing current candidate fails closed",
  () => {
    const service =
      new EducationalCorpusCertificationService(
        {
          load:
            () =>
              null,

          save:
            () => {},
        },

        {
          readCurrentCandidate:
            () =>
              null,
        },
      );

    const result =
      service.read();

    assert.equal(
      result.state,
      "BLOCKED",
    );

    assert.equal(
      result.candidate,
      null,
    );
  },
);


test(
  "file persistence round-trips certification",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-educational-certification-",
        ),
      );

    try {
      const store =
        new FileEducationalCorpusCertificationPersistenceStore({
          storageRoot:
            root,
        });

      const service =
        new EducationalCorpusCertificationService(
          store,

          {
            readCurrentCandidate:
              () =>
                candidate(),
          },
        );

      const result =
        service.certify(
          decision(),
        );

      assert.equal(
        result.state,
        "VALID",
      );

      assert.deepEqual(
        store.load(),
        result.certification,
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
  },
);
