import type {
  ContinuousLearningCycleService,
} from "./ContinuousLearningCycleService.js";

/*
 * ADR-0042 Decision 3: while the Runtime runs, check for new owner work
 * every 30 minutes (KORELUMINA_LEARNING_INTERVAL_MINUTES; 0 turns the
 * automatic check off). The check itself only reads git; a capture runs
 * only when there are new commits.
 */
export function resolveLearningIntervalMinutes(
  value: string | undefined,
): number {
  if (value === undefined || value.trim() === "") return 30;
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : 30;
}

export class ContinuousLearningScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly service: ContinuousLearningCycleService,
    private readonly intervalMinutes: number,
    private readonly log: (message: string) => void = console.log,
  ) {}

  start(): void {
    if (this.timer || this.intervalMinutes <= 0) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMinutes * 60_000);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(): Promise<void> {
    if (this.service.isRunning()) return;
    try {
      const cycle = await this.service.run("automatic");
      if (cycle.outcome !== "NO_NEW_WORK") {
        this.log(
          `[continuous-learning] ${cycle.outcome} ${cycle.commits.length} commit(s) ${cycle.reasons.join(", ")}`,
        );
      }
    } catch (error) {
      this.log(
        `[continuous-learning] check failed: ${(error as Error).message}`,
      );
    }
  }
}
