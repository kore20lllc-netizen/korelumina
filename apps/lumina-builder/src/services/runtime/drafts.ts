import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

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
  projectId: string;
  status: "draft" | "applied" | "reverted";
  patches: RuntimeDraftPatch[];
  createdAt: number;
  appliedAt?: number;
}

export interface RuntimeCreateDraftResponse {
  ok: boolean;
  mode?: string;
  note?: string;
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

export async function createRuntimeDraft(input: {
  projectId: string;
  prompt: string;
}): Promise<RuntimeCreateDraftResponse> {
  const response = await fetch(`${RUNTIME_API}/api/runtime/drafts/create`, {
    method: "POST",
    headers: getRuntimeCallerHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as RuntimeCreateDraftResponse;

  if (!response.ok || !data.ok || !data.draft?.id) {
    throw new Error(data.error ?? "failed_to_create_runtime_draft");
  }

  return data;
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

  const data = await response.json();

  if (!response.ok || !data?.ok || !data?.draft?.id) {
    throw new Error(data?.error ?? "failed_to_get_runtime_draft");
  }

  return data.draft as RuntimeDraft;
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

  const data = (await response.json()) as RuntimeApplyDraftResponse;

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "failed_to_apply_runtime_draft");
  }

  return data;
}
