import crypto from "node:crypto";
import type { DraftPatch, DraftSnapshot, FixDraft } from "./types.js";

const drafts = new Map<string, FixDraft>();

export function createDraft(projectId: string, patches: DraftPatch[]): FixDraft {
  const draftId = `draft_${crypto.randomUUID()}`;

  const draft: FixDraft = {
    draftId,
    projectId,
    createdAt: Date.now(),
    patches,
    status: "draft",
  };

  drafts.set(draftId, draft);
  return draft;
}

export function getDraft(draftId: string): FixDraft | undefined {
  return drafts.get(draftId);
}

export function markDraftApplied(
  draftId: string,
  snapshots: DraftSnapshot[],
): FixDraft | undefined {
  const draft = drafts.get(draftId);
  if (!draft) return undefined;

  draft.status = "applied";
  draft.appliedAt = Date.now();
  draft.snapshots = snapshots;
  drafts.set(draftId, draft);

  return draft;
}

export function markDraftReverted(draftId: string): FixDraft | undefined {
  const draft = drafts.get(draftId);
  if (!draft) return undefined;

  draft.status = "reverted";
  draft.revertedAt = Date.now();
  drafts.set(draftId, draft);

  return draft;
}
