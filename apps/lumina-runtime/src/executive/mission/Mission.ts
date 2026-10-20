/*
 * MS-1 (ADR-0044): a mission is a governed Runtime record following the
 * approved Chief Agent Mission System
 * (docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md).
 *
 * The lifecycle is enforced, and each step names who may take it
 * (ADR-0044 Decision 2):
 *
 *   draft ─plan→ planned ─submit→ awaiting_approval ─approve→ approved
 *     ─(first linked commit)→ executing ─→ validating ─→ completed
 *     ─(Learning Record cites it)→ knowledge_extracted ─archive→ archived
 *
 *   reject: awaiting_approval → planned (owner, with a reason)
 *   block / unblock: owner, with a reason; unblock returns to the
 *     state the mission was blocked from
 *   cancel: owner, with a reason, from any state before completed
 *
 * The Chief Agent may create, plan and submit (propose). It never
 * approves, executes, completes or archives (ADR-0041 PROPOSE_ONLY).
 * Steps marked "system" are taken by Runtime on evidence (MS-2, MS-4).
 */

export const MISSION_TYPES = [
  "engineering",
  "architecture",
  "recovery",
  "knowledge-acquisition",
  "documentation",
  "deployment",
  "maintenance",
  "research",
  "governance",
  "security",
  "operational",
] as const;
export type MissionType = (typeof MISSION_TYPES)[number];

export const MISSION_PRIORITIES = ["critical", "high", "normal", "low"] as const;
export type MissionPriority = (typeof MISSION_PRIORITIES)[number];

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

export type MissionActorType = "human" | "chief-agent" | "system";

export interface MissionActor {
  id: string;
  type: MissionActorType;
}

export type MissionTaskStatus = "todo" | "done" | "dropped";

export interface MissionTask {
  id: string;
  title: string;
  acceptanceCriteria: string[];
  status: MissionTaskStatus;
  dropReason?: string;
}

export interface MissionEpic {
  id: string;
  title: string;
  tasks: MissionTask[];
}

export interface MissionPlan {
  epics: MissionEpic[];
  validationPlan: string[];
  requiredDocuments: string[];
}

export interface MissionTransition {
  from: MissionState | null;
  to: MissionState;
  actor: MissionActor;
  at: number;
  reason?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  objective: string;
  objectiveId: string | null;
  type: MissionType;
  priority: MissionPriority;
  /* The Chief Agent owns every mission (Mission System: Delegation). */
  owner: "chief-agent";
  proposedBy: MissionActor;
  participants: string[];
  relatedRepositories: string[];
  relatedServices: string[];
  requiredApprovals: string[];
  risks: string[];
  plan: MissionPlan | null;
  state: MissionState;
  /* The state a blocked mission returns to when unblocked. */
  blockedFrom: MissionState | null;
  linkedCommits: Array<{ sha: string; subject: string; committedAt: number }>;
  recoveryAnchor: string | null;
  producedKnowledge: string[];
  history: MissionTransition[];
  createdAt: number;
  updatedAt: number;
}

type Transition =
  | "plan"
  | "submit"
  | "approve"
  | "reject"
  | "start"
  | "validate"
  | "complete"
  | "extract_knowledge"
  | "archive"
  | "block"
  | "unblock"
  | "cancel";

interface TransitionRule {
  from: readonly MissionState[];
  to: MissionState | "previous";
  actors: readonly MissionActorType[];
  reasonRequired: boolean;
}

const BEFORE_COMPLETION: readonly MissionState[] = [
  "draft",
  "planned",
  "awaiting_approval",
  "approved",
  "executing",
  "validating",
  "blocked",
];

export const MISSION_TRANSITIONS: Readonly<Record<Transition, TransitionRule>> = {
  plan: { from: ["draft", "planned"], to: "planned", actors: ["human", "chief-agent"], reasonRequired: false },
  submit: { from: ["planned"], to: "awaiting_approval", actors: ["human", "chief-agent"], reasonRequired: false },
  approve: { from: ["awaiting_approval"], to: "approved", actors: ["human"], reasonRequired: false },
  reject: { from: ["awaiting_approval"], to: "planned", actors: ["human"], reasonRequired: true },
  start: { from: ["approved"], to: "executing", actors: ["system"], reasonRequired: false },
  validate: { from: ["executing"], to: "validating", actors: ["system"], reasonRequired: false },
  complete: { from: ["validating"], to: "completed", actors: ["system"], reasonRequired: false },
  extract_knowledge: { from: ["completed"], to: "knowledge_extracted", actors: ["system"], reasonRequired: false },
  archive: { from: ["knowledge_extracted", "cancelled"], to: "archived", actors: ["human"], reasonRequired: false },
  block: { from: ["planned", "awaiting_approval", "approved", "executing", "validating"], to: "blocked", actors: ["human"], reasonRequired: true },
  unblock: { from: ["blocked"], to: "previous", actors: ["human"], reasonRequired: true },
  cancel: { from: BEFORE_COMPLETION, to: "cancelled", actors: ["human"], reasonRequired: true },
};

export type MissionTransitionName = Transition;

export class MissionTransitionError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "MissionTransitionError";
  }
}

/*
 * Applies one lifecycle step, or refuses it. Never mutates the input.
 */
export function transitionMission(
  mission: Mission,
  transition: Transition,
  actor: MissionActor,
  at: number,
  reason?: string,
): Mission {
  const rule = MISSION_TRANSITIONS[transition];

  if (!rule.actors.includes(actor.type)) {
    throw new MissionTransitionError(`mission_${transition}_not_allowed_for_${actor.type}`);
  }
  if (actor.type === "human" && !actor.id.startsWith("human:")) {
    throw new MissionTransitionError("mission_human_actor_required");
  }
  if (!rule.from.includes(mission.state)) {
    throw new MissionTransitionError(`mission_cannot_${transition}_from_${mission.state}`);
  }
  const trimmedReason = reason?.trim();
  if (rule.reasonRequired && !trimmedReason) {
    throw new MissionTransitionError(`mission_${transition}_reason_required`);
  }
  if (transition === "submit" && !hasPlan(mission)) {
    throw new MissionTransitionError("mission_plan_required");
  }

  const to: MissionState =
    rule.to === "previous" ? (mission.blockedFrom ?? "planned") : rule.to;

  return {
    ...mission,
    state: to,
    blockedFrom: to === "blocked" ? mission.state : transition === "unblock" ? null : mission.blockedFrom,
    history: [
      ...mission.history,
      { from: mission.state, to, actor, at, ...(trimmedReason ? { reason: trimmedReason } : {}) },
    ],
    updatedAt: at,
  };
}

function hasPlan(mission: Mission): boolean {
  return Boolean(mission.plan && mission.plan.epics.some((epic) => epic.tasks.length > 0));
}
