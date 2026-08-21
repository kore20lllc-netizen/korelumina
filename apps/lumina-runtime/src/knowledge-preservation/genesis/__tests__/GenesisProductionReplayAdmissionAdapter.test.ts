import assert from "node:assert/strict";
import test from "node:test";

import path from "node:path";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/index.js";

import {
  resolveKnowledgeStorageRoot,
} from "../../storage/index.js";

import type {
  GenesisReplayAdmissionRequest,
  GenesisReplayPlanEntry,
  GenesisSourceManifestEntry,
  HistoricalSourceId,
} from "../index.js";

import {
  GenesisProductionReplayAdmissionAdapter,
  createGenesisReplayAdmissionIdentity,
} from "../index.js";

function request(
  overrides: {
    historicalSourceId?:
      string;

    checksum?:
      string;

    action?:
      "ADMIT" |
      "SKIP_SCOPE" |
      "BLOCK";

    replayEligibility?:
      "eligible" |
      "excluded" |
      "blocked";

    executionTimestamp?:
      number;

    evidenceType?:
      GenesisSourceManifestEntry[
        "evidenceType"
      ];

    sourceType?:
      GenesisSourceManifestEntry[
        "sourceType"
      ];

    authorityClass?:
      string;

    approvalState?:
      string;

    supersedes?:
      readonly HistoricalSourceId[];

    conflictsWith?:
      readonly HistoricalSourceId[];
  } = {},
): GenesisReplayAdmissionRequest {
  const historicalSourceId:
    HistoricalSourceId =
      (
        overrides.historicalSourceId ??
        "genesis-source:commit:production-adapter"
      ) as HistoricalSourceId;

  const checksum =
    overrides.checksum ??
    "sha256:production-adapter";

  const planEntry:
    GenesisReplayPlanEntry =
      {
        manifestIndex:
          0,

        historicalSourceId,

        sourceChecksum:
          checksum,

        action:
          overrides.action ??
          "ADMIT",
      };

  const manifestEntry:
    GenesisSourceManifestEntry =
      {
        historicalSourceId,

        sourceType:
          overrides.sourceType ??
          "commit",

        evidenceType:
          overrides.evidenceType ??
          "commit",

        authorityClass:
          overrides.authorityClass ??
          "repository-history",

        approvalState:
          overrides.approvalState,

        provenanceLocator:
          "git:commit:production-adapter",

        sourceChecksum:
          checksum,

        historicalTimestamp:
          100,

        historicalTimestampSource:
          "git-committer-time",

        discoveredAt:
          9000,

        discoveryMethod:
          "fixture",

        replayEligibility:
          overrides
            .replayEligibility ??
          "eligible",

        supersedes:
          overrides.supersedes ??
          [],

        conflictsWith:
          overrides.conflictsWith ??
          [],

        metadata: {
          subject:
            "Genesis production adapter fixture",
        },
      };

  const base = {
    replayId:
      "genesis-replay:production-adapter" as const,

    manifestId:
      "genesis-manifest:production-adapter",

    repository:
      "kore20lllc-netizen/korelumina",

    manifestIndex:
      0,

    planEntry,

    manifestEntry,
  };

  return {
    ...base,

    admissionIdentity:
      createGenesisReplayAdmissionIdentity(
        base,
      ),

    executionTimestamp:
      overrides
        .executionTimestamp ??
      1000,
  };
}

test(
  "production adapter routes governance-approved ADR through existing Knowledge Preservation Platform",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    const result =
      await adapter.admit(
        request({
          historicalSourceId:
            "genesis-source:ADR:production-adapter",

          sourceType:
            "ADR",

          evidenceType:
            "ADR",

          authorityClass:
            "architecture-decision",

          approvalState:
            "approved",
        }),
      );

    assert.match(
      result.evidenceId,
      /^genesis-evidence:[a-f0-9]{64}$/,
    );

    const run =
      platform
        .manufacturingRunService
        .list()
        .find(
          (
            candidate,
          ) =>
            candidate.evidenceId ===
            result.evidenceId,
        );

    assert.ok(
      run,
    );

    assert.equal(
      run.stageHistory.some(
        (
          event,
        ) =>
          event.stage ===
            "Evidence Intake" &&
          event.outcome ===
            "completed",
      ),
      true,
    );
  },
);

test(
  "production adapter remains idempotent for the same Genesis source version",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    const input =
      request({
        historicalSourceId:
          "genesis-source:commit:idempotent-production-adapter",

        checksum:
          "sha256:idempotent-production-adapter",

        sourceType:
          "ADR",

        evidenceType:
          "ADR",

        authorityClass:
          "architecture-decision",

        approvalState:
          "approved",
      });

    const first =
      await adapter.admit(
        input,
      );

    const runsAfterFirst =
      platform
        .manufacturingRunService
        .list()
        .filter(
          (
            run,
          ) =>
            run.evidenceId ===
            first.evidenceId,
        )
        .length;

    const second =
      await adapter.admit(
        input,
      );

    const runsAfterSecond =
      platform
        .manufacturingRunService
        .list()
        .filter(
          (
            run,
          ) =>
            run.evidenceId ===
            first.evidenceId,
        )
        .length;

    assert.equal(
      second.evidenceId,
      first.evidenceId,
    );

    assert.equal(
      runsAfterFirst,
      1,
    );

    assert.equal(
      runsAfterSecond,
      1,
    );
  },
);

test(
  "production adapter cannot bypass Replay Plan ADMIT governance",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    await assert.rejects(
      () =>
        adapter.admit(
          request({
            action:
              "SKIP_SCOPE",

            replayEligibility:
              "excluded",
          }),
        ),
      /genesis_production_admission_requires_admit_action/,
    );
  },
);

test(
  "production adapter requires manifest source to remain eligible",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    await assert.rejects(
      () =>
        adapter.admit(
          request({
            replayEligibility:
              "blocked",
          }),
        ),
      /genesis_production_admission_requires_eligible_source/,
    );
  },
);

test(
  "production adapter preserves deterministic Evidence identity across repeated admission",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    const input =
      request({
        historicalSourceId:
          "genesis-source:commit:stable-evidence-id",

        checksum:
          "sha256:stable-evidence-id",
      });

    const first =
      await adapter.admit(
        input,
      );

    const second =
      await adapter.admit(
        input,
      );

    assert.equal(
      first.evidenceId,
      second.evidenceId,
    );
  },
);

test(
  "production Evidence admission stops at governed Canonical Review boundary",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    const result =
      await adapter.admit(
        request({
          historicalSourceId:
            "genesis-source:commit:canonical-boundary",

          checksum:
            "sha256:canonical-boundary",

          sourceType:
            "ADR",

          evidenceType:
            "ADR",

          authorityClass:
            "architecture-decision",

          approvalState:
            "approved",
        }),
      );

    const run =
      platform
        .manufacturingRunService
        .list()
        .find(
          (
            candidate,
          ) =>
            candidate.evidenceId ===
            result.evidenceId,
        );

    assert.ok(
      run,
    );

    assert.equal(
      run.currentStage,
      "Canonical Review",
    );

    assert.ok(
      run.packageId,
    );

    assert.deepEqual(
      run.canonicalKnowledgeIds,
      [],
    );

    assert.equal(
      run.stageHistory.some(
        (
          event,
        ) =>
          event.stage ===
            "Canonical Review" &&
          event.outcome ===
            "awaiting_human_review",
      ),
      true,
    );

    assert.equal(
      run.stageHistory.some(
        (
          event,
        ) =>
          event.stage ===
            "Canonical Knowledge",
      ),
      false,
    );
  },
);

test(
  "production adapter tests use isolated test Knowledge storage",
  () => {
    const root =
      path.resolve(
        resolveKnowledgeStorageRoot(),
      );

    assert.equal(
      root.includes(
        `${path.sep}runtime-data${path.sep}test-knowledge${path.sep}`,
      ),
      true,
    );

    assert.equal(
      root.endsWith(
        `${path.sep}runtime${path.sep}knowledge`,
      ),
      false,
    );
  },
);

test(
  "downstream manufacturing failure after Evidence Intake remains admitted and retry creates no duplicate Evidence run",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    const input =
      request({
        historicalSourceId:
          "genesis-source:commit:downstream-failure-after-intake",

        checksum:
          "sha256:downstream-failure-after-intake",

        sourceType:
          "ADR",

        evidenceType:
          "ADR",

        authorityClass:
          "architecture-decision",

        approvalState:
          "approved",
      });

    const originalCompile =
      platform.compilerPipeline.compile.bind(
        platform.compilerPipeline,
      );

    platform.compilerPipeline.compile =
      async () => {
        throw new Error(
          "fixture downstream compiler failure",
        );
      };

    const first =
      await adapter.admit(
        input,
      );

    const matchingAfterFailure =
      platform
        .manufacturingRunService
        .list()
        .filter(
          (
            run,
          ) =>
            run.evidenceId ===
            first.evidenceId,
        );

    assert.equal(
      matchingAfterFailure.length,
      1,
    );

    const failedRun =
      matchingAfterFailure[0];

    assert.equal(
      failedRun.stageHistory.some(
        (
          event,
        ) =>
          event.stage ===
            "Evidence Intake" &&
          event.outcome ===
            "completed",
      ),
      true,
    );

    assert.equal(
      failedRun.status,
      "failed",
    );

    platform.compilerPipeline.compile =
      originalCompile;

    const second =
      await adapter.admit(
        input,
      );

    assert.equal(
      second.evidenceId,
      first.evidenceId,
    );

    const matchingAfterRetry =
      platform
        .manufacturingRunService
        .list()
        .filter(
          (
            run,
          ) =>
            run.evidenceId ===
            first.evidenceId,
        );

    assert.equal(
      matchingAfterRetry.length,
      1,
    );

    assert.equal(
      matchingAfterRetry[0].id,
      failedRun.id,
    );
  },
);

test(
  "non-seeding Runtime Evidence remains historically admitted without Knowledge manufacturing",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    const result =
      await adapter.admit(
        request({
          historicalSourceId:
            "genesis-source:runtime-event:historical-only",

          checksum:
            "sha256:historical-only",

          sourceType:
            "runtime-event",

          evidenceType:
            "runtime-event",

          authorityClass:
            "runtime-observation",
        }),
      );

    assert.match(
      result.evidenceId,
      /^genesis-evidence:[a-f0-9]{64}$/,
    );

    const matchingRuns =
      platform
        .manufacturingRunService
        .list()
        .filter(
          run =>
            run.evidenceId ===
            result.evidenceId,
        );

    assert.equal(
      matchingRuns.length,
      0,
    );
  },
);
