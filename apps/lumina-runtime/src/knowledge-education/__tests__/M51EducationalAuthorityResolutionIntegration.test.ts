import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,
} from "../EducationalCorpusAuthorityPolicy.js";

import {
  buildEducationalCorpusSourceContract,
} from "../EducationalCorpusSourceContract.js";

import {
  createEducationalAuthorityResolution,
} from "../EducationalAuthorityResolution.js";

import type {
  EducationalArtifactProjection,
} from "../projection/EducationalArtifactProjector.js";

import type {
  GenesisDayZeroCertificationRuntimeProjection,
} from "../../knowledge-preservation/genesis/index.js";


function missionArtifact():
  EducationalArtifactProjection {
  return {
    id:
      "canonical:mission-ownership",

    title:
      "Mission Ownership",

    kind:
      "knowledge-operations",

    category:
      "Artifact",

    authorityClass:
      "governance",

    approvalState:
      "approved",

    owner:
      "Chief Systems Architect",

    scope:
      "Chief Agent mission-level orchestration.",

    version:
      "1.0",

    provenance:
      "genesis-evidence:mission",

    source:
      "genesis-historical-replay",

    sourceRefs:
      [
        "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",
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
      "Defines mission ownership boundaries.",

    relatedArtifacts:
      [],

    relatedKnowledgePackages:
      [
        "KP-2026-000042",
      ],

    relatedCanonicalKnowledge:
      [
        "canonical:mission-ownership",
      ],

    relatedMemory:
      [],

    relatedMissions:
      [],

    relatedDecisions:
      [],
  };
}


function validDayZero():
  GenesisDayZeroCertificationRuntimeProjection {
  return {
    state:
      "VALID",

    candidate: {
      candidateId:
        "genesis-day-zero-certification-candidate:test",
    },

    certification: {
      certificationId:
        "genesis-day-zero-certification:test",
    },

    validation: {
      valid:
        true,

      blockers:
        [],
    },

    approval: {
      available:
        true,
    },

    downstream: {
      educationalCorpusAuthorized:
        true,

      initialCompetencyAuthorized:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  } as unknown as
    GenesisDayZeroCertificationRuntimeProjection;
}


test(
  "M51.5i16 applies an exact matching human authority resolution",
  () => {
    const artifact =
      missionArtifact();

    const dayZero =
      validDayZero();

    const resolution =
      createEducationalAuthorityResolution({
        artifactId:
          artifact.id,

        learningRole:
          "CURRENT_RULE",

        reviewerId:
          "human-review:m51.5i16",

        reviewedAt:
          100,

        reason:
          "Mission Ownership is current governing Chief Agent curriculum.",

        authorityPolicyVersion:
          EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,

        dayZeroCertificationId:
          dayZero.certification!
            .certificationId,
      });

    const contract =
      buildEducationalCorpusSourceContract({
        artifacts: [
          artifact,
        ],

        authorityResolutions: [
          resolution,
        ],

        dayZero,
      });

    assert.equal(
      contract.summary
        .requiresAuthorityReview,
      0,
    );

    assert.equal(
      contract.summary
        .eligible,
      1,
    );

    assert.deepEqual(
      contract.unresolvedArtifactIds,
      [],
    );

    assert.equal(
      contract.assessments[0]
        .decision,
      "ELIGIBLE",
    );

    assert.equal(
      contract.assessments[0]
        .learningRole,
      "CURRENT_RULE",
    );

    assert.ok(
      contract.assessments[0]
        .reasons
        .includes(
          "educational-authority-resolution-applied",
        ),
    );
  },
);


test(
  "M51.5i16 ignores stale or mismatched authority resolutions",
  () => {
    const artifact =
      missionArtifact();

    const dayZero =
      validDayZero();

    const wrongPolicy =
      createEducationalAuthorityResolution({
        artifactId:
          artifact.id,

        learningRole:
          "CURRENT_RULE",

        reviewerId:
          "human-review:test",

        reviewedAt:
          100,

        reason:
          "Wrong policy.",

        authorityPolicyVersion:
          "educational-corpus-authority:stale",

        dayZeroCertificationId:
          dayZero.certification!
            .certificationId,
      });

    const wrongDayZero =
      createEducationalAuthorityResolution({
        artifactId:
          artifact.id,

        learningRole:
          "CURRENT_RULE",

        reviewerId:
          "human-review:test",

        reviewedAt:
          101,

        reason:
          "Wrong Day-0.",

        authorityPolicyVersion:
          EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,

        dayZeroCertificationId:
          "genesis-day-zero-certification:other",
      });

    for (
      const resolution
      of [
        wrongPolicy,
        wrongDayZero,
      ]
    ) {
      const contract =
        buildEducationalCorpusSourceContract({
          artifacts: [
            artifact,
          ],

          authorityResolutions: [
            resolution,
          ],

          dayZero,
        });

      assert.equal(
        contract.summary
          .requiresAuthorityReview,
        1,
      );

      assert.equal(
        contract.assessments[0]
          .decision,
        "REQUIRES_AUTHORITY_REVIEW",
      );
    }
  },
);
