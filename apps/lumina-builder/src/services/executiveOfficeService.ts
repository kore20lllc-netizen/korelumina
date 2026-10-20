import {
  getRuntimeCallerHeaders,
  RUNTIME_API,
} from "@/services/runtime/client";

/*
 * EW-1: the Executive Office talks to the Chief Agent through Runtime.
 *
 * - A question is an executive event from the owner. The Chief Agent reasons
 *   over governed knowledge, and its answer becomes a proposed decision with
 *   an approval addressed back to the owner (ADR-0041: propose only).
 * - Approvals are decided by the owner. Runtime only accepts a decision from
 *   the approver the approval names, and only from this machine.
 *
 * The owner's executive identity is "human:founder", the identity the
 * activation record and every existing executive approval already use.
 */
export const EXECUTIVE_OWNER_ACTOR_ID =
  "human:founder";

export interface ExecutiveReasoningRecord {
  id: string;
  sessionId: string;
  title: string;
  question: string;
  conclusion: string;
  disposition: "authorize" | "review" | "deny";
  confidence: number;
  evidence: string[];
  assumptions: string[];
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutiveDecisionRecord {
  id: string;
  title: string;
  rationale: string;
  status: string;
  requestedBy?: string;
  approvedBy?: string;
  evidence?: string[];
  consequences?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ExecutiveApprovalRecord {
  id: string;
  decisionId: string;
  requestedBy: string;
  approverId: string;
  status: string;
  comments?: string;
  createdAt: number;
  metadata?: {
    decisionTitle?: string;
    reasoningId?: string;
    reasoningConfidence?: number;
    reasoningQuestion?: string;
    reasoningDisposition?: string;
    [key: string]: unknown;
  };
}

export interface ExecutiveOfficeOperations {
  generatedAt: number;
  summary: {
    reasoning: number;
    decisions: number;
    pendingApprovals: number;
  };
  reasoning: ExecutiveReasoningRecord[];
  decisions: ExecutiveDecisionRecord[];
  approvals: ExecutiveApprovalRecord[];
}

export interface ChiefAgentActivationRecord {
  action: string;
  state: string;
  autonomyLevel: string | null;
  decidedBy: string;
  decidedAt: number;
}

export interface ChiefAgentActivationStatus {
  state: string;
  active: boolean;
  autonomyLevel: string | null;
  reason: string;
  checkedAt: number;
  history: ChiefAgentActivationRecord[];
}

export interface LearningCycleRecord {
  cycleId: string;
  trigger: string;
  outcome: string;
  startedAt: number;
  completedAt?: number;
  commits: Array<{ sha: string; subject: string }>;
  reasons: string[];
  /* MS-2: commits this cycle attached to missions. */
  missionLinks?: Array<{ missionId: string; sha: string; result: string; reason?: string }>;
  learning?: {
    recordId?: string;
    repositoryPath?: string;
    status?: string;
    [key: string]: unknown;
  };
}

export interface LearningStatus {
  checkpoint: {
    commit: string;
    committedAt: number;
  } | null;
  pendingCommits: Array<{ sha: string; subject: string }>;
  nonOwnerPendingCommits: Array<{ sha: string; subject: string; authorEmail?: string }>;
  running: boolean;
  cycles: LearningCycleRecord[];
}

export interface PendingCanonicalReview {
  id: string;
  title: string;
  classification: string;
  createdAt: number;
}

async function readJson(
  path: string,
): Promise<any> {
  const response =
    await fetch(
      `${RUNTIME_API}${path}`,
      {
        cache: "no-store",
        headers: getRuntimeCallerHeaders(),
      },
    );

  if (!response.ok) {
    throw new Error(
      `${path} answered ${response.status}`,
    );
  }

  return await response.json();
}

async function postJson(
  path: string,
  body: unknown,
  method: "POST" | "PUT" = "POST",
): Promise<{ status: number; body: any }> {
  const response =
    await fetch(
      `${RUNTIME_API}${path}`,
      {
        method,
        headers: getRuntimeCallerHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(body),
      },
    );

  let parsed: any = null;

  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }

  return {
    status: response.status,
    body: parsed,
  };
}

export async function getExecutiveOfficeOperations():
Promise<ExecutiveOfficeOperations> {
  const body =
    await readJson(
      "/api/executive/operations",
    );

  return {
    generatedAt: Number(body?.generatedAt ?? Date.now()),
    summary: {
      reasoning: Number(body?.summary?.reasoning ?? 0),
      decisions: Number(body?.summary?.decisions ?? 0),
      pendingApprovals: Number(body?.summary?.pendingApprovals ?? 0),
    },
    reasoning: Array.isArray(body?.reasoning) ? body.reasoning : [],
    decisions: Array.isArray(body?.decisions) ? body.decisions : [],
    approvals: Array.isArray(body?.approvals) ? body.approvals : [],
  };
}

export async function getChiefAgentActivationStatus():
Promise<ChiefAgentActivationStatus> {
  const body =
    await readJson(
      "/api/executive/activation",
    );

  return {
    state: String(body?.activation?.state ?? "UNAVAILABLE"),
    active: body?.activation?.active === true,
    autonomyLevel: body?.activation?.autonomyLevel ?? null,
    reason: String(body?.activation?.reason ?? ""),
    checkedAt: Number(body?.activation?.checkedAt ?? Date.now()),
    history: (Array.isArray(body?.history) ? body.history : []).map((record: any) => ({
      action: String(record?.action ?? ""),
      state: String(record?.state ?? ""),
      autonomyLevel: record?.autonomyLevel ?? null,
      decidedBy: String(record?.decidedBy ?? ""),
      decidedAt: Number(record?.decidedAt ?? 0),
    })),
  };
}

export async function getLearningStatus():
Promise<LearningStatus> {
  const body =
    await readJson(
      "/api/learning/cycles",
    );

  return {
    checkpoint: body?.checkpoint ?? null,
    pendingCommits: Array.isArray(body?.pendingCommits) ? body.pendingCommits : [],
    nonOwnerPendingCommits: Array.isArray(body?.nonOwnerPendingCommits) ? body.nonOwnerPendingCommits : [],
    running: body?.running === true,
    cycles: Array.isArray(body?.cycles) ? body.cycles : [],
  };
}

export async function getPendingCanonicalReviews():
Promise<PendingCanonicalReview[]> {
  const body =
    await readJson(
      "/api/knowledge/canonical-review",
    );

  const packages: any[] =
    Array.isArray(body?.packages) ? body.packages : [];

  return packages
    .filter((entry) => entry?.reviewStatus === "pending")
    .map((entry) => ({
      id: String(entry.id),
      title: String(entry?.items?.[0]?.title ?? entry.id),
      classification: String(
        typeof entry?.reviewClassification === "string"
          ? entry.reviewClassification
          : entry?.reviewClassification?.mode ?? "individual",
      ),
      createdAt: Number(entry?.createdAt ?? 0),
    }))
    .sort((left, right) => right.createdAt - left.createdAt);
}

/*
 * EW-3: canonical knowledge and organizational memory, from the knowledge
 * production lifecycle (a fast record read, no projection).
 */
export interface CanonicalKnowledgeEntry {
  id: string;
  title: string;
  contentRef: string;
  canonicalizedAt: number;
}

export interface KnowledgeLifecycle {
  canonicalItems: CanonicalKnowledgeEntry[];
  organizationalMemory: number;
  packages: number;
  awaitingReview: number;
}

export async function getKnowledgeLifecycle():
Promise<KnowledgeLifecycle> {
  const body =
    await readJson(
      "/api/knowledge/production-lifecycle",
    );

  const items: any[] =
    Array.isArray(body?.canonicalItems) ? body.canonicalItems : [];

  return {
    canonicalItems: items.map((item) => ({
      id: String(item.id),
      title: String(item.title ?? item.id),
      contentRef: String(item?.metadata?.contentRef ?? ""),
      canonicalizedAt: Number(
        item?.metadata?.canonicalization?.canonicalizedAt ??
          item?.updatedAt ??
          item?.createdAt ??
          0,
      ),
    })),
    organizationalMemory: Array.isArray(body?.organizationalMemory)
      ? body.organizationalMemory.length
      : Number(body?.summary?.organizationalMemory ?? 0),
    packages: Number(body?.summary?.packages ?? 0),
    awaitingReview: Number(body?.summary?.awaitingReview ?? 0),
  };
}

/* EW-3: projects imported into the Runtime, and which ones are running. */
export interface RuntimeProject {
  projectId: string;
  createdAt: number;
  hasPackageJson: boolean;
  running: boolean;
  framework: string | null;
  url: string | null;
}

export async function getRuntimeProjects():
Promise<RuntimeProject[]> {
  const [projects, status] =
    await Promise.all([
      readJson("/api/runtime/projects"),
      readJson("/api/runtime/status"),
    ]);

  const runtimes: any[] =
    Array.isArray(status?.runtimes) ? status.runtimes : [];

  return (Array.isArray(projects?.projects) ? projects.projects : []).map((project: any) => {
    const runtime =
      runtimes.find((entry) => entry?.projectId === project?.projectId);

    return {
      projectId: String(project.projectId),
      createdAt: Number(project?.createdAt ?? 0),
      hasPackageJson: project?.hasPackageJson === true,
      running: runtime?.status === "running",
      framework: typeof runtime?.framework === "string" ? runtime.framework : null,
      url: typeof runtime?.url === "string" ? runtime.url : null,
    };
  });
}

/* SEC-1d: how Runtime sees the person using the Executive Office. */
export interface RuntimeIdentity {
  identityProviderConfigured: boolean;
  source:
    | "verified-token"
    | "rejected-token"
    | "internal-token"
    | "development-identity"
    | "local-headers"
    | "anonymous";
  reason?: string;
  role: string;
  userId: string | null;
}

export async function getRuntimeIdentity():
Promise<RuntimeIdentity> {
  const body =
    await readJson(
      "/api/runtime/identity",
    );

  return {
    identityProviderConfigured: body?.identityProviderConfigured === true,
    source: body?.source ?? "anonymous",
    reason: typeof body?.reason === "string" ? body.reason : undefined,
    role: String(body?.caller?.role ?? "user"),
    userId: typeof body?.caller?.userId === "string" ? body.caller.userId : null,
  };
}

export interface KnowledgeOverview {
  canonicalItems: number;
}

export async function getKnowledgeOverview():
Promise<KnowledgeOverview> {
  const body =
    await readJson(
      "/api/knowledge/operations",
    );

  return {
    canonicalItems: Number(body?.knowledge?.canonicalItems ?? 0),
  };
}

export type AskChiefAgentResult =
  | {
      answered: true;
      reasoning: ExecutiveReasoningRecord | null;
    }
  | {
      answered: false;
      reason: string;
    };

function explainUnanswered(
  code: string,
): string {
  if (code.startsWith("missing_") && code.endsWith("_API_KEY")) {
    return `Runtime has no reasoning provider key (${code.slice("missing_".length)}). Add it to the Runtime environment and restart Runtime.`;
  }

  if (code.includes("activation")) {
    return `The Chief Agent is not active (${code}).`;
  }

  return code;
}

export async function askChiefAgent(
  question: string,
): Promise<AskChiefAgentResult> {
  const eventId =
    `executive-office:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const { status, body } =
    await postJson(
      "/api/executive/events",
      {
        id: eventId,
        type: "chief-agent.question",
        category: "business",
        source: "executive-office",
        workspace: "executive-office",
        actor: {
          id: EXECUTIVE_OWNER_ACTOR_ID,
          type: "human",
          label: "Owner",
        },
        confidence: "validated",
        payload: {
          query: question,
          approverId: EXECUTIVE_OWNER_ACTOR_ID,
        },
      },
    );

  const records: Array<{ destination: string; status: string; message?: string }> =
    Array.isArray(body?.dispatch?.records) ? body.dispatch.records : [];

  const reasoning =
    records.find((record) => record.destination === "reasoning");

  if (reasoning?.status === "handled") {
    let record: ExecutiveReasoningRecord | null = null;

    try {
      const answer =
        await readJson(
          `/api/executive/reasoning/${encodeURIComponent(`reasoning:${eventId}`)}`,
        );

      record = answer?.reasoning ?? null;
    } catch {
      record = null;
    }

    return {
      answered: true,
      reasoning: record,
    };
  }

  if (reasoning) {
    return {
      answered: false,
      reason: explainUnanswered(
        reasoning.message ?? reasoning.status,
      ),
    };
  }

  return {
    answered: false,
    reason:
      typeof body?.error === "string"
        ? body.error
        : `Runtime answered ${status} without a reasoning outcome.`,
  };
}

export async function decideExecutiveApproval(
  approvalId: string,
  decision: "approve" | "reject",
  reason?: string,
): Promise<void> {
  const { status, body } =
    await postJson(
      `/api/executive/approvals/${encodeURIComponent(approvalId)}/${decision}`,
      decision === "approve"
        ? { actorId: EXECUTIVE_OWNER_ACTOR_ID }
        : { actorId: EXECUTIVE_OWNER_ACTOR_ID, reason: reason ?? "" },
    );

  if (status >= 400 || body?.ok === false) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Runtime answered ${status}`,
    );
  }
}

export async function runLearningCycleNow(): Promise<LearningCycleRecord> {
  const { status, body } =
    await postJson(
      "/api/learning/cycles",
      {},
    );

  if (!body?.cycle) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Runtime answered ${status}`,
    );
  }

  return body.cycle;
}

/*
 * MS-5 (ADR-0044): missions are Runtime records. The Executive Office reads
 * them as they are; for missions in execution it also reads the live
 * validation checks (MS-4). Task status and build verification are the
 * owner's evidence, recorded through Runtime.
 */
export type MissionState =
  | "draft"
  | "planned"
  | "awaiting_approval"
  | "approved"
  | "executing"
  | "validating"
  | "completed"
  | "knowledge_extracted"
  | "archived"
  | "blocked"
  | "cancelled";

export interface MissionTaskRecord {
  id: string;
  title: string;
  acceptanceCriteria: string[];
  status: "todo" | "done" | "dropped";
  dropReason?: string;
  updatedBy?: string;
  updatedAt?: number;
}

export interface MissionCheckRecord {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface MissionRecord {
  id: string;
  title: string;
  description: string;
  objective: string;
  type: string;
  priority: string;
  owner: string;
  proposedBy: { id: string; type: string };
  participants: string[];
  requiredApprovals: string[];
  risks: string[];
  plan: {
    epics: Array<{ id: string; title: string; tasks: MissionTaskRecord[] }>;
    validationPlan: string[];
    requiredDocuments: string[];
  } | null;
  state: MissionState;
  blockedFrom: MissionState | null;
  linkedCommits: Array<{ sha: string; subject: string; committedAt: number }>;
  recoveryAnchor: string | null;
  producedKnowledge: string[];
  verifications?: Array<{ check: string; sha: string; result: "passed" | "failed"; actor: string; at: number; note?: string }>;
  history: Array<{ from: MissionState | null; to: MissionState; actor: { id: string; type: string }; at: number; reason?: string }>;
  createdAt: number;
  updatedAt: number;
  /* Live checks, read for missions in execution. */
  checks?: MissionCheckRecord[];
}

const IN_EXECUTION: readonly MissionState[] = ["executing", "validating"];

export async function getMissions(): Promise<MissionRecord[]> {
  const body = await readJson("/api/executive/missions");
  const missions: MissionRecord[] = Array.isArray(body?.missions) ? body.missions : [];

  return Promise.all(
    missions.map(async (mission) => {
      if (!IN_EXECUTION.includes(mission.state)) return mission;
      try {
        const validation = await readJson(`/api/executive/missions/${encodeURIComponent(mission.id)}/validation`);
        return { ...mission, checks: Array.isArray(validation?.checks) ? validation.checks : undefined };
      } catch {
        return mission;
      }
    }),
  );
}

async function missionPost(path: string, body: Record<string, unknown>): Promise<MissionRecord> {
  const { status, body: answer } = await postJson(path, { actorId: EXECUTIVE_OWNER_ACTOR_ID, ...body });
  if (status >= 400 || answer?.ok === false || !answer?.mission) {
    throw new Error(typeof answer?.error === "string" ? answer.error : `Runtime answered ${status}`);
  }
  return answer.mission;
}

export function setMissionTaskStatus(
  missionId: string,
  taskId: string,
  status: MissionTaskRecord["status"],
  reason?: string,
): Promise<MissionRecord> {
  return missionPost(
    `/api/executive/missions/${encodeURIComponent(missionId)}/tasks/${encodeURIComponent(taskId)}`,
    { status, ...(reason ? { reason } : {}) },
  );
}

export function verifyMissionBuild(
  missionId: string,
  sha: string,
  result: "passed" | "failed",
): Promise<MissionRecord> {
  return missionPost(
    `/api/executive/missions/${encodeURIComponent(missionId)}/verifications`,
    { check: "build", sha, result },
  );
}

/*
 * MS-5b: the owner's lifecycle steps on a mission. Runtime enforces who
 * may take each step; a mission with a pending approval is decided through
 * that approval (MS-3).
 */
export type MissionOwnerStep = "submit" | "approve" | "reject" | "unblock" | "cancel" | "archive";

export function takeMissionStep(
  missionId: string,
  step: MissionOwnerStep,
  reason?: string,
): Promise<MissionRecord> {
  return missionPost(
    `/api/executive/missions/${encodeURIComponent(missionId)}/${step}`,
    reason ? { reason } : {},
  );
}

/*
 * MS-2026-0004: the platform, read from the repository by Runtime, and the
 * Chief Agent's activation prerequisites. Prerequisites are re-derived on
 * every read (tens of seconds), so the office reads them rarely.
 */
export interface PlatformFacts {
  repository: string | null;
  branch: string | null;
  head: { sha: string; subject: string; committedAt: number } | null;
  workspaces: Array<{ path: string; name: string; stack: string[] }>;
}

export async function getPlatformFacts(): Promise<PlatformFacts> {
  const body = await readJson("/api/executive/platform");
  if (!body?.platform) throw new Error("Runtime returned no platform facts");
  return body.platform;
}

export interface ActivationPrerequisite {
  gate: string;
  state: string;
  id?: string | null;
}

export async function getActivationPrerequisites(): Promise<ActivationPrerequisite[]> {
  const body = await readJson("/api/executive/activation?prerequisites=true");
  const prerequisites = body?.activation?.prerequisites;
  if (!Array.isArray(prerequisites)) throw new Error("Runtime returned no prerequisites");
  return prerequisites.map((entry: any) => ({ gate: String(entry?.gate ?? ""), state: String(entry?.state ?? "UNKNOWN"), id: entry?.id ?? null }));
}

/* The owner suspends or resumes the Chief Agent (ADR-0041 Decision 7). */
export async function decideChiefAgentActivation(
  action: "SUSPEND" | "RESUME",
  reason: string,
): Promise<void> {
  const { status, body } = await postJson(
    "/api/executive/activation",
    /* Runtime previews every activation decision unless it is confirmed; the
       owner's Confirm button is that confirmation. */
    { action, decidedBy: EXECUTIVE_OWNER_ACTOR_ID, reason, confirm: true },
    "PUT",
  );
  if (status >= 400 || body?.ok === false || body?.outcome !== "RECORDED") {
    const reasons = Array.isArray(body?.reasons) ? body.reasons.join(", ") : null;
    throw new Error(reasons || (typeof body?.error === "string" ? body.error : `Runtime answered ${status}`));
  }
}
