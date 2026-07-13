import {
  execFile,
} from "node:child_process";

import {
  totalmem,
} from "node:os";

import {
  promisify,
} from "node:util";

import type {
  Express,
} from "express";

import {
  getRuntimeScenario,
} from "../runtime/scenario/RuntimeScenarioService.js";

import {
  getRuntimeEventClientCount,
} from "../runtime/eventBus.js";

import {
  isPidAlive,
  listRuntimes,
  serializeRuntime,
} from "../runtime/registry.js";

import {
  getAllRestartStates,
} from "../runtime/startProject.js";

import {
  getWorkspaceWatcherCount,
} from "../runtime/workspaceWatcher.js";

const execFileAsync =
  promisify(execFile);

const PROCESS_SAMPLE_TIMEOUT_MS =
  2_000;

const PROCESS_SAMPLE_MAX_BUFFER =
  1024 * 1024;

interface ProcessRow {
  pid: number;
  parentPid: number;
  cpuPct: number;
  rssKb: number;
}

interface ProcessTelemetry {
  cpuPct: number;
  rssMb: number;
  processCount: number;
}

function roundMetric(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return (
    Math.round(value * 100) /
    100
  );
}

function getMemoryMb() {
  const usage =
    process.memoryUsage();

  return {
    rssMb:
      Math.round(
        usage.rss /
          1024 /
          1024,
      ),

    heapUsedMb:
      Math.round(
        usage.heapUsed /
          1024 /
          1024,
      ),

    heapTotalMb:
      Math.round(
        usage.heapTotal /
          1024 /
          1024,
      ),

    externalMb:
      Math.round(
        usage.external /
          1024 /
          1024,
      ),
  };
}

function parseProcessRows(
  stdout: string,
): ProcessRow[] {
  const rows:
    ProcessRow[] = [];

  for (
    const line of
    stdout.split(/\r?\n/)
  ) {
    const normalized =
      line.trim();

    if (!normalized) {
      continue;
    }

    const parts =
      normalized.split(/\s+/);

    if (parts.length < 4) {
      continue;
    }

    const pid =
      Number.parseInt(
        parts[0],
        10,
      );

    const parentPid =
      Number.parseInt(
        parts[1],
        10,
      );

    const cpuPct =
      Number.parseFloat(
        parts[2],
      );

    const rssKb =
      Number.parseFloat(
        parts[3],
      );

    if (
      !Number.isFinite(pid) ||
      !Number.isFinite(
        parentPid,
      )
    ) {
      continue;
    }

    rows.push({
      pid,
      parentPid,
      cpuPct:
        Number.isFinite(
          cpuPct,
        )
          ? cpuPct
          : 0,

      rssKb:
        Number.isFinite(
          rssKb,
        )
          ? rssKb
          : 0,
    });
  }

  return rows;
}

function collectProcessTreeIds(
  rootPid: number,
  rows: ProcessRow[],
): Set<number> {
  const processIds =
    new Set<number>([
      rootPid,
    ]);

  let changed = true;

  while (changed) {
    changed = false;

    for (
      const row of rows
    ) {
      if (
        processIds.has(
          row.pid,
        )
      ) {
        continue;
      }

      if (
        processIds.has(
          row.parentPid,
        )
      ) {
        processIds.add(
          row.pid,
        );

        changed = true;
      }
    }
  }

  return processIds;
}

async function readUnixProcessTable(): Promise<
  ProcessRow[]
> {
  const {
    stdout,
  } = await execFileAsync(
    "ps",
    [
      "-axo",
      "pid=",
      "-o",
      "ppid=",
      "-o",
      "%cpu=",
      "-o",
      "rss=",
    ],
    {
      timeout:
        PROCESS_SAMPLE_TIMEOUT_MS,

      maxBuffer:
        PROCESS_SAMPLE_MAX_BUFFER,
    },
  );

  return parseProcessRows(
    stdout,
  );
}

async function sampleProcessTree(
  rootPid?: number,
  processRows?: ProcessRow[],
): Promise<ProcessTelemetry> {
  if (
    !rootPid ||
    !isPidAlive(rootPid)
  ) {
    return {
      cpuPct: 0,
      rssMb: 0,
      processCount: 0,
    };
  }

  if (
    process.platform ===
    "win32"
  ) {
    return {
      cpuPct: 0,
      rssMb: 0,
      processCount: 1,
    };
  }

  try {
    const rows =
      processRows ??
      await readUnixProcessTable();

    const treeIds =
      collectProcessTreeIds(
        rootPid,
        rows,
      );

    let cpuPct = 0;
    let rssKb = 0;
    let processCount = 0;

    for (
      const row of rows
    ) {
      if (
        !treeIds.has(
          row.pid,
        )
      ) {
        continue;
      }

      cpuPct +=
        row.cpuPct;

      rssKb +=
        row.rssKb;

      processCount += 1;
    }

    return {
      cpuPct:
        roundMetric(
          Math.max(
            0,
            cpuPct,
          ),
        ),

      rssMb:
        roundMetric(
          Math.max(
            0,
            rssKb / 1024,
          ),
        ),

      processCount,
    };
  } catch {
    return {
      cpuPct: 0,
      rssMb: 0,
      processCount: 0,
    };
  }
}

export function registerMetricsRoute(
  app: Express,
) {
  app.get(
    "/api/runtime/metrics",
    async (_req, res) => {
      try {
        const now =
          Date.now();

        const systemMemoryMb =
          Math.round(
            totalmem() /
              1024 /
              1024,
          );

        let processRows:
          ProcessRow[] = [];

        if (
          process.platform !==
          "win32"
        ) {
          try {
            processRows =
              await readUnixProcessTable();
          } catch {
            processRows = [];
          }
        }

        const runtimes =
          await Promise.all(
            listRuntimes().map(
              async (
                runtime,
              ) => {
                const publicRuntime =
                  serializeRuntime(
                    runtime,
                  );

                const alive =
                  isPidAlive(
                    publicRuntime.pid,
                  );

                const telemetry =
                  alive
                    ? await sampleProcessTree(
                        publicRuntime.pid,
                        processRows,
                      )
                    : {
                        cpuPct: 0,
                        rssMb: 0,
                        processCount: 0,
                      };

                return {
                  projectId:
                    publicRuntime.projectId,

                  scenario:
                    getRuntimeScenario(
                      publicRuntime.projectId,
                    ),

                  framework:
                    publicRuntime.framework,

                  status:
                    publicRuntime.status,

                  port:
                    publicRuntime.port,

                  pid:
                    publicRuntime.pid,

                  url:
                    publicRuntime.url,

                  alive,

                  uptimeMs:
                    publicRuntime.startedAt
                      ? now -
                        publicRuntime.startedAt
                      : 0,

                  startedAt:
                    publicRuntime.startedAt,

                  exitedAt:
                    publicRuntime.exitedAt ??
                    null,

                  lastError:
                    publicRuntime.lastError ??
                    null,

                  logLines:
                    publicRuntime.logs.length,

                  cpuPct:
                    telemetry.cpuPct,

                  rssMb:
                    telemetry.rssMb,

                  systemMemoryMb,

                  processCount:
                    telemetry.processCount,
                };
              },
            ),
          );

        return res.json({
          ok: true,

          service:
            "lumina-runtime",

          timestamp:
            Date.now(),

          process: {
            pid:
              process.pid,

            uptimeMs:
              Math.round(
                process.uptime() *
                  1_000,
              ),

            memory:
              getMemoryMb(),
          },

          system: {
            memoryTotalMb:
              systemMemoryMb,
          },

          totals: {
            eventClients:
              getRuntimeEventClientCount(),

            workspaceWatchers:
              getWorkspaceWatcherCount(),

            runtimes:
              runtimes.length,

            running:
              runtimes.filter(
                (runtime) =>
                  runtime.status ===
                  "running",
              ).length,

            starting:
              runtimes.filter(
                (runtime) =>
                  runtime.status ===
                  "starting",
              ).length,

            exited:
              runtimes.filter(
                (runtime) =>
                  runtime.status ===
                  "exited",
              ).length,

            error:
              runtimes.filter(
                (runtime) =>
                  runtime.status ===
                  "error",
              ).length,
          },

          restarts:
            getAllRestartStates(),

          runtimes,
        });
      } catch (error) {
        console.error(
          "[runtime/metrics]",
          error,
        );

        return res
          .status(500)
          .json({
            ok: false,

            error:
              error instanceof
              Error
                ? error.message
                : "failed_to_get_metrics",
          });
      }
    },
  );
}
