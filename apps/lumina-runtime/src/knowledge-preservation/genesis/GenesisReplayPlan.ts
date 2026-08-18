import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import {
  createGenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisSourceManifest,
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

import {
  createGenesisSourceManifestId,
} from "./GenesisSourceManifestIdentity.js";

import type {
  GenesisSourceManifestBuildResult,
} from "./GenesisSourceManifestBuilder.js";

import {
  assertGenesisSourceManifestBuildReady,
} from "./GenesisSourceManifestBuilder.js";

import type {
  HistoricalSourceId,
} from "./HistoricalSource.js";

export type GenesisReplayPlanAction =
  | "ADMIT"
  | "SKIP_SCOPE"
  | "BLOCK";

export type GenesisReplayPlanReadiness =
  | "READY"
  | "BLOCKED";

export interface GenesisReplayPlanEntry {
  manifestIndex:
    number;

  historicalSourceId:
    HistoricalSourceId;

  sourceChecksum:
    string;

  action:
    GenesisReplayPlanAction;

  reason?:
    string;
}

export interface GenesisReplayPlanSummary {
  totalSources:
    number;

  admit:
    number;

  skipScope:
    number;

  block:
    number;
}

export interface GenesisReplayPlan {
  replayId:
    GenesisReplayId;

  manifestId:
    string;

  replayContractVersion:
    string;

  readiness:
    GenesisReplayPlanReadiness;

  entries:
    readonly GenesisReplayPlanEntry[];

  summary:
    GenesisReplayPlanSummary;
}

function assertManifestIdentity(
  manifest:
    GenesisSourceManifest,
): void {
  const expectedManifestId =
    createGenesisSourceManifestId({
      replayContractVersion:
        manifest.replayContractVersion,

      scope:
        manifest.scope,

      entries:
        manifest.entries,
    });

  if (
    expectedManifestId !==
    manifest.manifestId
  ) {
    throw new Error(
      "genesis_replay_plan_manifest_identity_mismatch",
    );
  }
}

function actionForEntry(
  entry:
    GenesisSourceManifestEntry,
): {
  action:
    GenesisReplayPlanAction;

  reason?:
    string;
} {
  switch (
    entry.replayEligibility
  ) {
    case "eligible":
      return {
        action:
          "ADMIT",
      };

    case "excluded":
      if (
        !entry.exclusionReason
          ?.trim()
      ) {
        throw new Error(
          "genesis_replay_plan_scope_exclusion_reason_required",
        );
      }

      return {
        action:
          "SKIP_SCOPE",

        reason:
          entry.exclusionReason.trim(),
      };

    case "blocked":
      return {
        action:
          "BLOCK",

        reason:
          entry.exclusionReason ??
          "historical_source_blocked",
      };
  }
}

function summaryFor(
  entries:
    readonly GenesisReplayPlanEntry[],
): GenesisReplayPlanSummary {
  return {
    totalSources:
      entries.length,

    admit:
      entries.filter(
        (
          entry,
        ) =>
          entry.action ===
          "ADMIT",
      ).length,

    skipScope:
      entries.filter(
        (
          entry,
        ) =>
          entry.action ===
          "SKIP_SCOPE",
      ).length,

    block:
      entries.filter(
        (
          entry,
        ) =>
          entry.action ===
          "BLOCK",
      ).length,
  };
}

export function createGenesisReplayPlan(
  manifestBuild:
    GenesisSourceManifestBuildResult,
): GenesisReplayPlan {
  assertGenesisSourceManifestBuildReady(
    manifestBuild,
  );

  const manifest =
    manifestBuild.manifest;

  assertManifestIdentity(
    manifest,
  );

  const replayId =
    createGenesisReplayId({
      manifestId:
        manifest.manifestId,

      replayContractVersion:
        manifest.replayContractVersion,

      scope:
        manifest.scope,
    });

  const entries =
    manifest.entries.map(
      (
        entry,
        manifestIndex,
      ): GenesisReplayPlanEntry => {
        const classification =
          actionForEntry(
            entry,
          );

        return {
          manifestIndex,

          historicalSourceId:
            entry.historicalSourceId,

          sourceChecksum:
            entry.sourceChecksum,

          action:
            classification.action,

          reason:
            classification.reason,
        };
      },
    );

  const summary =
    summaryFor(
      entries,
    );

  return {
    replayId,

    manifestId:
      manifest.manifestId,

    replayContractVersion:
      manifest.replayContractVersion,

    readiness:
      summary.block >
        0
        ? "BLOCKED"
        : "READY",

    entries,

    summary,
  };
}

export function assertGenesisReplayPlanReady(
  plan:
    GenesisReplayPlan,
): void {
  if (
    plan.readiness !==
      "READY" ||
    plan.summary.block >
      0
  ) {
    throw new Error(
      "genesis_replay_plan_blocked",
    );
  }
}
