import type {
  KnowledgeManufacturingRun,
  KnowledgeManufacturingStage,
} from "./KnowledgeManufacturingRun.js";

export interface KnowledgeManufacturingReplayState {
  runId:
    string;

  stage:
    KnowledgeManufacturingStage;

  stageIndex:
    number;

  totalStages:
    number;

  active:
    boolean;

  startedAt:
    number;

  updatedAt:
    number;
}

/*
 * Certification replay is deliberately ephemeral.
 *
 * It never writes to KnowledgeManufacturingRunStore and never
 * changes the authoritative manufacturing run.
 */
export class KnowledgeManufacturingReplayService {
  private state:
    KnowledgeManufacturingReplayState |
    null =
      null;

  start(
    run:
      KnowledgeManufacturingRun,
  ): KnowledgeManufacturingReplayState {
    const stages =
      this.replayableStages(
        run,
      );

    if (
      stages.length ===
      0
    ) {
      throw new Error(
        "knowledge_manufacturing_replay_history_empty",
      );
    }

    const now =
      Date.now();

    this.state = {
      runId:
        run.id,

      stage:
        stages[0],

      stageIndex:
        0,

      totalStages:
        stages.length,

      active:
        true,

      startedAt:
        now,

      updatedAt:
        now,
    };

    return {
      ...this.state,
    };
  }

  get():
    KnowledgeManufacturingReplayState |
    null {
    return this.state
      ? {
          ...this.state,
        }
      : null;
  }

  step(
    run:
      KnowledgeManufacturingRun,
  ): KnowledgeManufacturingReplayState {
    if (
      !this.state ||
      this.state.runId !==
        run.id ||
      !this.state.active
    ) {
      throw new Error(
        "knowledge_manufacturing_replay_not_active",
      );
    }

    const stages =
      this.replayableStages(
        run,
      );

    const nextIndex =
      this.state.stageIndex +
      1;

    if (
      nextIndex >=
      stages.length
    ) {
      this.state = {
        ...this.state,

        active:
          false,

        updatedAt:
          Date.now(),
      };

      return {
        ...this.state,
      };
    }

    this.state = {
      ...this.state,

      stage:
        stages[
          nextIndex
        ],

      stageIndex:
        nextIndex,

      updatedAt:
        Date.now(),
    };

    return {
      ...this.state,
    };
  }

  stop():
    KnowledgeManufacturingReplayState |
    null {
    if (
      !this.state
    ) {
      return null;
    }

    this.state = {
      ...this.state,

      active:
        false,

      updatedAt:
        Date.now(),
    };

    return {
      ...this.state,
    };
  }

  reset():
    void {
    this.state =
      null;
  }

  private replayableStages(
    run:
      KnowledgeManufacturingRun,
  ):
    KnowledgeManufacturingStage[] {
    const stages:
      KnowledgeManufacturingStage[] =
        [];

    for (
      const event
      of run.stageHistory
    ) {
      if (
        event.outcome !==
        "entered"
      ) {
        continue;
      }

      if (
        stages.at(-1) ===
        event.stage
      ) {
        continue;
      }

      stages.push(
        event.stage,
      );
    }

    return stages;
  }
}

export const knowledgeManufacturingReplayService =
  new KnowledgeManufacturingReplayService();
