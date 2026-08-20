import {
  createRuntimeDraft,
  getRuntimeDraft,
  applyRuntimeDraft,
  RuntimeDraftPatch,
  RuntimeDraft,
  RuntimeCreateDraftResponse,
  RuntimeApplyDraftResponse,
} from "@/services/runtime/drafts";

import {
  listRuntimeFiles,
  readRuntimeFile,
  writeRuntimeFile,
  RuntimeFileListResponse,
  RuntimeFileReadResponse,
  RuntimeFileWriteResponse,
} from "@/services/runtime/filesystem";

import { connectRuntimeEvents } from "@/services/runtime/events";
import { getRuntimeMetrics, RuntimeMetricsResponse } from "@/services/runtime/metrics";
import { getRuntimeStatus, getRuntime, startRuntime, stopRuntime, restartRuntime } from "@/services/runtime/lifecycle";
import {
  markRuntimeManuallyStopped,
  clearRuntimeManuallyStopped,
  isRuntimeManuallyStopped,
} from "@/services/runtime/manualStop";

import { RUNTIME_API, getRuntimeCallerHeaders } from "@/services/runtime/client";

export {
  getRuntimeMetrics,
  type RuntimeMetricsResponse,
} from "@/services/runtime/metrics";

export {
  connectRuntimeEvents,
} from "@/services/runtime/events";

export {
  listRuntimeFiles,
  readRuntimeFile,
  writeRuntimeFile,
  type RuntimeFileListResponse,
  type RuntimeFileReadResponse,
  type RuntimeFileWriteResponse,
} from "@/services/runtime/filesystem";


export {
  createRuntimeDraft,
  getRuntimeDraft,
  applyRuntimeDraft,
  type RuntimeDraftPatch,
  type RuntimeDraft,
  type RuntimeCreateDraftResponse,
  type RuntimeApplyDraftResponse,
} from "@/services/runtime/drafts";

export {
  getRuntimeStatus,
  getRuntime,
  startRuntime,
  stopRuntime,
  restartRuntime,
} from "@/services/runtime/lifecycle";

export {
  getGenesisReplayStatus,
  listGenesisReplays,
  GenesisReplayReadApiError,
  assertGenesisReplayId,
  createGenesisReplayReadClient,
  createGenesisReplayReadStateAdapter,
  createGenesisReplayReadViewModel,
  createGenesisReplayReadController,
  genesisReplayReadController,
  createGenesisReplayReactAdapter,
  genesisReplayReactAdapter,
  useGenesisReplayRead,
  getGenesisOperationalProjection,
  genesisOperationalReadClient,
  genesisOperationalReadState,
  createGenesisOperationalReadClient,
  createGenesisOperationalReadStateAdapter,
  type GenesisReplayReactActions,
  type GenesisReplayReactAdapter,
  type GenesisReplayReactBinding,
  type GenesisReplayReactStore,
  type GenesisConversationSourceSupportClassification,
  type GenesisOperationalChronologySummary,
  type GenesisOperationalConversationSourceSummary,
  type GenesisOperationalCorpusSummary,
  type GenesisOperationalDocumentationGovernanceSummary,
  type GenesisOperationalKnowledgeLifecycleSummary,
  type GenesisOperationalProjection,
  type GenesisOperationalProjectionId,
  type GenesisOperationalReadClient,
  type GenesisOperationalReadClientOptions,
  type GenesisOperationalReadState,
  type GenesisOperationalReadStateAdapter,
  type GenesisOperationalReadStateError,
  type GenesisOperationalReadinessSummary,
  type GenesisOperationalSuccessResponse,
  type GenesisReadinessDimensionState,
  type GenesisReadinessOverall,
  type GenesisReplayReadController,
  type GenesisReplayReadControllerListener,
  type GenesisReplayErrorViewModel,
  type GenesisReplayInventoryRowViewModel,
  type GenesisReplayLifecycleLabel,
  type GenesisReplayLinkageHealth,
  type GenesisReplayLinkageViewModel,
  type GenesisReplayProgressViewModel,
  type GenesisReplayReadViewModel,
  type GenesisReplayRecoveryViewModel,
  type GenesisReplaySelectedViewModel,
  type GenesisReplayViewTone,
  type GenesisReplayReadState,
  type GenesisReplayReadStateAdapter,
  type GenesisReplayReadStateError,
  type GenesisReplayReadStateErrorScope,
  type GenesisCorpusCompletionStatus,
  type GenesisManifestReadiness,
  type GenesisReplayAdmissionLink,
  type GenesisReplayCheckpoint,
  type GenesisReplayExecutionStatus,
  type GenesisReplayId,
  type GenesisReplayInventory,
  type GenesisReplayProgress,
  type GenesisReplayReadClient,
  type GenesisReplayReadClientOptions,
  type GenesisReplayRecoveryEligibility,
  type GenesisReplayRecoveryEligibilityReason,
  type GenesisReplayRunnerFailure,
  type GenesisReplayRunnerOutcome,
  type GenesisReplayStatusSnapshot,
} from "@/services/runtime/genesisReplayRead";

export interface RuntimeProject {
  projectId: string;
  path: string;
  hasPackageJson: boolean;

  framework?: string;

  sourceUrl?: string;
  repoOwner?: string;
  repoName?: string;

  ownerId?: string;
  teamId?: string;
  createdBy?: string;
}

export interface RuntimeSession {
  projectId: string;
  framework?: string;
  port?: number;
  pid?: number;
  startedAt?: number;
  url: string;
  status?: string;
  logs?: string[];
}

export type RuntimeEvent =
  | {
      type: "runtime:log";
      projectId: string;
      line: string;
      timestamp: number;
    }
  | {
      type: "runtime:state";
      projectId: string;
      status: string;
      timestamp: number;
    }
  | {
      type: "runtime:error";
      projectId: string;
      error: string;
      timestamp: number;
    }
  | {
      type: "runtime:file-changed";
      projectId: string;
      file: string;
      sha256?: string;
      timestamp: number;
    };
export async function listRuntimeProjects(): Promise<RuntimeProject[]> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/projects`,
    {
      headers: getRuntimeCallerHeaders(),
    },
  );
  const data = await response.json();

  if (!response.ok || !data?.ok || !Array.isArray(data.projects)) {
    throw new Error(data?.error ?? "failed_to_list_runtime_projects");
  }

  return data.projects as RuntimeProject[];
}

export interface RuntimeImportResult {
  ok: true;
  action: "cloned" | "pulled";
  projectId: string;
  projectPath: string;
  framework?: string;
  repo?: {
    repoUrl: string;
    owner: string;
    repo: string;
  };
}

export async function importRuntimeProject(input: {
  repoUrl: string;
  projectId?: string;
}): Promise<RuntimeImportResult> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/projects/import`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(input),
    },
  );

  const data = await response.json();

  if (!response.ok || !data?.ok || !data?.import?.projectId) {
    throw new Error(data?.error ?? "failed_to_import_runtime_project");
  }

  return data.import as RuntimeImportResult;
}

export async function syncRuntimeProjectMetadata(input: {
  projectId: string;
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
  visibility?: "private" | "team" | "support";
}): Promise<void> {
  const response = await fetch(`${RUNTIME_API}/api/runtime/projects/metadata`, {
    method: "POST",
    headers: getRuntimeCallerHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? "failed_to_sync_runtime_project_metadata");
  }
}
export async function deleteRuntimeProject(
  projectId: string,
): Promise<void> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/projects/${encodeURIComponent(
        projectId,
      )}`,
      {
        method: "DELETE",
        headers: getRuntimeCallerHeaders(),
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "failed_to_delete_project",
    );
  }
}
export async function getRuntimeLogs(
  projectId: string,
) {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/logs?projectId=${encodeURIComponent(projectId)}`,
      {
        headers: getRuntimeCallerHeaders(),
      },
    );

  if (!response.ok) {
    return [];
  }

  const data =
    await response.json();

  return Array.isArray(
    data?.logs,
  )
    ? data.logs
    : [];
}

export async function getActiveRuntime(): Promise<RuntimeSession | null> {
  const projectId =
    localStorage.getItem(
      "lumina:last-runtime-project",
    );

  if (!projectId) {
    return null;
  }

  return getRuntimeStatus(
    projectId,
  );
}
