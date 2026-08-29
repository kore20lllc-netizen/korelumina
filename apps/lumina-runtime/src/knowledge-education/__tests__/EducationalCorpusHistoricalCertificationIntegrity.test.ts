import assert from "node:assert/strict";
import test from "node:test";

import {
  assembleEducationalCorpus,
} from "../EducationalCorpus.js";

import {
  assembleEducationalCorpusHistoricalEvidence,
} from "../EducationalCorpusHistoricalEvidence.js";

import {
  assessGenesisHistoricalEducationSources,
} from "../GenesisHistoricalEducationSourceAssessment.js";

import {
  certifyEducationalCorpus,
  validateEducationalCorpusCertification,
} from "../EducationalCorpusCertification.js";

import type {
  EducationalArtifactProjection,
} from "../projection/index.js";

import type {
  EducationalCorpusSourceContract,
} from "../EducationalCorpusSourceContract.js";

import type {
  GenesisHistoricalEducationRecord,
} from "../GenesisHistoricalEducationProjection.js";

import type {
  EducationalCorpusCertificationCandidate,
} from "../EducationalCorpusCertificationCandidate.js";


function canonicalArtifact():
  EducationalArtifactProjection {
  return {
    id:
      "constitution",

    title:
      "Vision 2050",

    kind:
      "constitution",

    category:
      "constitutional",

    authorityClass:
      "constitutional",

    approvalState:
      "approved",

    owner:
      "governance",

    scope:
      "platform",

    version:
      "1",

    provenance:
      "docs/canon/VISION_2050.md",

    source:
      "canonical-knowledge",

    sourceRefs: [
      "docs/canon/VISION_2050.md",
    ],

    lineage:
      [],

    dependencies:
      [],

    supersession:
      "",

    educationalStatus:
      "completed",

    educationalImpact:
      "Defines the governing north star.",

    relatedArtifacts:
      [],

    relatedKnowledgePackages:
      [],

    relatedCanonicalKnowledge: [
      "docs/canon/VISION_2050.md",
    ],

    relatedMemory:
      [],

    relatedMissions:
      [],

    relatedDecisions:
      [],

    authors:
      [],
  };
}


function historicalRecord(
  input: {
    recordId:
      GenesisHistoricalEducationRecord["recordId"];

    episodeId:
      string;

    title:
      string;

    eventSummary:
      string;
  },
): GenesisHistoricalEducationRecord {
  return {
    recordId:
      input.recordId,

    projectionVersion:
      "genesis-historical-education:v1",

    replayId:
      "genesis-replay:test",

    episodeId:
      input.episodeId,

    episodeRevisionId:
      `revision:${input.episodeId}`,

    episodeKey:
      `episode-key:${input.episodeId}`,

    title:
      input.title,

    lifecycle:
      "validated",

    externalContext:
      "complete",

    temporalAuthority: {
      historicalStatus:
        "historically-observed",

      currentStatus:
        "not-applicable",

      historicalAuthorityClass:
        null,

      historicalApprovalState:
        null,

      currentAuthorityClass:
        null,

      currentApprovalState:
        null,

      replacedBy:
        null,
    },

    eventReferences: [
      {
        eventId:
          `event:${input.episodeId}`,

        kind:
          "lesson-recorded",

        occurredAt:
          100,

        summary:
          input.eventSummary,
      },
    ],

    sourceReferences: [
      {
        sourceReferenceId:
          `source:${input.episodeId}`,

        sourceRevisionId:
          `source-revision:${input.episodeId}`,

        sourceIdentity:
          `historical-source:${input.episodeId}`,

        sourceClass:
          "repository",

        evidenceType:
          "document",

        acquisitionState:
          "acquired",

        provenance: {
          repository:
            "kore20lllc-netizen/korelumina",

          externalSource:
            false,
        },
      },
    ],

    relationshipIds:
      [],

    lineage: {
      previousRevisionId:
        null,

      mergedFrom:
        [],

      splitFrom:
        null,

      supersedes:
        [],
    },

    governingAuthorityCreated:
      false,

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}


function sourceContract(
  historicalRecords:
    readonly GenesisHistoricalEducationRecord[],
): EducationalCorpusSourceContract {
  const historicalAssessments =
    assessGenesisHistoricalEducationSources(
      historicalRecords,
    );

  return {
    contractId:
      "educational-corpus-source-contract:test",

    dayZeroCertificationId:
      "genesis-day-zero-certification:test",

    dayZeroCandidateId:
      "genesis-day-zero-certification-candidate:test",

    assessments: [
      {
        policyVersion:
          "educational-corpus-authority:v1",

        artifactId:
          "constitution",

        decision:
          "ELIGIBLE",

        learningRole:
          "CONSTITUTIONAL_CURRICULUM",

        dayZeroCertificationId:
          "genesis-day-zero-certification:test",

        authority: {
          authorityClass:
            "constitutional",

          approvalState:
            "approved",

          owner:
            "governance",

          scope:
            "platform",

          version:
            "1",
        },

        reasons: [
          "educational-source-authority-complete",
        ],
      },
    ],

    historicalAssessments,

    summary: {
      artifacts:
        1,

      eligible:
        1,

      requiresAuthorityReview:
        0,

      excluded:
        0,

      blocked:
        0,

      historicalArtifacts:
        historicalAssessments.length,

      historicalEligible:
        historicalAssessments.length,

      historicalBlocked:
        0,
    },

    unresolvedArtifactIds:
      [],

    blockedHistoricalRecordIds:
      [],

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,
  };
}


function corpus(
  historicalRecords:
    readonly GenesisHistoricalEducationRecord[],
) {
  const contract =
    sourceContract(
      historicalRecords,
    );

  const historicalEvidence =
    assembleEducationalCorpusHistoricalEvidence({
      records:
        historicalRecords,

      assessments:
        contract.historicalAssessments,
    });

  return assembleEducationalCorpus({
    artifacts: [
      canonicalArtifact(),
    ],

    sourceContract:
      contract,

    historicalEvidence,
  });
}


function candidate(
  corpusId:
    string,

  candidateId:
    EducationalCorpusCertificationCandidate["candidateId"],
): EducationalCorpusCertificationCandidate {
  return {
    candidateId,

    state:
      "READY",

    corpusId,

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
        "Ready for corpus certification.",
    },

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}


test(
  "historical-only evidence change changes corpus identity and makes certification stale",
  () => {
    const historicalV1 = [
      historicalRecord({
        recordId:
          "genesis-historical-education:lesson-v1",

        episodeId:
          "lesson-v1",

        title:
          "Original lesson",

        eventSummary:
          "Original reconstructed lesson.",
      }),
    ];

    const historicalV2 = [
      historicalRecord({
        recordId:
          "genesis-historical-education:lesson-v2",

        episodeId:
          "lesson-v2",

        title:
          "Corrected lesson",

        eventSummary:
          "Corrected reconstructed lesson.",
      }),
    ];

    const originalCorpus =
      corpus(
        historicalV1,
      );

    const changedCorpus =
      corpus(
        historicalV2,
      );

    /*
     * Current governing curriculum is unchanged.
     */
    assert.deepEqual(
      originalCorpus.items,
      changedCorpus.items,
    );

    assert.equal(
      originalCorpus.summary
        .curriculumItems,
      changedCorpus.summary
        .curriculumItems,
    );

    /*
     * Historical evidence alone changes corpus identity.
     */
    assert.notEqual(
      originalCorpus
        .historicalEvidence
        ?.historicalEvidenceId,
      changedCorpus
        .historicalEvidence
        ?.historicalEvidenceId,
    );

    assert.notEqual(
      originalCorpus.corpusId,
      changedCorpus.corpusId,
    );

    const originalCandidate =
      candidate(
        originalCorpus.corpusId,
        "educational-corpus-certification-candidate:original",
      );

    const certification =
      certifyEducationalCorpus({
        candidate:
          originalCandidate,

        decision: {
          certifiedBy:
            "korelumina-human-governance",

          certifiedAt:
            1000,

          reason:
            "Certified governed Educational Corpus.",

          acknowledgedExcludedArtifactIds:
            [],
        },
      });

    const changedCandidate =
      candidate(
        changedCorpus.corpusId,
        "educational-corpus-certification-candidate:historical-change",
      );

    const validation =
      validateEducationalCorpusCertification({
        certification,

        currentCandidate:
          changedCandidate,
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

    assert.equal(
      changedCorpus
        .historicalEvidence
        ?.governingAuthority,
      false,
    );

    assert.equal(
      changedCorpus
        .initialCompetencyCertified,
      false,
    );

    assert.equal(
      changedCorpus
        .chiefAgentActivationAuthorized,
      false,
    );
  },
);
