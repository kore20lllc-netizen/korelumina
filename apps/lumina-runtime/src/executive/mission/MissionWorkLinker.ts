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
  ) {}

  afterCycle(cycle: LearningCycleRecord): MissionLinkOutcome[] {
    const outcomes: MissionLinkOutcome[] = [];

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
}
