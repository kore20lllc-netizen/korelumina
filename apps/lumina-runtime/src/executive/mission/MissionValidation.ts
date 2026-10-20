import { execFileSync } from "node:child_process";

import {
  MissionTransitionError,
  transitionMission,
  type Mission,
  type MissionActor,
  type MissionCheck,
  type MissionTaskStatus,
  type MissionVerification,
} from "./Mission.js";
import type { MissionService } from "./MissionService.js";

/*
 * MS-4 (ADR-0044 Decision 5): validation is evidence, not a claim.
 *
 * A mission completes only when every check passes:
 *   - every planned task is done, or dropped by the owner with a reason;
 *   - the last linked commit passed `npm run build`, recorded by the
 *     owner's verification of that exact commit;
 *   - no approval linked to the mission is pending;
 *   - every document the plan requires is committed;
 *   - a recovery anchor (commit) is recorded.
 * Knowledge extraction follows completion (MS-2).
 *
 * Runtime takes the steps, as the system, on evidence only: an executing
 * mission moves to validating once its work is resolved (no task left to
 * do), and a validating mission completes once every check passes. A
 * failed check keeps it validating; new linked commits still attach, and
 * a new commit needs its own build verification. Task status and build
 * verifications are the owner's to record (ADR-0041: the Chief Agent
 * never validates or completes).
 */

const SYSTEM: MissionActor = { id: "runtime", type: "system" };
const WORKING: readonly Mission["state"][] = ["approved", "executing", "validating"];
const VERIFIABLE: readonly Mission["state"][] = ["executing", "validating"];

export interface MissionValidationPorts {
  /* Status of a linked approval, or undefined when it no longer exists. */
  approvalStatus(approvalId: string): string | undefined;
  /* Whether a repository path is committed at HEAD. */
  documentCommitted(path: string): boolean;
  /* Run after a mission completes: knowledge may already be canonical. */
  afterCompleted?(missionId: string): void;
}

function requireOwner(actor: MissionActor): void {
  if (actor.type !== "human" || !actor.id.startsWith("human:")) {
    throw new MissionTransitionError(`mission_validation_not_allowed_for_${actor.type}`);
  }
}

function tasksOf(mission: Mission) {
  return mission.plan?.epics.flatMap((epic) => epic.tasks) ?? [];
}

export function missionChecks(mission: Mission, ports: MissionValidationPorts): MissionCheck[] {
  const tasks = tasksOf(mission);
  const open = tasks.filter((task) => task.status === "todo");
  const anchor = mission.recoveryAnchor;
  const latest = anchor
    ? [...(mission.verifications ?? [])].reverse().find((verification) => verification.check === "build" && verification.sha === anchor)
    : undefined;
  const pending = mission.requiredApprovals.filter((approvalId) => ports.approvalStatus(approvalId) === "pending");
  const required = mission.plan?.requiredDocuments ?? [];
  const missing = required.filter((path) => !ports.documentCommitted(path));

  return [
    {
      id: "tasks",
      label: "Every planned task is done or dropped",
      passed: tasks.length > 0 && open.length === 0,
      detail: tasks.length === 0
        ? "The mission has no planned tasks."
        : open.length === 0
          ? `${tasks.filter((task) => task.status === "done").length} done, ${tasks.filter((task) => task.status === "dropped").length} dropped.`
          : `${open.length} of ${tasks.length} still to do: ${open.map((task) => task.id).join(", ")}.`,
    },
    {
      id: "build",
      label: "The last linked commit passed npm run build",
      passed: latest?.result === "passed",
      detail: !anchor
        ? "No linked commit yet."
        : !latest
          ? `No build verification for ${anchor.slice(0, 8)}.`
          : `${latest.result === "passed" ? "Passed" : "Failed"} for ${anchor.slice(0, 8)}, recorded by ${latest.actor}.`,
    },
    {
      id: "approvals",
      label: "No linked approval is pending",
      passed: pending.length === 0,
      detail: pending.length === 0 ? "None pending." : `Pending: ${pending.join(", ")}.`,
    },
    {
      id: "documents",
      label: "Required documents are committed",
      passed: missing.length === 0,
      detail: required.length === 0
        ? "The plan requires no documents."
        : missing.length === 0
          ? `All ${required.length} committed.`
          : `Not committed: ${missing.join(", ")}.`,
    },
    {
      id: "recovery-anchor",
      label: "A recovery anchor is recorded",
      passed: Boolean(anchor),
      detail: anchor ? `Recovery anchor ${anchor.slice(0, 8)}.` : "No linked commit yet.",
    },
  ];
}

export class MissionValidationService {
  constructor(
    private readonly missions: MissionService,
    private readonly ports: MissionValidationPorts,
    private readonly now: () => number = () => Date.now(),
  ) {}

  checks(id: string): MissionCheck[] {
    return missionChecks(this.require(id), this.ports);
  }

  /* The owner marks a task done, drops it with a reason, or reopens it. */
  setTaskStatus(id: string, taskId: string, status: MissionTaskStatus, actor: MissionActor, reason?: string): Mission {
    requireOwner(actor);
    const mission = this.require(id);
    if (!WORKING.includes(mission.state)) throw new MissionTransitionError(`mission_tasks_locked_while_${mission.state}`);
    if (!["todo", "done", "dropped"].includes(status)) throw new MissionTransitionError("mission_task_status_invalid");
    const dropReason = reason?.trim();
    if (status === "dropped" && !dropReason) throw new MissionTransitionError("mission_task_drop_reason_required");
    if (!tasksOf(mission).some((task) => task.id === taskId)) throw new MissionTransitionError("mission_task_not_found");

    const at = this.now();
    this.missions.save({
      ...mission,
      plan: {
        ...mission.plan!,
        epics: mission.plan!.epics.map((epic) => ({
          ...epic,
          tasks: epic.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const { dropReason: _previous, ...rest } = task;
            return { ...rest, status, ...(status === "dropped" ? { dropReason } : {}), updatedBy: actor.id, updatedAt: at };
          }),
        })),
      },
      updatedAt: at,
    });
    return this.evaluate(id);
  }

  /*
   * The owner records a check on a linked commit (default: the recovery
   * anchor). Only the latest verification of the anchor counts.
   */
  recordVerification(
    id: string,
    input: { check?: string; sha?: string; result?: string; note?: string },
    actor: MissionActor,
  ): Mission {
    requireOwner(actor);
    const mission = this.require(id);
    if (!VERIFIABLE.includes(mission.state)) throw new MissionTransitionError(`mission_cannot_verify_while_${mission.state}`);
    if ((input.check ?? "build") !== "build") throw new MissionTransitionError("mission_verification_check_unknown");
    if (input.result !== "passed" && input.result !== "failed") throw new MissionTransitionError("mission_verification_result_required");

    const wanted = (input.sha ?? mission.recoveryAnchor ?? "").trim().toLowerCase();
    const commit = wanted.length >= 7 ? mission.linkedCommits.find((linked) => linked.sha.startsWith(wanted)) : undefined;
    if (!commit) throw new MissionTransitionError("mission_verification_commit_not_linked");

    const verification: MissionVerification = {
      check: "build",
      sha: commit.sha,
      result: input.result,
      ...(input.note?.trim() ? { note: input.note.trim().slice(0, 2_000) } : {}),
      actor: actor.id,
      at: this.now(),
    };
    this.missions.save({
      ...mission,
      verifications: [...(mission.verifications ?? []), verification],
      updatedAt: verification.at,
    });
    return this.evaluate(id);
  }

  /*
   * Re-reads the evidence and takes any system step it allows. Safe to run
   * at any time; a mission outside execution is returned unchanged.
   */
  evaluate(id: string): Mission {
    let mission = this.require(id);
    if (mission.state !== "executing" && mission.state !== "validating") return mission;

    const at = this.now();
    let checks = missionChecks(mission, this.ports);
    const tasksResolved = checks.find((check) => check.id === "tasks")!.passed;

    if (mission.state === "executing" && tasksResolved) {
      mission = transitionMission(mission, "validate", SYSTEM, at, "Every planned task is done or dropped");
    }

    let completed = false;
    if (mission.state === "validating" && checks.every((check) => check.passed)) {
      mission = transitionMission(
        mission,
        "complete",
        SYSTEM,
        at,
        `All validation checks passed at ${mission.recoveryAnchor!.slice(0, 8)}`,
      );
      completed = true;
    }

    mission = { ...mission, validation: { evaluatedAt: at, checks }, updatedAt: at };
    this.missions.save(mission);
    if (completed) this.ports.afterCompleted?.(mission.id);
    return mission;
  }

  /* Every mission in execution; run after each learning cycle. */
  evaluateAll(): string[] {
    const changed: string[] = [];
    for (const mission of this.missions.list()) {
      if (mission.state !== "executing" && mission.state !== "validating") continue;
      const before = mission.state;
      if (this.evaluate(mission.id).state !== before) changed.push(mission.id);
    }
    return changed;
  }

  private require(id: string): Mission {
    const mission = this.missions.get(id);
    if (!mission) throw new MissionTransitionError("mission_not_found");
    return mission;
  }
}

/*
 * A plan's required document counts once it is committed at HEAD of the
 * repository. Paths are repository-relative; anything that escapes the
 * repository never counts.
 */
export function gitDocumentCommitted(repositoryRoot: string): (path: string) => boolean {
  return (path: string) => {
    const relative = path.trim().replace(/^\.\//, "");
    if (!relative || relative.startsWith("/") || relative.split(/[\\/]/).includes("..")) return false;
    try {
      execFileSync("git", ["cat-file", "-e", `HEAD:${relative}`], { cwd: repositoryRoot, stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };
}
