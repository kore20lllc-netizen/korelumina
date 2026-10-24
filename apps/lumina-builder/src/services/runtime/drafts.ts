import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

/*
 * Runtime calls a draft's id "draftId"; this client read "id" and so
 * rejected every draft as failed. Drafts are now normalized on arrival and
 * keep both names (MS-2026-0011).
 */

export interface RuntimeDraftPatch {
  type: "replace-text" | "create-file" | "delete-file";
  file: string;
  content?: string;
  find?: string;
  replace?: string;
  diffPreview?: string;
}

export interface RuntimeDraft {
  id: string;
  draftId: string;
  projectId: string;
  status: "draft" | "applied" | "reverted";
  patches: RuntimeDraftPatch[];
  createdAt: number;
  appliedAt?: number;
  revertedAt?: number;
}

export interface RuntimeDraftFocus {
  file: string;
  startLine?: number;
  endLine?: number;
}

export interface RuntimeCreateDraftResponse {
  ok: boolean;
  mode?: string;
  provider?: string;
  model?: string;
  note?: string;
  summary?: string;
  rejected?: string[];
  prompt?: string;
  draft: RuntimeDraft;
  plan?: unknown;
  report?: unknown;
  error?: string;
}

export interface RuntimeApplyDraftResponse {
  ok: boolean;
  draftId: string;
  projectId: string;
  result?: {
    applied: number;
    skipped: number;
    files: string[];
    errors: string[];
    snapshots: number;
  };
  beforeScore?: number;
  afterScore?: number;
  improvedBy?: number;
  report?: unknown;
  error?: string;
}

export interface RuntimeRevertDraftResponse {
  ok: boolean;
  draftId: string;
  projectId: string;
  result?: {
    reverted: number;
    skipped: number;
    files: string[];
    errors: string[];
  };
  error?: string;
}

export interface RuntimeAIStatus {
  provider: "anthropic" | "openai" | "rule-based" | null;
  ready: boolean;
  model: string | null;
  problem: string | null;
}

/** A refusal from Runtime, with the per-file reasons when it gives them. */
export class RuntimeDraftError extends Error {
  constructor(
    message: string,
    readonly reasons: string[] = [],
  ) {
    super(message);
  }
}

function normalizeDraft(raw: unknown): RuntimeDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const draft = raw as Partial<RuntimeDraft>;
  const id = draft.draftId ?? draft.id;
  if (!id) return null;
  return {
    ...(draft as RuntimeDraft),
    id,
    draftId: id,
    patches: Array.isArray(draft.patches) ? draft.patches : [],
  };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function refusal(data: Record<string, unknown>, fallback: string): RuntimeDraftError {
  const reasons = Array.isArray(data.errors) ? data.errors.map(String) : [];
  return new RuntimeDraftError(typeof data.error === "string" ? data.error : fallback, reasons);
}

export async function createRuntimeDraft(input: {
  projectId: string;
  prompt: string;
  focus?: RuntimeDraftFocus;
}): Promise<RuntimeCreateDraftResponse> {
  const response = await fetch(`${RUNTIME_API}/api/runtime/drafts/create`, {
    method: "POST",
    headers: getRuntimeCallerHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  const data = await readJson(response);
  const draft = normalizeDraft(data.draft);

  if (!response.ok || !data.ok || !draft) {
    throw refusal(data, "failed_to_create_runtime_draft");
  }

  return { ...(data as unknown as RuntimeCreateDraftResponse), draft };
}

export async function getRuntimeDraft(
  draftId: string,
): Promise<RuntimeDraft> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/drafts/${encodeURIComponent(draftId)}`,
    {
      headers: getRuntimeCallerHeaders(),
    },
  );

  const data = await readJson(response);
  const draft = normalizeDraft(data.draft);

  if (!response.ok || !data.ok || !draft) {
    throw refusal(data, "failed_to_get_runtime_draft");
  }

  return draft;
}

export async function applyRuntimeDraft(
  draftId: string,
): Promise<RuntimeApplyDraftResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/apply-draft`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ draftId }),
    },
  );

  const data = await readJson(response);

  if (!response.ok || !data.ok) {
    throw refusal(data, "failed_to_apply_runtime_draft");
  }

  return data as unknown as RuntimeApplyDraftResponse;
}

export async function revertRuntimeDraft(
  draftId: string,
): Promise<RuntimeRevertDraftResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/revert-draft`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ draftId }),
    },
  );

  const data = await readJson(response);

  if (!response.ok || !data.ok) {
    throw refusal(data, "failed_to_revert_runtime_draft");
  }

  return data as unknown as RuntimeRevertDraftResponse;
}

export async function getRuntimeAIStatus(): Promise<RuntimeAIStatus> {
  const response = await fetch(`${RUNTIME_API}/api/runtime/ai/status`, {
    headers: getRuntimeCallerHeaders(),
  });
  const data = await readJson(response);
  if (!response.ok || !data.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "ai_status_unavailable");
  }
  return {
    provider: (data.provider as RuntimeAIStatus["provider"]) ?? null,
    ready: Boolean(data.ready),
    model: typeof data.model === "string" ? data.model : null,
    problem: typeof data.problem === "string" ? data.problem : null,
  };
}
