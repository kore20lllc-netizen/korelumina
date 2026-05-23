import type {
  Project,
  RuntimeStatus,
  PreviewResponse,
  ImportResponse,
  FileReadResponse,
  DraftResponse,
} from "@/types/api";
import { ai, repo as repoProvider } from "@/providers/api-temp";
import { auth } from "@/providers/auth-registry";
import { usage } from "@/providers/usage-registry";
import { projectRepository } from "@/services/projectRepository";
import { notificationService } from "@/services/notificationService";
import { requireEntitlement } from "@/services/entitlements";
import { AppError, normalizeError } from "@/lib/errors";
import type { BuildStepEvent } from "@/providers/types";
import { getActiveTeamId } from "@/context/ActiveTeamContext";

/**
 * Wrap an async producer with bounded retry + exponential backoff.
 * VALIDATION + ENTITLEMENT_DENIED never retry (user error).
 */
async function withRetry<T>(fn: () => Promise<T>, opts: { retries?: number; signal?: AbortSignal } = {}): Promise<T> {
  const max = opts.retries ?? 2;
  let lastErr: unknown;
  for (let i = 0; i <= max; i++) {
    if (opts.signal?.aborted) throw new AppError("INTERNAL", "Canceled.");
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const err = normalizeError(e);
      if (err.code === "VALIDATION" || err.code === "ENTITLEMENT_DENIED" || err.code === "AUTH_INVALID_CREDENTIALS") throw err;
      if (i === max) break;
      await new Promise((r) => setTimeout(r, 250 * Math.pow(2, i)));
    }
  }
  throw normalizeError(lastErr);
}

/**
 * API surface for the app. Routes through provider interfaces so swapping
 * a Mock for a real Supabase/GitHub/Vercel adapter is a one-line change in
 * providers/registry.ts. All errors are normalized to AppError.
 */

export async function fetchProjects(): Promise<Project[]> {
  return projectRepository.list().map((p) => ({
    id: p.id, name: p.name, type: p.type, lastEdited: p.lastEdited,
    status: p.status, accent: p.accent, previewUrl: p.previewUrl,
  }));
}

export async function startRuntime(projectId: string): Promise<RuntimeStatus> {
  await new Promise((r) => setTimeout(r, 250));
  const p = projectRepository.get(projectId);
  if (!p) return { ready: false, state: "error", message: "Project not found." };
  projectRepository.update(projectId, { runtime: "warm" });
  return { ready: true, state: "running", url: p.previewUrl ?? `https://preview.lumina.app/${projectId}` };
}

export async function getRuntime(projectId?: string): Promise<RuntimeStatus> {
  if (!projectId) return { ready: false, state: "idle" };
  const p = projectRepository.get(projectId);
  if (!p) return { ready: false, state: "idle" };
  return { ready: p.runtime !== "cold", state: p.runtime === "live" ? "running" : p.runtime === "warm" ? "running" : "idle", url: p.previewUrl };
}

export async function getPreview(projectId: string): Promise<PreviewResponse> {
  const p = projectRepository.get(projectId);
  return { url: p?.previewUrl ?? `https://preview.lumina.app/${projectId}` };
}

export async function importRepo(repoUrl: string, signal?: AbortSignal): Promise<ImportResponse> {
  try {
    requireEntitlement("project.create");
    const r = await withRetry(() => repoProvider.importFromGithub(repoUrl), { signal });
    const project = projectRepository.create(
      { name: r.name, type: "import", status: "draft", accent: "violet", files: r.files, description: r.summary },
      { ownerId: auth.getUser()?.id, teamId: getActiveTeamId() ?? undefined },
    );
    const u = auth.getUser(); if (u) usage.recordProjectCreated(u.id);
    notificationService.push({ title: "Import completed", body: `${r.name} (${r.framework}) is ready.`, kind: "success" });
    return { projectId: project.id, name: r.name, framework: r.framework };
  } catch (e) { throw normalizeError(e); }
}

export async function importZip(file: File, signal?: AbortSignal): Promise<ImportResponse> {
  try {
    requireEntitlement("project.create");
    const r = await withRetry(() => repoProvider.importFromZip(file), { signal });
    const project = projectRepository.create(
      { name: r.name, type: "import", status: "draft", accent: "violet", files: r.files, description: r.summary },
      { ownerId: auth.getUser()?.id, teamId: getActiveTeamId() ?? undefined },
    );
    const u = auth.getUser(); if (u) usage.recordProjectCreated(u.id);
    notificationService.push({ title: "Import completed", body: `${r.name} (${r.framework}) is ready.`, kind: "success" });
    return { projectId: project.id, name: r.name, framework: r.framework };
  } catch (e) { throw normalizeError(e); }
}

export async function readFile(projectId: string, file: string): Promise<FileReadResponse> {
  const p = projectRepository.get(projectId);
  if (!p) throw new AppError("NOT_FOUND", "Project not found.");
  return { path: file, content: p.files?.[file] ?? "" };
}

export async function writeFile(projectId: string, file: string, content: string): Promise<{ ok: true }> {
  const p = projectRepository.get(projectId);
  if (!p) throw new AppError("NOT_FOUND", "Project not found.");
  projectRepository.saveFiles(projectId, { ...(p.files ?? {}), [file]: content });
  return { ok: true };
}

export async function generateDraft(
  projectId: string,
  prompt: string,
  opts: { onEvent?: (e: BuildStepEvent) => void; signal?: AbortSignal } = {},
): Promise<DraftResponse> {
  try {
    requireEntitlement("ai.execute");
    const draft = await ai.orchestrate({ projectId, prompt, onEvent: opts.onEvent, signal: opts.signal });
    const u = auth.getUser(); if (u) usage.recordAIExecution(u.id);
    return { draftId: draft.id, files: draft.diffs.map((d) => ({ path: d.path, content: d.after })), summary: draft.summary };
  } catch (e) { throw normalizeError(e); }
}

export async function applyDraft(projectId: string, draftId?: string): Promise<{ ok: true }> {
  await ai.applyDraft(projectId, draftId ?? "");
  return { ok: true };
}