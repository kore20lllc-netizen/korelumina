import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getRuntimeDataRoot } from "../projects/workspacePaths.js";
import { isNodeTestProcess, isolatedTestStorageRoot } from "../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

import type { RepositoryIntelligenceManifest } from "./RepositoryIntelligenceManifest.js";

/*
 * MS-2026-0012: manifests per project, one file per distinct snapshot,
 * so history shows how a repository changed between audits. Re-analyzing
 * an unchanged repository rewrites the same file.
 */

const PROJECT_ID = /^[a-zA-Z0-9._-]{1,128}$/;

export class FileRepositoryIntelligenceStore {
  readonly storageRoot: string;

  constructor(options: { storageRoot?: string } = {}) {
    this.storageRoot = path.resolve(
      options.storageRoot ??
        (isNodeTestProcess()
          ? isolatedTestStorageRoot("repository-intelligence")
          : path.join(getRuntimeDataRoot(), "repository-intelligence")),
    );
  }

  private manifestsDirectory(projectId: string): string {
    if (!PROJECT_ID.test(projectId) || projectId === "." || projectId === "..") {
      throw new Error("repository_intelligence_invalid_project_id");
    }
    return path.join(this.storageRoot, projectId, "manifests");
  }

  saveManifest(manifest: RepositoryIntelligenceManifest): void {
    const directory = this.manifestsDirectory(manifest.projectId);
    mkdirSync(directory, { recursive: true });
    const file = path.join(directory, `${manifest.manifestId.split(":")[1]}.json`);
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
    renameSync(temporary, file);
  }

  /* Newest first. */
  listManifests(projectId: string): RepositoryIntelligenceManifest[] {
    let files: string[];
    try {
      files = readdirSync(this.manifestsDirectory(projectId)).filter((file) => file.endsWith(".json"));
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") return [];
      throw error;
    }
    return files
      .map((file) => JSON.parse(readFileSync(path.join(this.manifestsDirectory(projectId), file), "utf8")) as RepositoryIntelligenceManifest)
      .sort((left, right) => right.analyzedAt - left.analyzedAt || (left.manifestId < right.manifestId ? -1 : 1));
  }

  latestManifest(projectId: string): RepositoryIntelligenceManifest | null {
    return this.listManifests(projectId)[0] ?? null;
  }
}
