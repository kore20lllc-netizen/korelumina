import { useCallback, useEffect, useRef, useState } from "react";

import { usage } from "@/providers/usage-registry";
import { auth } from "@/providers/auth-registry";
import { checkEntitlement } from "@/services/entitlements";
import {
  RuntimeDraftError,
  applyRuntimeDraft,
  createRuntimeDraft,
  getRuntimeAIStatus,
  revertRuntimeDraft,
  type RuntimeAIStatus,
  type RuntimeDraft,
  type RuntimeDraftFocus,
} from "@/services/runtime/drafts";

import { describeRuntimeError } from "../shared/fileTree";
import type { DeveloperFiles } from "./useDeveloperFiles";

/*
 * MS-2026-0011: AI Assist asks Runtime's configured model for a draft of
 * the change, shows exactly what it would do, and writes nothing until
 * the person applies it. Applied drafts can be undone while the files are
 * still as the draft left them.
 */

export type AITurnState = "working" | "ready" | "applying" | "applied" | "reverting" | "reverted" | "discarded" | "failed";

export interface AITurn {
  id: string;
  prompt: string;
  focus: RuntimeDraftFocus | null;
  state: AITurnState;
  startedAt: number;
  provider: string | null;
  model: string | null;
  summary: string | null;
  note: string | null;
  rejected: string[];
  draft: RuntimeDraft | null;
  error: string | null;
  reasons: string[];
}

export type AIStatusState =
  | { status: "loading" }
  | { status: "ok"; data: RuntimeAIStatus }
  | { status: "error"; message: string };

function failure(error: unknown, fallback: string): { error: string; reasons: string[] } {
  if (error instanceof RuntimeDraftError) {
    return { error: describeRuntimeError(error.message), reasons: error.reasons.map(describeRuntimeError) };
  }
  return { error: describeRuntimeError(error instanceof Error ? error.message : fallback), reasons: [] };
}

function changedFiles(draft: RuntimeDraft | null, reported?: string[]): string[] {
  return Array.from(new Set([...(reported ?? []), ...(draft?.patches.map((patch) => patch.file) ?? [])]));
}

export function useAIAssist(files: DeveloperFiles) {
  const [status, setStatus] = useState<AIStatusState>({ status: "loading" });
  const [prompt, setPrompt] = useState("");
  const [useSelection, setUseSelection] = useState(true);
  const [turns, setTurns] = useState<AITurn[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getRuntimeAIStatus()
      .then((data) => !cancelled && setStatus({ status: "ok", data }))
      .catch((error: unknown) =>
        !cancelled && setStatus({ status: "error", message: describeRuntimeError(error instanceof Error ? error.message : "ai_status_unavailable") }),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setTurns([]);
    setPrompt("");
  }, [files.projectId]);

  const update = (id: string, patch: Partial<AITurn>) =>
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)));

  const working = turns.some((turn) => turn.state === "working" || turn.state === "applying" || turn.state === "reverting");
  const entitlement = checkEntitlement("ai.execute");
  const blockedReason =
    !files.projectId
      ? "Open a project first."
      : files.dirtyFiles.length > 0
        ? `Save or revert your edits first (${files.dirtyFiles.length} unsaved file${files.dirtyFiles.length === 1 ? "" : "s"}), so AI changes and yours never overwrite each other.`
        : !entitlement.allowed
          ? entitlement.reason ?? "Your plan does not include more AI requests."
          : status.status === "ok" && !status.data.ready
            ? describeRuntimeError(status.data.problem ?? "ai_not_ready")
            : null;

  const ask = useCallback(async () => {
    const text = prompt.trim();
    if (!text || !files.projectId || working || blockedReason) return;

    const focus: RuntimeDraftFocus | null = files.active
      ? useSelection && files.selection
        ? { file: files.active, startLine: files.selection.startLine, endLine: files.selection.endLine }
        : { file: files.active }
      : null;
    const id = `turn-${++counter.current}`;
    setTurns((current) => [
      ...current,
      {
        id,
        prompt: text,
        focus,
        state: "working",
        startedAt: Date.now(),
        provider: null,
        model: null,
        summary: null,
        note: null,
        rejected: [],
        draft: null,
        error: null,
        reasons: [],
      },
    ]);
    setPrompt("");

    try {
      const result = await createRuntimeDraft({ projectId: files.projectId, prompt: text, focus: focus ?? undefined });
      const user = auth.getUser();
      if (user) usage.recordAIExecution(user.id);
      update(id, {
        state: "ready",
        provider: result.provider ?? null,
        model: result.model ?? null,
        summary: result.summary ?? null,
        note: result.note ?? null,
        rejected: (result.rejected ?? []).map(describeRuntimeError),
        draft: result.draft,
      });
    } catch (error) {
      update(id, { state: "failed", ...failure(error, "failed_to_create_runtime_draft") });
    }
  }, [prompt, files.projectId, files.active, files.selection, useSelection, working, blockedReason]);

  const apply = useCallback(
    async (turn: AITurn) => {
      if (!turn.draft || files.dirtyFiles.length > 0) return;
      update(turn.id, { state: "applying", error: null, reasons: [] });
      try {
        const result = await applyRuntimeDraft(turn.draft.id);
        update(turn.id, { state: "applied" });
        await files.refreshAfterChange(changedFiles(turn.draft, result.result?.files));
      } catch (error) {
        update(turn.id, { state: "ready", ...failure(error, "failed_to_apply_runtime_draft") });
      }
    },
    [files],
  );

  const revert = useCallback(
    async (turn: AITurn) => {
      if (!turn.draft || files.dirtyFiles.length > 0) return;
      update(turn.id, { state: "reverting", error: null, reasons: [] });
      try {
        const result = await revertRuntimeDraft(turn.draft.id);
        update(turn.id, { state: "reverted" });
        await files.refreshAfterChange(changedFiles(turn.draft, result.result?.files));
      } catch (error) {
        update(turn.id, { state: "applied", ...failure(error, "failed_to_revert_runtime_draft") });
      }
    },
    [files],
  );

  const discard = useCallback((turn: AITurn) => update(turn.id, { state: "discarded" }), []);

  return {
    status,
    prompt,
    setPrompt,
    useSelection,
    setUseSelection,
    turns,
    working,
    blockedReason,
    ask,
    apply,
    revert,
    discard,
  };
}

export type AIAssist = ReturnType<typeof useAIAssist>;
