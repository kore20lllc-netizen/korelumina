import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { resolveProjectPath } from "@korelumina/platform-sdk";

import { detectFramework } from "../detect/detectFramework.js";
import { recordImportKnowledge } from "../knowledge/index.js";
import { setProjectMetadata } from "../projects/projectMetadataStore.js";
import { getProjectsRoot } from "../projects/workspacePaths.js";
import { definedOnly } from "../projects/projectOwnership.js";
import { ArchiveError, archiveKindOf, extractArchive, type ArchiveLimits } from "./ArchiveExtract.js";

/*
 * MS-2026-0013: import a project from an uploaded .zip, .tar.gz or .tgz.
 * It is unpacked into a private staging folder and moved into place only
 * when every entry has been checked and written, so a refused archive
 * leaves nothing behind. An existing project is never overwritten.
 */

export const MAX_ARCHIVE_UPLOAD_BYTES = 50 * 1024 * 1024;

export type ImportedArchive = {
  ok: true;
  action: "unpacked";
  projectId: string;
  projectPath: string;
  framework: ReturnType<typeof detectFramework>;
  files: number;
  bytes: number;
  repo: { repoUrl: string; owner: string; repo: string; provider: "archive"; host: string };
};

function projectIdFrom(value: string): string {
  return value
    .trim()
    .replace(/\.(zip|tar\.gz|tgz)$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase();
}

export async function importArchive(
  input: {
    fileName: unknown;
    data: Buffer;
    projectId?: unknown;
    ownerId?: unknown;
    teamId?: unknown;
    createdBy?: unknown;
    visibility?: unknown;
  },
  limits?: ArchiveLimits,
): Promise<ImportedArchive> {
  const fileName = typeof input.fileName === "string" ? path.basename(input.fileName.trim()) : "";
  if (!fileName) throw new ArchiveError("missing_archive_name");
  const kind = archiveKindOf(fileName);
  if (!kind) throw new ArchiveError("archive_type_not_supported_use_zip_or_tar_gz");
  if (!input.data.length) throw new ArchiveError("archive_is_empty");
  if (input.data.length > MAX_ARCHIVE_UPLOAD_BYTES) throw new ArchiveError("archive_larger_than_50_mb");

  const projectId = projectIdFrom(typeof input.projectId === "string" && input.projectId.trim() ? input.projectId : fileName);
  if (!projectId) throw new ArchiveError("invalid_projectId");
  const projectPath = resolveProjectPath(projectId);
  if (fs.existsSync(projectPath)) throw new ArchiveError("project_already_exists_choose_another_name");

  const projectsRoot = getProjectsRoot();
  fs.mkdirSync(projectsRoot, { recursive: true });
  const staging = path.join(projectsRoot, `.importing-${randomUUID()}`);
  let result;
  try {
    result = extractArchive(kind, input.data, staging, limits);
    if (fs.existsSync(projectPath)) throw new ArchiveError("project_already_exists_choose_another_name");
    fs.renameSync(staging, projectPath);
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true });
    if (error instanceof ArchiveError) throw error;
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EEXIST" || code === "ENOTDIR" || code === "EISDIR") throw new ArchiveError("archive_has_conflicting_entries");
    throw error;
  }

  const framework = detectFramework(projectPath);
  setProjectMetadata({
    projectId,
    ...definedOnly({
      ownerId: typeof input.ownerId === "string" ? input.ownerId : undefined,
      teamId: typeof input.teamId === "string" ? input.teamId : undefined,
      createdBy: typeof input.createdBy === "string" ? input.createdBy : undefined,
    }),
    visibility: input.visibility === "team" || input.visibility === "support" ? input.visibility : "private",
    framework,
    repoName: projectId,
    origin: { kind: "archive", source: fileName, importedAt: Date.now() },
  });

  try {
    await recordImportKnowledge({
      projectId,
      projectPath,
      repositoryId: `archive:${projectId}`,
      repoUrl: `archive:${fileName}`,
      owner: "archive",
      repo: projectId,
      framework,
    });
  } catch (error) {
    console.error("[knowledge] import recording failed", error);
  }

  return {
    ok: true,
    action: "unpacked",
    projectId,
    projectPath,
    framework,
    files: result.files,
    bytes: result.bytes,
    repo: { repoUrl: `archive:${fileName}`, owner: "archive", repo: projectId, provider: "archive", host: "upload" },
  };
}
