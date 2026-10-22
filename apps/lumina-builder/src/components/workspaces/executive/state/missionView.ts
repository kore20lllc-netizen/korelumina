import type {
  ExecutiveApprovalRecord,
  MissionRecord,
  MissionState,
} from "@/services/executiveOfficeService";
import type { PreviewTone } from "../design/executiveDesignPreview";

/*
 * MS-5 (ADR-0044): how the Executive Office reads a mission record. Every
 * value is derived from the record itself; nothing is estimated.
 */

/* The lifecycle as the owner sees it, from plan to knowledge. */
export const MISSION_STAGES: ReadonlyArray<{ label: string; states: readonly MissionState[] }> = [
  { label: "Planned", states: ["draft", "planned", "awaiting_approval"] },
  { label: "Approved", states: ["approved"] },
  { label: "Executing", states: ["executing"] },
  { label: "Validating", states: ["validating"] },
  { label: "Completed", states: ["completed"] },
  { label: "Knowledge", states: ["knowledge_extracted", "archived"] },
];

export const STATE_LABEL: Record<MissionState, string> = {
  draft: "Draft",
  planned: "Planned",
  awaiting_approval: "Awaiting your approval",
  approved: "Approved",
  executing: "Executing",
  validating: "Validating",
  completed: "Completed",
  knowledge_extracted: "Knowledge extracted",
  archived: "Archived",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

export const STATE_TONE: Record<MissionState, PreviewTone> = {
  draft: "active",
  planned: "active",
  awaiting_approval: "warning",
  approved: "active",
  executing: "active",
  validating: "warning",
  completed: "healthy",
  knowledge_extracted: "healthy",
  archived: "healthy",
  blocked: "error",
  cancelled: "error",
};

/* -1 when the mission never reached the lifecycle (cancelled). */
export function stageIndex(mission: MissionRecord): number {
  if (mission.state === "cancelled") return -1;
  const state = mission.state === "blocked" ? mission.blockedFrom ?? "planned" : mission.state;
  return MISSION_STAGES.findIndex((stage) => stage.states.includes(state));
}

export function missionTasks(mission: MissionRecord) {
  return mission.plan?.epics.flatMap((epic) => epic.tasks) ?? [];
}

/* Share of planned tasks done or dropped. */
export function missionProgress(mission: MissionRecord): number {
  if (mission.state === "completed" || mission.state === "knowledge_extracted" || mission.state === "archived") return 100;
  const tasks = missionTasks(mission);
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((task) => task.status !== "todo").length / tasks.length) * 100);
}

export function pendingMissionApprovals(mission: MissionRecord, approvals: readonly ExecutiveApprovalRecord[]): number {
  return mission.requiredApprovals.filter((id) => approvals.some((approval) => approval.id === id && approval.status === "pending")).length;
}

const OPEN: readonly MissionState[] = ["executing", "validating", "approved", "awaiting_approval", "blocked", "planned", "draft"];

export function isOpenMission(mission: MissionRecord): boolean {
  return OPEN.includes(mission.state);
}

/* Open missions first, in the order work moves them; then by recency. */
export function sortMissions(missions: readonly MissionRecord[]): MissionRecord[] {
  const rank = (mission: MissionRecord) => {
    const index = OPEN.indexOf(mission.state);
    return index < 0 ? OPEN.length : index;
  };
  return [...missions].sort((left, right) => rank(left) - rank(right) || right.updatedAt - left.updatedAt);
}

/* The mission work is moving now: the most advanced open one. */
export function currentMission(missions: readonly MissionRecord[]): MissionRecord | null {
  return sortMissions(missions.filter((mission) => ["executing", "validating", "approved", "awaiting_approval"].includes(mission.state)))[0] ?? null;
}

/*
 * F-41: when nothing is in progress, the planned mission work turns to next,
 * so the Executive Office never reads "none" while a plan is waiting.
 */
export function nextPlannedMission(missions: readonly MissionRecord[]): MissionRecord | null {
  return sortMissions(missions.filter((mission) => mission.state === "planned" || mission.state === "draft"))[0] ?? null;
}

/* What the mission is waiting for, in the owner's words. */
export function missionNextStep(mission: MissionRecord): string {
  switch (mission.state) {
    case "draft":
      return "a plan";
    case "planned":
      return "submission for your approval";
    case "awaiting_approval":
      return "your decision in the Approval Center";
    case "approved":
      return "the first commit with its Mission trailer";
    case "executing": {
      const open = missionTasks(mission).filter((task) => task.status === "todo").length;
      return `${open} task${open === 1 ? "" : "s"} to finish`;
    }
    case "validating": {
      const failing = mission.checks?.filter((check) => !check.passed) ?? [];
      return failing.length ? failing.map((check) => check.label.toLowerCase()).join("; ") : "re-evaluation";
    }
    case "completed":
      return "a canonical Learning Record";
    case "blocked":
      return "unblocking";
    default:
      return "nothing";
  }
}

export function shortSha(sha: string | null | undefined): string {
  return sha ? sha.slice(0, 8) : "Not set";
}
