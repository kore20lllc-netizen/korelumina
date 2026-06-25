import type {
  Project,
  RuntimeStatus,
  PreviewResponse,
  ImportResponse,
  FileReadResponse,
  DraftResponse,
} from "@/types/api";
import { auth } from "@/providers/auth-registry";
import { usage } from "@/providers/usage-registry";
import {
  applyRuntimeDraft,
  createRuntimeDraft,
  importRuntimeProject,
  readRuntimeFile,
  syncRuntimeProjectMetadata,
  writeRuntimeFile,
} from "@/services/runtimeService";
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

export async function importRepo(repoUrl: string, signal?: AbortSignal): Promise<ImportResponse> {
  try {
    requireEntitlement("project.create");

    if (signal?.aborted) {
      throw new AppError("INTERNAL", "Canceled.");
    }

    const imported = await importRuntimeProject({
      repoUrl,
    });

    const name =
      imported.repo?.repo ??
      imported.projectId;

    const u = auth.getUser();

    if (u) {
      usage.recordProjectCreated(u.id);
    }

    await syncRuntimeProjectMetadata({
      projectId: imported.projectId,
      ownerId: u?.id,
      teamId: getActiveTeamId() ?? undefined,
      createdBy: u?.id,
      visibility: getActiveTeamId() ? "team" : "private",
    });

    notificationService.push({
      title: "Import completed",
      body: `${name} (${imported.framework ?? "unknown"}) is ready.`,
      kind: "success",
    });

    return {
      projectId: imported.projectId,
      name,
      framework: imported.framework ?? "unknown",
    };
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function importZip(_file: File, _signal?: AbortSignal): Promise<ImportResponse> {
  throw new AppError(
    "VALIDATION",
    "ZIP import requires a runtime-backed ZIP import endpoint.",
  );
}

export async function readFile(projectId: string, file: string): Promise<FileReadResponse> {
  try {
    const runtimeFile = await readRuntimeFile(projectId, file);

    return {
      path: runtimeFile.file,
      content: runtimeFile.content,
    };
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function writeFile(projectId: string, file: string, content: string): Promise<{ ok: true }> {
  try {
    await writeRuntimeFile(projectId, file, content);
    return { ok: true };
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function generateDraft(
  projectId: string,
  prompt: string,
  opts: { onEvent?: (e: BuildStepEvent) => void; signal?: AbortSignal } = {},
): Promise<DraftResponse> {
  try {
    requireEntitlement("ai.execute");

    if (opts.signal?.aborted) {
      throw new AppError("INTERNAL", "Canceled.");
    }

    if (!prompt.trim()) {
      throw new AppError("VALIDATION", "Prompt cannot be empty.");
    }

    opts.onEvent?.({
      id: "runtime-draft-create",
      label: "Creating runtime draft",
      status: "running",
      at: Date.now(),
    });

    const runtimeDraft = await createRuntimeDraft({
      projectId,
      prompt,
    });

    opts.onEvent?.({
      id: "runtime-draft-create",
      label: "Runtime draft ready",
      status: "done",
      at: Date.now(),
    });

    const u = auth.getUser();
    if (u) usage.recordAIExecution(u.id);

    const files =
      runtimeDraft.draft.patches.map((patch) => ({
        path: patch.file,
        content:
          patch.content ??
          patch.replace ??
          patch.diffPreview ??
          "",
      }));

    return {
      draftId: runtimeDraft.draft.id,
      files,
      summary:
        runtimeDraft.note ??
        `Runtime draft created with ${runtimeDraft.draft.patches.length} patch${runtimeDraft.draft.patches.length === 1 ? "" : "es"}.`,
    };
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function applyDraft(_projectId: string, draftId?: string): Promise<{ ok: true }> {
  if (!draftId) {
    throw new AppError("VALIDATION", "Missing draft id.");
  }

  await applyRuntimeDraft(draftId);

  return { ok: true };
}