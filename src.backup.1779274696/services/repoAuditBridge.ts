import { runAudit, type RepairPlan } from "@/services/auditEngine";
import { projectRepository } from "@/services/projectRepository";
import type { ImportedRepo } from "@/providers/types";
import { AppError } from "@/lib/errors";

/**
 * Build an ImportedRepo-shape from a stored project and run the deterministic
 * audit engine over it. Used to integrate the engine with any project whose
 * file map is in projectRepository (imports, transforms, AI drafts).
 */
export function auditStoredProject(projectId: string): RepairPlan {
  const p = projectRepository.get(projectId);
  if (!p) throw new AppError("NOT_FOUND", "Project not found.");
  const files = p.files ?? {};
  let deps: Record<string, string> = {};
  try {
    if (files["package.json"]) {
      const pkg = JSON.parse(files["package.json"]) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    }
  } catch { /* malformed package.json — leave deps empty so the audit flags it */ }
  const repo: ImportedRepo = {
    id: p.id, source: "template", name: p.name, framework: "react",
    files, dependencies: deps, complexity: "low",
    summary: p.description ?? "", importedAt: p.createdAt,
  };
  return runAudit(repo);
}