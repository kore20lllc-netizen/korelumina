import assert from "node:assert/strict";

import test from "node:test";

import type {
  EducationalAuthorityResolution,
} from "../EducationalAuthorityResolution.js";

import {
  runEducationalAuthorityResolutionCommand,
} from "../EducationalAuthorityResolutionCommand.js";

import type {
  AuthorityCommandCorpus,
  AuthorityCommandDayZero,
  AuthorityCommandRequest,
} from "../EducationalAuthorityResolutionCommand.js";


const ARTIFACT =
  "canonical:document:genesis-evidence:mission-ownership";

const DAY_ZERO =
  "genesis-day-zero-certification:current";


function corpus(
  decision =
    "REQUIRES_AUTHORITY_REVIEW",
): AuthorityCommandCorpus {
  return {
    state:
      "INCOMPLETE",
    assessments: [
      {
        artifactId:
          ARTIFACT,
        decision,
        learningRole:
          null,
      },
    ],
    unresolvedArtifactIds:
      decision ===
        "REQUIRES_AUTHORITY_REVIEW"
        ? [
            ARTIFACT,
          ]
        : [],
  };
}


function request(
  overrides:
    Partial<AuthorityCommandRequest> = {},
): AuthorityCommandRequest {
  return {
    artifactId:
      ARTIFACT,
    learningRole:
      "CURRENT_RULE",
    reviewerId:
      "human-review:owner",
    reason:
      "Owner re-confirms Mission Ownership as current rule.",
    confirm:
      false,
    ...overrides,
  };
}


function environment(
  options: {
    dayZero?:
      AuthorityCommandDayZero;
    before?:
      AuthorityCommandCorpus;
    after?:
      AuthorityCommandCorpus;
  } = {},
) {
  const saved:
    EducationalAuthorityResolution[] =
      [];

  let reads =
    0;

  return {
    saved,
    environment: {
      readDayZero:
        () =>
          options.dayZero ?? {
            state:
              "VALID",
            certificationId:
              DAY_ZERO,
          },
      readCorpus:
        () => {
          reads +=
            1;

          return reads ===
            1
            ? options.before ??
                corpus()
            : options.after ??
                corpus(
                  "ELIGIBLE",
                );
        },
      save:
        (
          resolution:
            EducationalAuthorityResolution,
        ) => {
          saved.push(
            resolution,
          );

          return resolution;
        },
      titleOf:
        () =>
          "Mission Ownership",
      now:
        () =>
          5000,
    },
  };
}


test(
  "preview builds the resolution against the current Day-0 and records nothing",
  () => {
    const harness =
      environment();

    const outcome =
      runEducationalAuthorityResolutionCommand(
        request(),
        harness.environment,
      );

    assert.equal(
      outcome.status,
      "PREVIEW",
    );

    assert.equal(
      harness.saved.length,
      0,
    );

    if (
      outcome.status ===
        "PREVIEW"
    ) {
      assert.equal(
        outcome.resolution.dayZeroCertificationId,
        DAY_ZERO,
      );

      assert.equal(
        outcome.resolution.learningRole,
        "CURRENT_RULE",
      );

      assert.equal(
        outcome.resolution.reviewedAt,
        5000,
      );

      assert.equal(
        outcome.title,
        "Mission Ownership",
      );
    }
  },
);


test(
  "confirm records exactly one resolution and reports the corpus before and after",
  () => {
    const harness =
      environment();

    const outcome =
      runEducationalAuthorityResolutionCommand(
        request({
          confirm:
            true,
        }),
        harness.environment,
      );

    assert.equal(
      outcome.status,
      "RECORDED",
    );

    assert.equal(
      harness.saved.length,
      1,
    );

    if (
      outcome.status ===
        "RECORDED"
    ) {
      assert.equal(
        outcome.before.unresolvedArtifactIds.length,
        1,
      );

      assert.equal(
        outcome.after.unresolvedArtifactIds.length,
        0,
      );

      assert.equal(
        outcome.resolution.downstream
          .chiefAgentActivationAuthorized,
        false,
      );
    }
  },
);


test(
  "refuses when Day-0 Genesis is not valid",
  () => {
    for (
      const dayZero of [
        {
          state:
            "STALE",
          certificationId:
            DAY_ZERO,
        },
        {
          state:
            "VALID",
          certificationId:
            null,
        },
      ]
    ) {
      const harness =
        environment({
          dayZero,
        });

      const outcome =
        runEducationalAuthorityResolutionCommand(
          request({
            confirm:
              true,
          }),
          harness.environment,
        );

      assert.deepEqual(
        outcome,
        {
          status:
            "REFUSED",
          reason:
            "valid-day-zero-genesis-certification-required",
        },
      );

      assert.equal(
        harness.saved.length,
        0,
      );
    }
  },
);


test(
  "refuses an artifact that is not awaiting authority review",
  () => {
    const harness =
      environment({
        before:
          corpus(
            "ELIGIBLE",
          ),
      });

    const outcome =
      runEducationalAuthorityResolutionCommand(
        request({
          confirm:
            true,
        }),
        harness.environment,
      );

    assert.deepEqual(
      outcome,
      {
        status:
          "REFUSED",
        reason:
          "artifact-does-not-require-authority-review",
      },
    );

    assert.equal(
      harness.saved.length,
      0,
    );
  },
);


test(
  "refuses an artifact outside the current source contract",
  () => {
    const harness =
      environment();

    const outcome =
      runEducationalAuthorityResolutionCommand(
        request({
          artifactId:
            "canonical:unknown",
          confirm:
            true,
        }),
        harness.environment,
      );

    assert.deepEqual(
      outcome,
      {
        status:
          "REFUSED",
        reason:
          "artifact-not-in-current-educational-corpus-source-contract",
      },
    );
  },
);


test(
  "refuses unknown roles and missing human evidence before reading any state",
  () => {
    const cases: [
      Partial<AuthorityCommandRequest>,
      string,
    ][] = [
      [
        {
          artifactId:
            " ",
        },
        "artifact-required",
      ],
      [
        {
          learningRole:
            "BEST_GUESS",
        },
        "unknown-learning-role",
      ],
      [
        {
          reviewerId:
            "",
        },
        "reviewer-required",
      ],
      [
        {
          reason:
            "  ",
        },
        "reason-required",
      ],
    ];

    for (
      const [
        overrides,
        reason,
      ] of cases
    ) {
      let touched =
        false;

      const outcome =
        runEducationalAuthorityResolutionCommand(
          request({
            ...overrides,
            confirm:
              true,
          }),
          {
            readDayZero:
              () => {
                touched =
                  true;

                return {
                  state:
                    "VALID",
                  certificationId:
                    DAY_ZERO,
                };
              },
            readCorpus:
              () => {
                touched =
                  true;

                return corpus();
              },
            save:
              () => {
                throw new Error(
                  "must not save",
                );
              },
            titleOf:
              () =>
                null,
            now:
              () =>
                1,
          },
        );

      assert.deepEqual(
        outcome,
        {
          status:
            "REFUSED",
          reason,
        },
      );

      assert.equal(
        touched,
        false,
      );
    }
  },
);
