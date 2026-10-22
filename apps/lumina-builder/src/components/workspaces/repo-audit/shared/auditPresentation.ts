import type { PreviewTone } from "../../executive/design/executiveDesignPreview";
import type { AuditStage, CategoryScore, FindingCategory, FindingSeverity } from "@/services/repositoryAuditService";

/* MS-2026-0012: how audit values map onto the Knowledge Operations tones. */

export const SEVERITY_TONE: Record<FindingSeverity, PreviewTone> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "active",
  info: "active",
};

export const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export const SEVERITIES: readonly FindingSeverity[] = ["critical", "high", "medium", "low", "info"];

export const CATEGORY_LABEL: Record<FindingCategory, string> = {
  security: "Security",
  build: "Build health",
  dependency: "Dependencies",
  architecture: "Architecture",
  environment: "Environment",
  quality: "Quality",
};

export const STAGE_LABEL: Record<AuditStage, string> = {
  snapshot: "Reading files",
  inventory: "Inventory",
  dependencies: "Dependencies",
  secrets: "Secrets",
  code: "Risky code",
  environment: "Environment",
  architecture: "Architecture",
  advisories: "Advisories",
  build: "Build health",
  report: "Scoring",
};

export function scoreTone(score: number | null): PreviewTone {
  if (score === null) return "active";
  return score >= 90 ? "healthy" : score >= 60 ? "warning" : "error";
}

export function categoryTone(category: CategoryScore): PreviewTone {
  return category.status === "not-checked" ? "active" : scoreTone(category.score);
}

export function relativeTime(at: number | null | undefined): string {
  if (!at) return "never";
  const minutes = Math.round((Date.now() - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
