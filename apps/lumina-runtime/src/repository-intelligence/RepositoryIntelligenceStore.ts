import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getRuntimeDataRoot } from "../projects/workspacePaths.js";
import { isNodeTestProcess, isolatedTestStorageRoot } from "../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

import type { RepositoryIntelligenceManifest } from "./RepositoryIntelligenceManifest.js";
import type { RepositoryAuditReport } from "./RepositoryAudit.js";

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

  private reportsDirectory(projectId: string): string {
    return path.join(path.dirname(this.manifestsDirectory(projectId)), "reports");
  }

  /* Saves the report and its manifest. File names sort by time. */
  saveReport(report: RepositoryAuditReport): void {
    this.saveManifest(report.manifest);
    const directory = this.reportsDirectory(report.projectId);
    mkdirSync(directory, { recursive: true });
    const file = path.join(directory, `${String(report.startedAt).padStart(15, "0")}-${report.reportId.split(":")[1]}.json`);
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(report)}\n`);
    renameSync(temporary, file);
  }

  private reportFiles(projectId: string): string[] {
    try {
      return readdirSync(this.reportsDirectory(projectId)).filter((file) => file.endsWith(".json")).sort().reverse();
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") return [];
      throw error;
    }
  }

  loadReport(projectId: string, reportId: string): RepositoryAuditReport | null {
    const suffix = `-${reportId.replace(/^repository-audit:/, "")}.json`;
    const file = this.reportFiles(projectId).find((name) => name.endsWith(suffix));
    return file ? (JSON.parse(readFileSync(path.join(this.reportsDirectory(projectId), file), "utf8")) as RepositoryAuditReport) : null;
  }

  latestReport(projectId: string): RepositoryAuditReport | null {
    const [file] = this.reportFiles(projectId);
    return file ? (JSON.parse(readFileSync(path.join(this.reportsDirectory(projectId), file), "utf8")) as RepositoryAuditReport) : null;
  }

  /* Newest first, without findings. */
  listReports(projectId: string, limit = 50): Pick<RepositoryAuditReport, "reportId" | "mode" | "startedAt" | "completedAt" | "summary" | "comparison">[] {
    return this.reportFiles(projectId)
      .slice(0, limit)
      .map((file) => {
        const report = JSON.parse(readFileSync(path.join(this.reportsDirectory(projectId), file), "utf8")) as RepositoryAuditReport;
        return { reportId: report.reportId, mode: report.mode, startedAt: report.startedAt, completedAt: report.completedAt, summary: report.summary, comparison: report.comparison };
      });
  }
}
