import { RUNTIME_API, getRuntimeCallerHeaders } from "@/services/runtime/client";
import { RuntimeDraftError, type RuntimeDraft } from "@/services/runtime/drafts";

/* MS-2026-0011: Transform App -> Website, as Runtime runs it. */

export interface WebsiteAnalysis {
  supported: boolean;
  reason: string | null;
  framework: "next-app" | "next-pages" | "react-router" | null;
  frameworkLabel: string;
  typescript: boolean;
  styling: string[];
  pagesDir: string | null;
  componentsDir: string;
  routerFile: string | null;
  existingRoutes: string[];
  components: string[];
  styleFiles: string[];
  productName: string;
  description: string | null;
}

export interface WebsitePlanPage {
  id: string;
  title: string;
  route: string;
  file: string;
  componentName: string;
  purpose: string;
  sections: string[];
  reuses: string[];
}

export interface WebsitePlan {
  summary: string;
  pages: WebsitePlanPage[];
  rejected: string[];
}

export interface WebsiteBuildStep {
  id: string;
  label: string;
  file: string | null;
  status: "pending" | "running" | "done" | "failed";
  error: string | null;
}

export interface WebsiteBuildJob {
  jobId: string;
  projectId: string;
  status: "running" | "done" | "failed";
  steps: WebsiteBuildStep[];
  draft: (RuntimeDraft & { draftId?: string }) | null;
  error: string | null;
  startedAt: number;
  finishedAt: number | null;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${RUNTIME_API}${path}`, {
    ...init,
    headers: getRuntimeCallerHeaders(init?.body ? { "Content-Type": "application/json" } : undefined),
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }
  if (!response.ok || !data.ok) {
    throw new RuntimeDraftError(
      typeof data.error === "string" ? data.error : "transform_request_failed",
      Array.isArray(data.errors) ? data.errors.map(String) : [],
    );
  }
  return data as T;
}

function withDraftId(job: WebsiteBuildJob): WebsiteBuildJob {
  if (!job.draft) return job;
  const id = job.draft.draftId ?? job.draft.id;
  return { ...job, draft: { ...job.draft, id, draftId: id } };
}

export async function analyzeWebsite(projectId: string) {
  return call<{ analysis: WebsiteAnalysis; ai: { provider: string; model: string | null } | null }>(
    `/api/runtime/transform/analysis?projectId=${encodeURIComponent(projectId)}`,
  );
}

export async function planWebsite(projectId: string) {
  return call<{ analysis: WebsiteAnalysis; plan: WebsitePlan }>("/api/runtime/transform/plan", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export async function startWebsiteBuild(projectId: string, pages: WebsitePlanPage[], summary: string) {
  const data = await call<{ job: WebsiteBuildJob }>("/api/runtime/transform/build", {
    method: "POST",
    body: JSON.stringify({ projectId, pages, summary }),
  });
  return withDraftId(data.job);
}

export async function getWebsiteBuild(jobId: string) {
  const data = await call<{ job: WebsiteBuildJob }>(`/api/runtime/transform/jobs/${encodeURIComponent(jobId)}`);
  return withDraftId(data.job);
}
