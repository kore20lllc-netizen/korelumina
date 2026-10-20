import type {
  LearningCycleRecord,
  MissionLinkOutcome,
} from "../../continuous-learning/ContinuousLearningLedger.js";
import type { MissionService } from "./MissionService.js";

/*
 * MS-2 (ADR-0044 Decision 3): after a learning cycle captures owner
 * commits, attach those that carry a "Mission:" trailer to their missions,
 * record the window's Learning Record as the missions' produced knowledge,
 * and extract knowledge for completed missions whose Learning Record is
 * now canonical. Only captured windows count: a held window contains a
 * non-owner commit and attaches nothing (ADR-0042).
 */
export class MissionWorkLinker {
  constructor(
    private readonly missions: MissionService,
    private readonly isCanonicalLearningRecord: (learningRecordId: string) => boolean,
    /* MS-4: new commits change the evidence; re-evaluate missions in execution. */
    private readonly evaluate?: () => void,
    /*
     * F-36: cycles already recorded. A commit belongs to the mission its
     * trailer names (ADR-0044 Decision 3) whenever the mission is approved,
     * including a commit learned before the owner approved it.
     */
    private readonly recordedCycles?: () => readonly LearningCycleRecord[],
  ) {}

  afterCycle(cycle: LearningCycleRecord): MissionLinkOutcome[] {
    const outcomes: MissionLinkOutcome[] = this.linkLearnedWork(cycle.cycleId);

    if (cycle.outcome === "CAPTURED") {
      const touched = new Set<string>();
      for (const commit of cycle.commits) {
        for (const missionId of commit.missions ?? []) {
          const outcome = this.missions.linkWork(missionId, commit);
          outcomes.push({ missionId, sha: commit.sha, ...outcome });
          if (outcome.result !== "ignored" || outcome.reason === "already_linked") touched.add(missionId);
        }
      }

      const recordId = cycle.learning?.recordId;
      if (recordId) {
        for (const missionId of touched) this.missions.recordKnowledge(missionId, recordId);
      }
    }

    this.evaluate?.();
    this.missions.extractKnowledgeWhenCanonical(this.isCanonicalLearningRecord);
    return outcomes;
  }

  /*
   * F-36: commits from earlier captured cycles whose mission was not yet
   * approved when they were learned. Oldest first, so the first commit is
   * the one that starts the mission; only actual links are reported.
   */
  private linkLearnedWork(currentCycleId: string): MissionLinkOutcome[] {
    if (!this.recordedCycles) return [];
    const outcomes: MissionLinkOutcome[] = [];
    const earlier = [...this.recordedCycles()]
      .filter((past) => past.cycleId !== currentCycleId && past.outcome === "CAPTURED")
      .sort((left, right) => left.startedAt - right.startedAt);

    for (const past of earlier) {
      for (const commit of past.commits) {
        for (const missionId of commit.missions ?? []) {
          const mission = this.missions.get(missionId);
          if (!mission || mission.linkedCommits.some((linked) => linked.sha === commit.sha)) continue;
          const outcome = this.missions.linkWork(missionId, commit);
          if (outcome.result === "ignored") continue;
          outcomes.push({ missionId, sha: commit.sha, ...outcome, fromCycleId: past.cycleId });
          const recordId = past.learning?.recordId;
          if (recordId) this.missions.recordKnowledge(missionId, recordId);
        }
      }
    }
    return outcomes;
  }
}
