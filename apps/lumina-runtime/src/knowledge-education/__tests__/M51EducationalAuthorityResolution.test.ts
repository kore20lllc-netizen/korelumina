import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createEducationalAuthorityResolution,
} from "../EducationalAuthorityResolution.js";

import {
  FileEducationalAuthorityResolutionStore,
} from "../EducationalAuthorityResolutionPersistence.js";


test(
  "M51.5i15 persists an explicit human educational authority resolution",
  () => {
    const root =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-m51-i15-",
        ),
      );

    try {
      const store =
        new FileEducationalAuthorityResolutionStore({
          storageRoot:
            root,
        });

      const resolution =
        createEducationalAuthorityResolution({
          artifactId:
            "canonical:mission-ownership",

          learningRole:
            "CURRENT_RULE",

          reviewerId:
            "human-review:m51.5i15",

          reviewedAt:
            100,

          reason:
            "Human educational authority review classified Mission Ownership as current governing curriculum.",

          authorityPolicyVersion:
            "educational-corpus-authority:v1",

          dayZeroCertificationId:
            "genesis-day-zero-certification:test",
        });

      const saved =
        store.save(
          resolution,
        );

      assert.deepEqual(
        saved,
        resolution,
      );

      assert.deepEqual(
        store.load(
          resolution.artifactId,
        ),
        resolution,
      );

      assert.equal(
        resolution.decision,
        "APPROVED",
      );

      assert.equal(
        resolution.learningRole,
        "CURRENT_RULE",
      );

      assert.equal(
        resolution.downstream
          .educationalCorpusCertified,
        false,
      );

      assert.equal(
        resolution.downstream
          .initialCompetencyCertified,
        false,
      );

      assert.equal(
        resolution.downstream
          .chiefAgentActivationAuthorized,
        false,
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


test(
  "M51.5i15 refuses silent replacement of an existing human resolution",
  () => {
    const root =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-m51-i15-conflict-",
        ),
      );

    try {
      const store =
        new FileEducationalAuthorityResolutionStore({
          storageRoot:
            root,
        });

      const first =
        createEducationalAuthorityResolution({
          artifactId:
            "canonical:mission-ownership",

          learningRole:
            "CURRENT_RULE",

          reviewerId:
            "human-review:first",

          reviewedAt:
            100,

          reason:
            "First governed decision.",

          authorityPolicyVersion:
            "educational-corpus-authority:v1",

          dayZeroCertificationId:
            "genesis-day-zero-certification:test",
        });

      store.save(
        first,
      );

      const replacement =
        createEducationalAuthorityResolution({
          artifactId:
            first.artifactId,

          learningRole:
            "HISTORICAL_CONTEXT",

          reviewerId:
            "human-review:second",

          reviewedAt:
            200,

          reason:
            "Attempted replacement.",

          authorityPolicyVersion:
            "educational-corpus-authority:v1",

          dayZeroCertificationId:
            "genesis-day-zero-certification:test",
        });

      assert.throws(
        () =>
          store.save(
            replacement,
          ),
        /educational_authority_resolution_already_exists/,
      );

      assert.deepEqual(
        store.load(
          first.artifactId,
        ),
        first,
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


test(
  "M51.5i15 fails closed on incomplete human authority evidence",
  () => {
    assert.throws(
      () =>
        createEducationalAuthorityResolution({
          artifactId:
            "",

          learningRole:
            "CURRENT_RULE",

          reviewerId:
            "human-review:test",

          reason:
            "Invalid.",

          authorityPolicyVersion:
            "educational-corpus-authority:v1",

          dayZeroCertificationId:
            "genesis-day-zero-certification:test",
        }),
      /educational_authority_resolution_artifact_id_required/,
    );

    assert.throws(
      () =>
        createEducationalAuthorityResolution({
          artifactId:
            "canonical:mission-ownership",

          learningRole:
            "CURRENT_RULE",

          reviewerId:
            "",

          reason:
            "Invalid.",

          authorityPolicyVersion:
            "educational-corpus-authority:v1",

          dayZeroCertificationId:
            "genesis-day-zero-certification:test",
        }),
      /educational_authority_resolution_reviewer_id_required/,
    );
  },
);
