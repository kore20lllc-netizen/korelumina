import {
  MISSION_PRIORITIES,
  MISSION_TYPES,
  MissionTransitionError,
  transitionMission,
  type Mission,
  type MissionActor,
  type MissionPlan,
  type MissionPriority,
  type MissionTransitionName,
  type MissionType,
} from "./Mission.js";
import { FileMissionStore } from "./MissionStore.js";

/*
 * MS-1 (ADR-0044): creates missions and moves them through the lifecycle.
 * Every change is validated by transitionMission and recorded in the
 * mission's history.
 */

const SYSTEM: MissionActor = { id: "runtime", type: "system" };

const LINKABLE: readonly Mission["state"][] = ["approved", "executing", "validating", "blocked"];

export interface CreateMissionInput {
  title: string;
  description?: string;
  objective: string;
  objectiveId?: string | null;
  type?: string;
  priority?: string;
  participants?: string[];
  relatedRepositories?: string[];
  relatedServices?: string[];
  requiredApprovals?: string[];
  risks?: string[];
  /* Free-form input from the API; normalized and validated on create. */
  plan?: unknown;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map((entry) => entry.trim())
    : [];
}

function normalizePlan(plan: unknown): MissionPlan | null {
  if (!plan || typeof plan !== "object") return null;
  const raw = plan as Record<string, unknown>;
  const epics = Array.isArray(raw.epics) ? raw.epics : [];
  return {
    epics: epics.map((epic: any, epicIndex: number) => ({
      id: typeof epic?.id === "string" && epic.id.trim() ? epic.id.trim() : `E${epicIndex + 1}`,
      title: String(epic?.title ?? `Epic ${epicIndex + 1}`).trim(),
      tasks: (Array.isArray(epic?.tasks) ? epic.tasks : []).map((task: any, taskIndex: number) => ({
        id: typeof task?.id === "string" && task.id.trim() ? task.id.trim() : `E${epicIndex + 1}.T${taskIndex + 1}`,
        title: String(task?.title ?? `Task ${taskIndex + 1}`).trim(),
        acceptanceCriteria: strings(task?.acceptanceCriteria),
        status: "todo" as const,
      })),
    })),
    validationPlan: strings(raw.validationPlan),
    requiredDocuments: strings(raw.requiredDocuments),
  };
}

function actorAllowedToPropose(actor: MissionActor): void {
  if (actor.type === "system") throw new MissionTransitionError("mission_create_not_allowed_for_system");
  if (actor.type === "human" && !actor.id.startsWith("human:")) throw new MissionTransitionError("mission_human_actor_required");
  if (actor.type === "chief-agent" && actor.id !== "chief-agent") throw new MissionTransitionError("mission_chief_agent_actor_required");
}

export class MissionService {
  constructor(
    private readonly store = new FileMissionStore(),
    private readonly now: () => number = () => Date.now(),
  ) {}

  list(): Mission[] {
    return this.store.list();
  }

  get(id: string): Mission | null {
    return this.store.get(id);
  }

  create(input: CreateMissionInput, actor: MissionActor): Mission {
    actorAllowedToPropose(actor);
    const title = input.title?.trim();
    const objective = input.objective?.trim();
    if (!title) throw new MissionTransitionError("mission_title_required");
    if (!objective) throw new MissionTransitionError("mission_objective_required");

    const type = (MISSION_TYPES as readonly string[]).includes(input.type ?? "") ? (input.type as MissionType) : "engineering";
    const priority = (MISSION_PRIORITIES as readonly string[]).includes(input.priority ?? "") ? (input.priority as MissionPriority) : "normal";
    const at = this.now();

    const mission: Mission = {
      id: this.store.nextId(new Date(at).getUTCFullYear()),
      title,
      description: input.description?.trim() ?? "",
      objective,
      objectiveId: input.objectiveId ?? null,
      type,
      priority,
      owner: "chief-agent",
      proposedBy: actor,
      participants: strings(input.participants),
      relatedRepositories: strings(input.relatedRepositories),
      relatedServices: strings(input.relatedServices),
      requiredApprovals: strings(input.requiredApprovals),
      risks: strings(input.risks),
      plan: null,
      state: "draft",
      blockedFrom: null,
      linkedCommits: [],
      recoveryAnchor: null,
      producedKnowledge: [],
      history: [{ from: null, to: "draft", actor, at }],
      createdAt: at,
      updatedAt: at,
    };

    const created = input.plan ? this.withPlan(mission, normalizePlan(input.plan), actor, at) : mission;
    this.store.save(created);
    return created;
  }

  setPlan(id: string, plan: unknown, actor: MissionActor): Mission {
    const mission = this.require(id);
    const updated = this.withPlan(mission, normalizePlan(plan), actor, this.now());
    this.store.save(updated);
    return updated;
  }

  transition(id: string, transition: MissionTransitionName, actor: MissionActor, reason?: string): Mission {
    const mission = this.require(id);
    const updated = transitionMission(mission, transition, actor, this.now(), reason);
    this.store.save(updated);
    return updated;
  }

  /* MS-4: validation writes task status, verifications and results. */
  save(mission: Mission): void {
    this.store.save(mission);
  }

  /*
   * MS-3: the approval that decides this mission. Listed in
   * requiredApprovals; adding it twice changes nothing.
   */
  attachApproval(id: string, approvalId: string): Mission {
    const mission = this.require(id);
    if (mission.requiredApprovals.includes(approvalId)) return mission;
    const updated = { ...mission, requiredApprovals: [...mission.requiredApprovals, approvalId], updatedAt: this.now() };
    this.store.save(updated);
    return updated;
  }

  /*
   * MS-2 (ADR-0044 Decision 3): an owner commit with this mission's
   * trailer is its execution. Work attaches to approved, executing,
   * validating or blocked missions; the first commit on an approved
   * mission starts it, and the latest linked commit is the recovery
   * anchor. Re-linking the same commit changes nothing.
   */
  linkWork(
    id: string,
    commit: { sha: string; subject: string; committedAt: number },
  ): { result: "linked" | "started" | "ignored"; reason?: string } {
    const mission = this.store.get(id);
    if (!mission) return { result: "ignored", reason: "mission_not_found" };
    if (!LINKABLE.includes(mission.state)) {
      return { result: "ignored", reason: `mission_${mission.state}` };
    }
    if (mission.linkedCommits.some((linked) => linked.sha === commit.sha)) {
      return { result: "ignored", reason: "already_linked" };
    }

    const at = this.now();
    const linkedCommits = [...mission.linkedCommits, { sha: commit.sha, subject: commit.subject, committedAt: commit.committedAt }];
    /* F-36: an earlier commit linked late never moves the anchor back. */
    const latest = linkedCommits.reduce((newest, linked) => (linked.committedAt >= newest.committedAt ? linked : newest));
    let updated: Mission = {
      ...mission,
      linkedCommits,
      recoveryAnchor: latest.sha,
      updatedAt: at,
    };

    const starts = mission.state === "approved";
    if (starts) {
      updated = transitionMission(updated, "start", SYSTEM, at, `First linked commit ${commit.sha.slice(0, 8)}: ${commit.subject}`);
    }

    this.store.save(updated);
    return { result: starts ? "started" : "linked" };
  }

  /* MS-2: a Learning Record written from this mission's commits. */
  recordKnowledge(id: string, learningRecordId: string): void {
    const mission = this.store.get(id);
    if (!mission || mission.producedKnowledge.includes(learningRecordId)) return;
    this.store.save({
      ...mission,
      producedKnowledge: [...mission.producedKnowledge, learningRecordId],
      updatedAt: this.now(),
    });
  }

  /*
   * MS-2 (ADR-0044 Decision 2): a completed mission's knowledge is
   * extracted once one of its Learning Records is canonical.
   */
  extractKnowledgeWhenCanonical(isCanonical: (learningRecordId: string) => boolean): string[] {
    const extracted: string[] = [];
    for (const mission of this.store.list()) {
      if (mission.state !== "completed") continue;
      const canonical = mission.producedKnowledge.find(isCanonical);
      if (!canonical) continue;
      this.store.save(
        transitionMission(mission, "extract_knowledge", SYSTEM, this.now(), `${canonical} is canonical`),
      );
      extracted.push(mission.id);
    }
    return extracted;
  }

  private withPlan(mission: Mission, plan: MissionPlan | null, actor: MissionActor, at: number): Mission {
    if (!plan || !plan.epics.some((epic) => epic.tasks.length > 0)) {
      throw new MissionTransitionError("mission_plan_needs_a_task");
    }
    return transitionMission({ ...mission, plan }, "plan", actor, at);
  }

  private require(id: string): Mission {
    const mission = this.store.get(id);
    if (!mission) throw new MissionTransitionError("mission_not_found");
    return mission;
  }
}
