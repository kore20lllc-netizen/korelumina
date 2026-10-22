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
  genesisOperationalReadController,
  genesisOperationalReactAdapter,
  createGenesisOperationalReadController,
  createGenesisOperationalReactAdapter,
  useGenesisOperationalRead,
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
  type GenesisOperationalReadController,
  type GenesisOperationalReadControllerListener,
  type GenesisOperationalReadSnapshot,
  type GenesisOperationalReactActions,
  type GenesisOperationalReactAdapter,
  type GenesisOperationalReactBinding,
  type GenesisOperationalReactStore,
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

  /* MS-2026-0013: where Runtime says the project came from. */
  origin?:
    | { kind: "git"; provider: string; host: string; source: string; importedAt?: number; recorded: boolean }
    | { kind: "archive"; source: string; importedAt: number; recorded: true }
    | { kind: "built"; createdAt: number; recorded: true }
    | { kind: "unknown"; recorded: false };

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
  action: "cloned" | "pulled" | "unpacked";
  projectId: string;
  projectPath: string;
  framework?: string;
  repo?: {
    repoUrl: string;
    owner: string;
    repo: string;
  };
}

/* MS-2026-0013: what each import refusal means, for the person importing. */
const IMPORT_ERRORS: Record<string, string> = {
  missing_repoUrl: "Enter the repository's URL.",
  invalid_repoUrl: "That is not a valid URL.",
  ssh_urls_not_supported_use_https: "Use the repository's HTTPS URL, not its SSH address.",
  only_https_repo_urls_supported: "Use the repository's HTTPS URL.",
  credentials_in_url_not_allowed_use_access_token: "Remove the credentials from the URL and put the token in the access token field.",
  repository_host_not_allowed: "Repositories on this machine's own network cannot be imported.",
  repository_url_must_name_owner_and_repository: "The URL must name the owner and the repository.",
  repository_url_must_name_group_and_repository: "The URL must name the group and the repository.",
  azure_devops_url_must_include__git_and_repository: "Use the repository URL, which contains /_git/ and the repository name.",
  azure_devops_url_must_name_organization_and_project: "The URL must name the organization and the project.",
  repository_url_must_name_a_repository: "The URL must name a repository.",
  repository_not_found_or_private_add_access_token: "Repository not found. If it is private, add an access token.",
  repository_access_denied_check_url_or_token: "Access denied. Check the URL and that the token can read this repository.",
  repository_not_found_or_private: "Repository not found, or it is private.",
  repository_host_unreachable: "The repository's host could not be reached.",
  repository_clone_timed_out: "The repository took too long to download.",
  local_copy_has_diverged_from_remote: "The imported copy has changes the repository does not; it was not updated.",
  target_project_folder_exists_and_is_not_git_repo: "A project with this name already exists and is not from git.",
  git_not_installed: "git is not installed where Runtime runs.",
  missing_archive_name: "The archive has no file name.",
  archive_type_not_supported_use_zip_or_tar_gz: "Upload a .zip, .tar.gz or .tgz file.",
  archive_larger_than_50_mb: "The archive is larger than 50 MB.",
  archive_is_empty: "The archive has no files in it.",
  project_already_exists_choose_another_name: "A project with this name already exists. Rename the file and upload it again.",
  archive_entry_path_absolute: "The archive contains a file with an absolute path, so it was refused.",
  archive_entry_path_escapes: "The archive contains a file that would land outside the project, so it was refused.",
  archive_entry_name_invalid: "The archive contains an invalid file name.",
  archive_contains_symbolic_link: "The archive contains a symbolic link, which is not accepted.",
  archive_contains_hard_link: "The archive contains a hard link, which is not accepted.",
  archive_contains_special_file: "The archive contains a device or special file, which is not accepted.",
  archive_has_too_many_entries: "The archive has more than 100,000 entries.",
  archive_too_large_when_unpacked: "The archive is larger than 1 GB once unpacked.",
  archive_entry_expands_too_much: "A file in the archive expands far more than real files do, so it was refused.",
  archive_has_duplicate_entries: "The archive has two files with the same name (ignoring capitals).",
  archive_has_conflicting_entries: "The archive has a file and a folder with the same name.",
  zip_not_readable: "The .zip file could not be read.",
  zip64_not_supported: "Very large (zip64) archives are not supported yet.",
  zip_entry_encrypted: "The .zip is password-protected. Upload it without a password.",
  zip_compression_method_not_supported: "The .zip uses a compression method that is not supported.",
  zip_entry_size_mismatch: "The .zip file is damaged.",
  zip_entry_corrupt: "The .zip file is damaged.",
  tar_gz_not_readable: "The .tar.gz file could not be read.",
  tar_not_readable: "The .tar.gz file is damaged.",
  tar_entry_too_large: "A file in the .tar.gz is too large.",
  project_belongs_to_someone_else: "A project with this name already belongs to someone else.",
  not_project_owner: "Only the project's owner can change it.",
  owner_cannot_be_transferred: "A project's owner cannot be changed here.",
  owner_must_be_the_caller: "You can only claim a project for yourself.",
  sign_in_required: "Sign in to import a project.",
};

export async function importRuntimeProject(input: {
  repoUrl: string;
  projectId?: string;
  /* Used for this import only; Runtime never stores it. */
  accessToken?: string;
  accessUsername?: string;
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
    const code = data?.error ?? "failed_to_import_runtime_project";
    throw new Error(IMPORT_ERRORS[code] ?? code);
  }

  return data.import as RuntimeImportResult;
}

/* MS-2026-0013: upload a .zip, .tar.gz or .tgz; Runtime unpacks it safely. */
export async function importRuntimeArchive(file: File): Promise<RuntimeImportResult> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/projects/import-archive?name=${encodeURIComponent(file.name)}`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/octet-stream",
      }),
      body: file,
    },
  );

  if (response.status === 413) {
    throw new Error(IMPORT_ERRORS.archive_larger_than_50_mb);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok || !data?.import?.projectId) {
    const code = data?.error ?? "failed_to_import_archive";
    throw new Error(IMPORT_ERRORS[code] ?? code);
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
    const code = data?.error ?? "failed_to_sync_runtime_project_metadata";
    throw new Error(IMPORT_ERRORS[code] ?? code);
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
