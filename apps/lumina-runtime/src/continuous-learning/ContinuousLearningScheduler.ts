import type {
  ContinuousLearningCycleService,
} from "./ContinuousLearningCycleService.js";

/*
 * ADR-0042 Decision 3: while the Runtime runs, check for new owner work
 * every 30 minutes (KORELUMINA_LEARNING_INTERVAL_MINUTES; 0 turns the
 * automatic check off). The check itself only reads git; a capture runs
 * only when there are new commits.
 *
 * F-32: the first check runs one minute after start. With only the
 * interval, a Runtime restarted more often than every 30 minutes (every
 * patch, during development) never checked, and owner work went unlearned
 * and unlinked from its missions.
 */
const STARTUP_DELAY_MS = 60_000;

export function resolveLearningIntervalMinutes(
  value: string | undefined,
): number {
  if (value === undefined || value.trim() === "") return 30;
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : 30;
}

export class ContinuousLearningScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private firstCheck: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly service: Pick<ContinuousLearningCycleService, "isRunning" | "run">,
    private readonly intervalMinutes: number,
    private readonly log: (message: string) => void = console.log,
    private readonly startupDelayMs: number = STARTUP_DELAY_MS,
  ) {}

  start(): void {
    if (this.timer || this.intervalMinutes <= 0) return;
    this.firstCheck = setTimeout(() => {
      this.firstCheck = null;
      void this.tick();
    }, this.startupDelayMs);
    this.firstCheck.unref?.();
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMinutes * 60_000);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.firstCheck) clearTimeout(this.firstCheck);
    if (this.timer) clearInterval(this.timer);
    this.firstCheck = null;
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
