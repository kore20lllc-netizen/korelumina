import {
  createHash,
} from "node:crypto";

import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import path from "node:path";

import {
  getRuntimeDataRoot,
} from "../../projects/workspacePaths.js";

import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  GenesisConversationRuntimeConfiguration,
} from "./GenesisConversationRuntimeConfiguration.js";

import type {
  GenesisConversationHistoricalGap,
} from "./GenesisHistoricalConversationSourceAdapter.js";

import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

import type {
  HistoricalSource,
} from "./HistoricalSource.js";

import type {
  HistoricalSourceDiscoveryError,
} from "./HistoricalSourceDiscovery.js";


export type GenesisConversationAcquisitionExecutionState =
  | "ACQUIRED"
  | "FAILED";


export interface GenesisConversationAcquisitionOccurrence {
  acquiredAt:
    number;

  completedAt:
    number;
}


export interface GenesisConversationAcquisitionRecord {
  acquisitionId:
    string;

  state:
    "ACQUIRED";

  sourceId:
    string;

  firstAcquiredAt:
    number;

  lastAcquiredAt:
    number;

  completedAt:
    number;

  occurrenceCount:
    number;

  occurrences:
    readonly GenesisConversationAcquisitionOccurrence[];

  conversationIds:
    readonly string[];

  gaps:
    readonly GenesisConversationHistoricalGap[];

  conversationCount:
    number;

  historicalSourceCount:
    number;

  evidenceCount:
    number;

  errors:
    readonly HistoricalSourceDiscoveryError[];

  historicalSources:
    readonly HistoricalSource[];

  evidence:
    readonly EvidenceItem[];
}


export interface GenesisConversationAcquisitionFailure {
  state:
    "FAILED";

  attemptedAt:
    number;

  failedAt:
    number;

  error:
    string;
}


export type GenesisConversationAcquisitionLatestState =
  | GenesisConversationAcquisitionRecord
  | GenesisConversationAcquisitionFailure;


export interface GenesisConversationAcquisitionExecutionResult {
  state:
    GenesisConversationAcquisitionExecutionState;

  record?:
    GenesisConversationAcquisitionRecord;

  failure?:
    GenesisConversationAcquisitionFailure;
}


export interface GenesisConversationAcquisitionPersistenceOptions {
  storageRoot?:
    string;
}


function stableStorageKey(
  acquisitionId:
    string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      acquisitionId,
      "utf8",
    )
    .digest(
      "hex",
    );
}


function atomicWriteJson(
  file:
    string,

  value:
    unknown,
): void {
  mkdirSync(
    path.dirname(
      file,
    ),
    {
      recursive:
        true,
    },
  );

  const temporary =
    `${file}.tmp-${process.pid}`;

  try {
    writeFileSync(
      temporary,
      `${JSON.stringify(
        value,
        null,
        2,
      )}\n`,
      "utf8",
    );

    renameSync(
      temporary,
      file,
    );
  } finally {
    rmSync(
      temporary,
      {
        force:
          true,
      },
    );
  }
}


function readJson<T>(
  file:
    string,
): T | null {
  let content:
    string;

  try {
    content =
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
      return null;
    }

    throw error;
  }

  try {
    return JSON.parse(
      content,
    ) as T;
  } catch (
    error
  ) {
    if (
      error instanceof
      SyntaxError
    ) {
      throw new Error(
        "genesis_conversation_acquisition_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    throw error;
  }
}


function sourceIntegrity(
  sources:
    readonly HistoricalSource[],
): readonly string[] {
  return sources
    .map(
      (
        source,
      ) =>
        `${source.historicalSourceId}:${source.sourceChecksum}`,
    )
    .sort();
}


function evidenceIntegrity(
  evidence:
    readonly EvidenceItem[],
): readonly string[] {
  return evidence
    .map(
      (
        item,
      ) =>
        `${item.id}:${item.checksum ?? ""}`,
    )
    .sort();
}


function assertSameAcquisitionContent(
  existing:
    GenesisConversationAcquisitionRecord,

  incoming:
    GenesisConversationAcquisitionRecord,
): void {
  if (
    existing.acquisitionId !==
      incoming.acquisitionId ||
    existing.sourceId !==
      incoming.sourceId ||
    JSON.stringify(
      [...(existing.conversationIds ?? [])].sort(),
    ) !==
    JSON.stringify(
      [...(incoming.conversationIds ?? [])].sort(),
    ) ||
    JSON.stringify(
      existing.gaps ?? [],
    ) !==
    JSON.stringify(
      incoming.gaps ?? [],
    )
  ) {
    throw new Error(
      "genesis_conversation_acquisition_identity_conflict",
    );
  }

  if (
    JSON.stringify(
      sourceIntegrity(
        existing.historicalSources,
      ),
    ) !==
    JSON.stringify(
      sourceIntegrity(
        incoming.historicalSources,
      ),
    ) ||
    JSON.stringify(
      evidenceIntegrity(
        existing.evidence,
      ),
    ) !==
    JSON.stringify(
      evidenceIntegrity(
        incoming.evidence,
      ),
    )
  ) {
    throw new Error(
      "genesis_conversation_acquisition_content_conflict",
    );
  }
}


export class FileGenesisConversationAcquisitionPersistenceStore {
  readonly storageRoot:
    string;

  constructor(
    options:
      GenesisConversationAcquisitionPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "conversation-acquisition",
        ),
      );
  }


  private acquisitionFile(
    acquisitionId:
      string,
  ): string {
    return path.join(
      this.storageRoot,
      "acquisitions",
      stableStorageKey(
        acquisitionId,
      ),
      "record.json",
    );
  }


  private latestFile():
    string {
    return path.join(
      this.storageRoot,
      "latest.json",
    );
  }


  load(
    acquisitionId:
      string,
  ): GenesisConversationAcquisitionRecord |
    null {
    return readJson<
      GenesisConversationAcquisitionRecord
    >(
      this.acquisitionFile(
        acquisitionId,
      ),
    );
  }


  loadLatest():
    GenesisConversationAcquisitionLatestState |
    null {
    return readJson<
      GenesisConversationAcquisitionLatestState
    >(
      this.latestFile(),
    );
  }


  saveAcquired(
    incoming:
      GenesisConversationAcquisitionRecord,
  ): GenesisConversationAcquisitionRecord {
    const existing =
      this.load(
        incoming.acquisitionId,
      );

    let persisted =
      incoming;

    if (
      existing
    ) {
      assertSameAcquisitionContent(
        existing,
        incoming,
      );

      persisted = {
        ...existing,

        lastAcquiredAt:
          incoming.lastAcquiredAt,

        completedAt:
          incoming.completedAt,

        occurrenceCount:
          existing.occurrenceCount +
          1,

        occurrences: [
          ...existing.occurrences,
          ...incoming.occurrences,
        ],
      };
    }

    atomicWriteJson(
      this.acquisitionFile(
        persisted.acquisitionId,
      ),
      persisted,
    );

    atomicWriteJson(
      this.latestFile(),
      persisted,
    );

    return persisted;
  }


  saveFailure(
    failure:
      GenesisConversationAcquisitionFailure,
  ): void {
    atomicWriteJson(
      this.latestFile(),
      failure,
    );
  }
}


export interface GenesisConversationAcquisitionExecutorOptions {
  configuration:
    GenesisConversationRuntimeConfiguration;

  persistence:
    FileGenesisConversationAcquisitionPersistenceStore;

  repository:
    string;

  now?:
    () => number;
}


export class GenesisConversationAcquisitionExecutor {
  private readonly configuration:
    GenesisConversationRuntimeConfiguration;

  private readonly persistence:
    FileGenesisConversationAcquisitionPersistenceStore;

  private readonly repository:
    string;

  private readonly now:
    () => number;


  constructor(
    options:
      GenesisConversationAcquisitionExecutorOptions,
  ) {
    this.configuration =
      options.configuration;

    this.persistence =
      options.persistence;

    this.repository =
      options.repository;

    this.now =
      options.now ??
      (() =>
        Date.now());
  }


  async execute():
    Promise<
      GenesisConversationAcquisitionExecutionResult
    > {
    const attemptedAt =
      this.now();

    if (
      !Number.isFinite(
        attemptedAt,
      ) ||
      attemptedAt <
        0
    ) {
      throw new Error(
        "genesis_conversation_acquisition_runtime_clock_invalid",
      );
    }

    const adapter =
      this.configuration
        .adapter;

    if (
      this.configuration.state !==
        "CONFIGURED" ||
      !adapter
    ) {
      const failure:
        GenesisConversationAcquisitionFailure = {
          state:
            "FAILED",

          attemptedAt,

          failedAt:
            attemptedAt,

          error:
            this.configuration.blocker ??
            "genesis_conversation_acquisition_not_configured",
        };

      this.persistence.saveFailure(
        failure,
      );

      return {
        state:
          "FAILED",

        failure,
      };
    }

    const scope:
      GenesisReplayScope = {
        mode:
          "partial",

        repository:
          this.repository,

        includedEvidenceTypes: [
          "conversation",
        ],

        excludedEvidenceTypes:
          [],

        explicitlyExcludedSourceIds:
          [],

        governancePolicyVersion:
          "genesis-conversation-acquisition:v1",

        replayContractVersion:
          "1.0",
      };

    try {
      const discovery =
        await adapter.discover(
          scope,
        );

      const snapshot =
        adapter.acquisitionSnapshot();

      if (
        !snapshot
      ) {
        const acquisitionFailure =
          discovery.errors.find(
            (
              error,
            ) =>
              error.code ===
                "SOURCE_UNAVAILABLE" ||
              error.code ===
                "DISCOVERY_FAILED",
          );

        if (
          acquisitionFailure
        ) {
          throw new Error(
            acquisitionFailure.cause ??
            acquisitionFailure.message,
          );
        }

        throw new Error(
          "genesis_conversation_acquisition_snapshot_missing",
        );
      }

      const evidence =
        adapter.listAcquiredEvidence();

      if (
        discovery.sources.length !==
        evidence.length
      ) {
        throw new Error(
          "genesis_conversation_acquisition_evidence_source_count_mismatch",
        );
      }

      for (
        const source
        of discovery.sources
      ) {
        const item =
          adapter.evidenceForHistoricalSource(
            source.historicalSourceId,
          );

        if (
          !item
        ) {
          throw new Error(
            "genesis_conversation_acquisition_evidence_missing",
          );
        }
      }

      const completedAt =
        this.now();

      if (
        !Number.isFinite(
          completedAt,
        ) ||
        completedAt <
          attemptedAt
      ) {
        throw new Error(
          "genesis_conversation_acquisition_completion_clock_invalid",
        );
      }

      const record:
        GenesisConversationAcquisitionRecord = {
          acquisitionId:
            snapshot.acquisitionId,

          state:
            "ACQUIRED",

          sourceId:
            adapter.id,

          firstAcquiredAt:
            snapshot.acquiredAt,

          lastAcquiredAt:
            snapshot.acquiredAt,

          completedAt,

          occurrenceCount:
            1,

          occurrences: [
            {
              acquiredAt:
                snapshot.acquiredAt,

              completedAt,
            },
          ],

          conversationIds:
            snapshot.conversations
              .map(
                conversation =>
                  conversation.conversationId,
              )
              .sort(),

          gaps: [
            ...snapshot.gaps,
          ],

          conversationCount:
            snapshot.conversations.length,

          historicalSourceCount:
            discovery.sources.length,

          evidenceCount:
            evidence.length,

          errors: [
            ...discovery.errors,
          ],

          historicalSources: [
            ...discovery.sources,
          ],

          evidence: [
            ...evidence,
          ],
        };

      const persisted =
        this.persistence
          .saveAcquired(
            record,
          );

      return {
        state:
          "ACQUIRED",

        record:
          persisted,
      };
    } catch (
      error
    ) {
      const failedAt =
        this.now();

      const failure:
        GenesisConversationAcquisitionFailure = {
          state:
            "FAILED",

          attemptedAt,

          failedAt,

          error:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        };

      this.persistence.saveFailure(
        failure,
      );

      return {
        state:
          "FAILED",

        failure,
      };
    }
  }


  latest():
    GenesisConversationAcquisitionLatestState |
    null {
    return this.persistence
      .loadLatest();
  }
}
