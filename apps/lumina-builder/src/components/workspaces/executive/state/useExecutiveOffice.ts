import { useSyncExternalStore } from "react";

import {
  askChiefAgent,
  decideExecutiveApproval,
  getChiefAgentActivationStatus,
  getExecutiveOfficeOperations,
  getKnowledgeOverview,
  getLearningStatus,
  getPendingCanonicalReviews,
  runLearningCycleNow,
  type ChiefAgentActivationStatus,
  type ExecutiveOfficeOperations,
  type KnowledgeOverview,
  type LearningStatus,
  type PendingCanonicalReview,
} from "@/services/executiveOfficeService";

/*
 * EW-1: one shared, real view of the Chief Agent for the Executive Office.
 * Every wired section reads from here. A value that has not been read yet
 * is "loading" and a failed read is "error", never a guessed healthy state.
 * Reads are fast Runtime records (no projections), polled every 30 s and
 * refreshed right after anything the owner does.
 */

export type Loaded<T> =
  | { status: "loading" }
  | { status: "ok"; data: T; stale?: string }
  | { status: "error"; message: string };

export interface PendingQuestion {
  question: string;
  askedAt: number;
}

export interface UnansweredQuestion {
  question: string;
  reason: string;
  askedAt: number;
}

export interface ExecutiveOfficeState {
  operations: Loaded<ExecutiveOfficeOperations>;
  activation: Loaded<ChiefAgentActivationStatus>;
  learning: Loaded<LearningStatus>;
  canonicalReviews: Loaded<PendingCanonicalReview[]>;
  knowledge: Loaded<KnowledgeOverview>;
  pendingQuestion: PendingQuestion | null;
  unanswered: UnansweredQuestion[];
  deciding: Record<string, "approve" | "reject">;
  decisionErrors: Record<string, string>;
  learningNow: boolean;
  learnNowMessage: string | null;
}

const POLL_MS = 30_000;

let state: ExecutiveOfficeState = {
  operations: { status: "loading" },
  activation: { status: "loading" },
  learning: { status: "loading" },
  canonicalReviews: { status: "loading" },
  knowledge: { status: "loading" },
  pendingQuestion: null,
  unanswered: [],
  deciding: {},
  decisionErrors: {},
  learningNow: false,
  learnNowMessage: null,
};

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let refreshing = false;

function publish(
  patch: Partial<ExecutiveOfficeState>,
) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function load<K extends "operations" | "activation" | "learning" | "canonicalReviews" | "knowledge">(
  key: K,
  read: () => Promise<unknown>,
) {
  return read().then(
    (data) => publish({ [key]: { status: "ok", data } } as never),
    (error) => {
      const previous = state[key] as Loaded<unknown>;
      publish({
        [key]:
          previous.status === "ok"
            ? { ...previous, stale: errorMessage(error) }
            : { status: "error", message: errorMessage(error) },
      } as never);
    },
  );
}

export async function refreshExecutiveOffice() {
  if (refreshing) return;
  refreshing = true;
  try {
    await Promise.allSettled([
      load("operations", getExecutiveOfficeOperations),
      load("activation", getChiefAgentActivationStatus),
      load("learning", getLearningStatus),
      load("canonicalReviews", getPendingCanonicalReviews),
      load("knowledge", getKnowledgeOverview),
    ]);
  } finally {
    refreshing = false;
  }
}

export async function askExecutiveQuestion(
  question: string,
): Promise<void> {
  const trimmed = question.trim();
  if (!trimmed || state.pendingQuestion) return;

  const askedAt = Date.now();
  publish({ pendingQuestion: { question: trimmed, askedAt } });

  try {
    const result = await askChiefAgent(trimmed);
    if ("reason" in result) {
      publish({
        unanswered: [
          ...state.unanswered,
          { question: trimmed, reason: result.reason, askedAt },
        ],
      });
    }
  } catch (error) {
    publish({
      unanswered: [
        ...state.unanswered,
        {
          question: trimmed,
          reason: `Runtime did not answer: ${errorMessage(error)}`,
          askedAt,
        },
      ],
    });
  } finally {
    await refreshExecutiveOffice();
    publish({ pendingQuestion: null });
  }
}

export async function decideApproval(
  approvalId: string,
  decision: "approve" | "reject",
  reason?: string,
): Promise<boolean> {
  if (state.deciding[approvalId]) return false;

  const { [approvalId]: _cleared, ...otherErrors } = state.decisionErrors;
  publish({
    deciding: { ...state.deciding, [approvalId]: decision },
    decisionErrors: otherErrors,
  });

  let succeeded = false;

  try {
    await decideExecutiveApproval(approvalId, decision, reason);
    succeeded = true;
  } catch (error) {
    publish({
      decisionErrors: {
        ...state.decisionErrors,
        [approvalId]: errorMessage(error),
      },
    });
  } finally {
    await refreshExecutiveOffice();
    const { [approvalId]: _done, ...stillDeciding } = state.deciding;
    publish({ deciding: stillDeciding });
  }

  return succeeded;
}

export async function learnNow(): Promise<void> {
  if (state.learningNow) return;
  publish({ learningNow: true, learnNowMessage: null });

  try {
    const cycle = await runLearningCycleNow();
    const record = cycle.learning?.recordId;
    publish({
      learnNowMessage:
        cycle.outcome === "CAPTURED"
          ? record
            ? `Learned from ${cycle.commits.length} commit(s): ${record}.`
            : `Captured ${cycle.commits.length} commit(s).`
          : cycle.outcome === "NO_NEW_WORK"
            ? "Nothing new to learn: every commit is already learned."
            : `Learning cycle ${cycle.outcome.toLowerCase()}${cycle.reasons.length ? `: ${cycle.reasons.join("; ")}` : "."}`,
    });
  } catch (error) {
    publish({ learnNowMessage: `Learning did not run: ${errorMessage(error)}` });
  } finally {
    await refreshExecutiveOffice();
    publish({ learningNow: false });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshExecutiveOffice();
    timer = setInterval(() => void refreshExecutiveOffice(), POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return state;
}

export function useExecutiveOffice(): ExecutiveOfficeState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/*
 * EW-1b: the owner's previous visit, read once per page load so the
 * briefing keeps saying "since your last visit" while the office is open.
 * Stored in this browser only; when it cannot be read the briefing covers
 * the last 24 hours instead.
 */
const LAST_VISIT_KEY = "korelumina.executiveOffice.lastVisit";

function readLastVisit(): number | null {
  try {
    const value = Number(window.localStorage.getItem(LAST_VISIT_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export const previousExecutiveOfficeVisit: number | null =
  typeof window === "undefined" ? null : readLastVisit();

export function recordExecutiveOfficeVisit() {
  try {
    window.localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
  } catch {
    /* A private window or blocked storage only loses "since your last visit". */
  }
}
