import {
  createHash,
} from "node:crypto";

import {
  readdirSync,
  readFileSync,
} from "node:fs";

import path from "node:path";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import {
  createGenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  FileGenesisReplayPersistenceStore,
} from "./GenesisReplayPersistence.js";

import type {
  GenesisKnowledgeManufacturingRunReader,
  GenesisReplayStatusSnapshot,
} from "./GenesisReplayStatusService.js";

import {
  inspectGenesisReplayStatus,
} from "./GenesisReplayStatusService.js";

export interface GenesisReplayInventoryInput {
  persistence:
    Pick<
      FileGenesisReplayPersistenceStore,
      | "storageRoot"
      | "loadManifestBuild"
      | "loadExecution"
      | "loadRunnerResult"
    >;

  manufacturingRuns?:
    GenesisKnowledgeManufacturingRunReader;
}

export interface GenesisReplayInventory {
  total:
    number;

  replayIds:
    readonly GenesisReplayId[];

  replays:
    readonly GenesisReplayStatusSnapshot[];
}

interface PersistedReplayIdentityProbe {
  replayId?:
    unknown;

  plan?: {
    replayId?:
      unknown;
  };

  execution?: {
    plan?: {
      replayId?:
        unknown;
    };
  };

  manifest?: {
    manifestId?:
      unknown;

    replayContractVersion?:
      unknown;

    scope?:
      unknown;
  };
}

const REPLAY_ID_PATTERN =
  /^genesis-replay:[a-f0-9]{64}$/;

function stableReplayStorageKey(
  replayId:
    GenesisReplayId,
): string {
  return createHash(
    "sha256",
  )
    .update(
      replayId,
      "utf8",
    )
    .digest(
      "hex",
    );
}

function parseJsonProbe(
  file:
    string,
): PersistedReplayIdentityProbe {
  let raw:
    string;

  try {
    raw =
      readFileSync(
        file,
        "utf8",
      );
  } catch (
    error
  ) {
    const code =
      (
        error as {
          code?:
            string;
        }
      ).code;

    if (
      code ===
        "ENOENT"
    ) {
      return {};
    }

    throw error;
  }

  try {
    return JSON.parse(
      raw,
    ) as
      PersistedReplayIdentityProbe;
  } catch (
    error
  ) {
    if (
      error instanceof
      SyntaxError
    ) {
      throw new Error(
        "genesis_replay_inventory_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    throw error;
  }
}

function validReplayId(
  value:
    unknown,
): GenesisReplayId |
  null {
  if (
    typeof value !==
      "string" ||
    !REPLAY_ID_PATTERN.test(
      value,
    )
  ) {
    return null;
  }

  return value as
    GenesisReplayId;
}

function replayIdFromManifestProbe(
  probe:
    PersistedReplayIdentityProbe,
): GenesisReplayId |
  null {
  const manifest =
    probe.manifest;

  if (
    !manifest ||
    typeof manifest.manifestId !==
      "string" ||
    typeof manifest.replayContractVersion !==
      "string" ||
    !manifest.scope ||
    typeof manifest.scope !==
      "object"
  ) {
    return null;
  }

  try {
    return createGenesisReplayId({
      manifestId:
        manifest.manifestId as never,

      replayContractVersion:
        manifest.replayContractVersion,

      scope:
        manifest.scope as never,
    });
  } catch {
    throw new Error(
      "genesis_replay_inventory_manifest_identity_invalid",
    );
  }
}

function candidateReplayIdFromDirectory(
  directory:
    string,
): GenesisReplayId |
  null {
  const manifestProbe =
    parseJsonProbe(
      path.join(
        directory,
        "manifest-build.json",
      ),
    );

  const executionProbe =
    parseJsonProbe(
      path.join(
        directory,
        "execution.json",
      ),
    );

  const runnerProbe =
    parseJsonProbe(
      path.join(
        directory,
        "runner-result.json",
      ),
    );

  const candidates =
    [
      replayIdFromManifestProbe(
        manifestProbe,
      ),

      validReplayId(
        executionProbe
          .plan
          ?.replayId,
      ),

      validReplayId(
        runnerProbe
          .execution
          ?.plan
          ?.replayId,
      ),
    ].filter(
      (
        value,
      ):
        value is GenesisReplayId =>
          value !==
          null,
    );

  const unique =
    [
      ...new Set(
        candidates,
      ),
    ];

  if (
    unique.length >
      1
  ) {
    throw new Error(
      "genesis_replay_inventory_identity_ambiguity",
    );
  }

  if (
    unique.length ===
      1
  ) {
    return unique[0];
  }

  return null;
}

function listReplayDirectories(
  storageRoot:
    string,
): readonly string[] {
  try {
    const entries =
      readdirSync(
        storageRoot,
        {
          withFileTypes:
            true,

          encoding:
            "utf8",
        },
      );

    return entries
      .filter(
        (
          entry,
        ) =>
          entry.isDirectory(),
      )
      .map(
        (
          entry,
        ) =>
          path.join(
            storageRoot,
            entry.name,
          ),
      )
      .sort();
  } catch (
    error
  ) {
    const code =
      (
        error as {
          code?:
            string;
        }
      ).code;

    if (
      code ===
        "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

export function listGenesisReplayInventory(
  input:
    GenesisReplayInventoryInput,
): GenesisReplayInventory {
  const directories =
    listReplayDirectories(
      input.persistence
        .storageRoot,
    );

  const replayIds:
    GenesisReplayId[] =
      [];

  for (
    const directory
    of directories
  ) {
    const replayId =
      candidateReplayIdFromDirectory(
        directory,
      );

    if (
      replayId ===
        null
    ) {
      continue;
    }

    const expectedDirectoryName =
      stableReplayStorageKey(
        replayId,
      );

    if (
      path.basename(
        directory,
      ) !==
      expectedDirectoryName
    ) {
      throw new Error(
        "genesis_replay_inventory_directory_identity_mismatch",
      );
    }

    replayIds.push(
      replayId,
    );
  }

  const uniqueReplayIds =
    [
      ...new Set(
        replayIds,
      ),
    ].sort();

  if (
    uniqueReplayIds.length !==
      replayIds.length
  ) {
    throw new Error(
      "genesis_replay_inventory_duplicate_replay_identity",
    );
  }

  const replays =
    uniqueReplayIds.map(
      (
        replayId,
      ) =>
        inspectGenesisReplayStatus({
          replayId,

          persistence:
            input.persistence,

          manufacturingRuns:
            input.manufacturingRuns,
        }),
    );

  return {
    total:
      replays.length,

    replayIds:
      uniqueReplayIds,

    replays,
  };
}
