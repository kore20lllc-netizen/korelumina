import assert from "node:assert/strict";
import test from "node:test";

import path from "node:path";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/index.js";

import {
  FileEvidencePersistenceStore,
} from "../../evidence/index.js";

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

    authorityOwner?:
      string;

    authorityScope?:
      string;

    authorityVersion?:
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

        authorityOwner:
          overrides.authorityOwner ??
          "Architecture Governance",

        authorityScope:
          overrides.authorityScope ??
          "Platform Architecture",

        authorityVersion:
          overrides.authorityVersion ??
          "1.0.0",

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

    const evidenceStore =
      new FileEvidencePersistenceStore();

    const persistedEvidence =
      evidenceStore.load(
        result.evidenceId,
      );

    assert.ok(
      persistedEvidence,
    );

    assert.equal(
      persistedEvidence.id,
      result.evidenceId,
    );

    assert.equal(
      persistedEvidence.type,
      "runtime-event",
    );

    assert.equal(
      persistedEvidence.metadata
        .historicalSourceId,
      "genesis-source:runtime-event:historical-only",
    );

  },
);

test(
  "approved historical Evidence review permits explicit first manufacturing without remediation reprocessing",
  async () => {
    const {
      createGenesisHistoricalEvidenceReviewDecision,
      genesisReplayAdmissionRequestToEvidence,
    } =
      await import(
        "../index.js"
      );

    /*
     * Use the repository's existing request() fixture.
     *
     * Empty authority identity fields are intentional:
     * the source must begin as requires-governance-review.
     */
    const baseRequest =
      request({
        historicalSourceId:
          "genesis-source:document:reviewed-first-manufacture",

        checksum:
          "sha256:reviewed-first-manufacture",

        sourceType:
          "document",

        evidenceType:
          "document",

        authorityClass:
          "documentation",

        approvalState:
          "Accepted",

        authorityOwner:
          "",

        authorityScope:
          "",

        authorityVersion:
          "",
      });

    /*
     * metadata is readonly in GenesisSourceManifestEntry.
     * Construct a new manifest entry instead of mutating
     * the fixture returned by request().
     */
    const requestWithSourceLocation = {
      ...baseRequest,

      manifestEntry: {
        ...baseRequest.manifestEntry,

        metadata: {
          ...baseRequest
            .manifestEntry
            .metadata,

          sourceLocation:
            "docs/reviewed-first-manufacture.md",
        },
      },
    };

    /*
     * Recalculate admission identity after replacing the
     * manifest entry so the request remains internally valid.
     */
    const admissionRequest:
      GenesisReplayAdmissionRequest = {
        ...requestWithSourceLocation,

        admissionIdentity:
          createGenesisReplayAdmissionIdentity(
            requestWithSourceLocation,
          ),
      };

    /*
     * Evidence identity remains owned by the Genesis
     * admission contract.
     */
    const evidence =
      genesisReplayAdmissionRequestToEvidence(
        admissionRequest,
      );

    const review =
      createGenesisHistoricalEvidenceReviewDecision({
        historicalSourceId:
          admissionRequest
            .manifestEntry
            .historicalSourceId,

        evidenceId:
          evidence.id,

        sourceChecksum:
          admissionRequest
            .manifestEntry
            .sourceChecksum,

        disposition:
          "APPROVE_MANUFACTURING",

        authority: {
          authorityClass:
            "Supreme",

          authorityOwner:
            "Constitutional Office",

          authorityScope:
            "Organization-wide",

          authorityVersion:
            "1.0.0",

          approvalState:
            "approved",
        },

        reviewerId:
          "human:constitutional-office",

        decidedAt:
          100,

        rationale:
          "Approved for test first manufacturing.",
      });

    const resolver = {
      resolve(
        historicalSourceId:
          string,

        evidenceId:
          string,
      ) {
        if (
          historicalSourceId ===
            review.historicalSourceId &&
          evidenceId ===
            review.evidenceId
        ) {
          return review;
        }

        return null;
      },
    };

    const preserveCalls:
      string[] = [];

    const reprocessCalls:
      string[] = [];

    const platform =
      createKnowledgePreservationPlatform();

    const originalPreserve =
      platform.preserve.bind(
        platform,
      );

    const originalReprocess =
      platform.reprocess.bind(
        platform,
      );

    platform.preserve =
      async evidenceItem => {
        preserveCalls.push(
          evidenceItem.id,
        );

        return originalPreserve(
          evidenceItem,
        );
      };

    platform.reprocess =
      async (
        evidenceItem,
        reprocessingRequest,
      ) => {
        reprocessCalls.push(
          evidenceItem.id,
        );

        return originalReprocess(
          evidenceItem,
          reprocessingRequest,
        );
      };

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,

        historicalEvidenceReviewDecisionResolver:
          resolver,

        reviewedManufacturing: {
          historicalSourceId:
            review.historicalSourceId,
        },
      });

    await adapter.admit(
      admissionRequest,
    );

    assert.deepEqual(
      preserveCalls,
      [
        evidence.id,
      ],
    );

    assert.deepEqual(
      reprocessCalls,
      [],
    );

    const run =
      platform
        .manufacturingRunService
        .list()
        .find(
          candidate =>
            candidate.evidenceId ===
            evidence.id,
        );

    assert.ok(
      run,
    );

    const manufacturedPackage =
      platform
        .packageService
        .list()
        .find(
          candidate =>
            candidate.id ===
            run.packageId,
        );

    assert.ok(
      manufacturedPackage,
    );

    assert.notEqual(
      manufacturedPackage.approvalState,
      "remediation_required",
    );

    const serializedPackage =
      JSON.stringify(
        manufacturedPackage,
      );

    assert.doesNotMatch(
      serializedPackage,
      /documentation_owner_required/,
    );

    assert.doesNotMatch(
      serializedPackage,
      /documentation_scope_required/,
    );

    assert.doesNotMatch(
      serializedPackage,
      /documentation_version_required/,
    );

    assert.match(
      serializedPackage,
      /Constitutional Office/,
    );

    assert.match(
      serializedPackage,
      /Organization-wide/,
    );

    assert.match(
      serializedPackage,
      /1\.0\.0/,
    );
  },
);

test(
  "approved historical Evidence remediation carries review authority into reprocessing without mutating historical Evidence",
  async () => {
    const {
      createGenesisHistoricalEvidenceReviewDecision,
      genesisReplayAdmissionRequestToEvidence,
    } =
      await import(
        "../index.js"
      );

    const baseRequest =
      request({
        historicalSourceId:
          "genesis-source:document:reviewed-remediation",

        checksum:
          "sha256:reviewed-remediation",

        sourceType:
          "document",

        evidenceType:
          "document",

        authorityClass:
          "documentation",

        approvalState:
          "Accepted",

        authorityOwner:
          "",

        authorityScope:
          "",

        authorityVersion:
          "",
      });

    const requestWithSourceLocation = {
      ...baseRequest,

      manifestEntry: {
        ...baseRequest.manifestEntry,

        metadata: {
          ...baseRequest
            .manifestEntry
            .metadata,

          sourceLocation:
            "docs/reviewed-remediation.md",
        },
      },
    };

    const admissionRequest:
      GenesisReplayAdmissionRequest = {
        ...requestWithSourceLocation,

        admissionIdentity:
          createGenesisReplayAdmissionIdentity(
            requestWithSourceLocation,
          ),
      };

    const historicalEvidence =
      genesisReplayAdmissionRequestToEvidence(
        admissionRequest,
      );

    const historicalEvidenceBefore =
      structuredClone(
        historicalEvidence,
      );

    const review =
      createGenesisHistoricalEvidenceReviewDecision({
        historicalSourceId:
          admissionRequest
            .manifestEntry
            .historicalSourceId,

        evidenceId:
          historicalEvidence.id,

        sourceChecksum:
          admissionRequest
            .manifestEntry
            .sourceChecksum,

        disposition:
          "APPROVE_MANUFACTURING",

        authority: {
          authorityClass:
            "Supreme",

          authorityOwner:
            "Constitutional Office",

          authorityScope:
            "Organization-wide",

          authorityVersion:
            "1.0.0",

          approvalState:
            "approved",
        },

        reviewerId:
          "human:constitutional-office",

        decidedAt:
          100,

        rationale:
          "Approved for governed remediation test.",
      });

    const resolver = {
      resolve(
        historicalSourceId:
          string,

        evidenceId:
          string,
      ) {
        if (
          historicalSourceId ===
            review.historicalSourceId &&
          evidenceId ===
            review.evidenceId
        ) {
          return review;
        }

        return null;
      },
    };

    const platform =
      createKnowledgePreservationPlatform();

    /*
     * Seed a legitimate remediation-required prior package/run
     * with the historical, non-overlaid Evidence.
     */
    await platform.preserve(
      historicalEvidence,
    );

    const priorRun =
      platform
        .manufacturingRunService
        .list()
        .find(
          candidate =>
            candidate.evidenceId ===
            historicalEvidence.id,
        );

    assert.ok(
      priorRun,
    );

    assert.ok(
      priorRun.packageId,
    );

    const priorPackage =
      platform
        .packageService
        .get(
          priorRun.packageId,
        );

    assert.ok(
      priorPackage,
    );

    assert.equal(
      priorPackage.approvalState,
      "remediation_required",
    );

    assert.equal(
      priorPackage.remediation.required,
      true,
    );

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,

        historicalEvidenceReviewDecisionResolver:
          resolver,

        reprocessing: {
          historicalSourceId:
            review.historicalSourceId,

          attemptId:
            "review-authority-remediation-1",

          priorManufacturingRunId:
            priorRun.id,

          priorPackageId:
            priorPackage.id,

          reason:
            "Apply persisted historical Evidence review authority.",
        },
      });

    await adapter.admit(
      admissionRequest,
    );

    assert.deepEqual(
      historicalEvidence,
      historicalEvidenceBefore,
    );

    const runs =
      platform
        .manufacturingRunService
        .list()
        .filter(
          candidate =>
            candidate.evidenceId ===
            historicalEvidence.id,
        );

    assert.equal(
      runs.length,
      2,
    );

    const successorRun =
      runs.find(
        candidate =>
          candidate.id !==
          priorRun.id,
      );

    assert.ok(
      successorRun,
    );

    assert.ok(
      successorRun.packageId,
    );

    const successorPackage =
      platform
        .packageService
        .get(
          successorRun.packageId,
        );

    assert.ok(
      successorPackage,
    );

    const serialized =
      JSON.stringify(
        successorPackage,
      );

    assert.doesNotMatch(
      serialized,
      /documentation_owner_required/,
    );

    assert.doesNotMatch(
      serialized,
      /documentation_scope_required/,
    );

    assert.doesNotMatch(
      serialized,
      /documentation_version_required/,
    );

    assert.match(
      serialized,
      /Constitutional Office/,
    );

    assert.match(
      serialized,
      /Organization-wide/,
    );

    assert.match(
      serialized,
      /1\.0\.0/,
    );

    assert.notEqual(
      successorPackage.approvalState,
      "remediation_required",
    );
  },
);
