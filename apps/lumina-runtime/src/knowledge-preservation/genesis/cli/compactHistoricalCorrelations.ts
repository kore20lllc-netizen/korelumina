/*
 * MS-2026-0010 (F-38): convert full correlation copies to revisions.
 *
 *   npm run genesis:compact-correlations            preview, changes nothing
 *   npm run genesis:compact-correlations -- --write convert, backing up originals
 *
 * Stop Runtime first. The designated replay is never rewritten. With
 * --write, every original is copied to
 * runtime-data/genesis/historical-correlation-backup/<time>/ before it is
 * replaced, and each converted record is loaded back and compared with
 * the original. Deleting the backup is a separate owner decision.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";

import path from "node:path";

import {
  parseArgs,
} from "node:util";

import {
  getRuntimeDataRoot,
} from "../../../projects/workspacePaths.js";

import {
  compactGenesisHistoricalCorrelations,
} from "../GenesisHistoricalCorrelationCompaction.js";

import {
  FileGenesisHistoricalCorrelationPersistenceStore,
} from "../GenesisHistoricalCorrelationPersistence.js";

import {
  FileGenesisReplayPersistenceStore,
} from "../GenesisReplayPersistence.js";

import {
  FileGenesisRuntimeReplayDesignationStore,
} from "../GenesisRuntimeReplayDesignation.js";

import type {
  GenesisReplayId,
} from "../GenesisReplayIdentity.js";

const { values } =
  parseArgs({
    options: {
      write: {
        type:
          "boolean",
        default:
          false,
      },

      "runtime-data": {
        type:
          "string",
      },
    },
  });

const runtimeData =
  path.resolve(
    values["runtime-data"] ??
    getRuntimeDataRoot(),
  );

const genesis =
  path.join(
    runtimeData,
    "genesis",
  );

const correlations =
  new FileGenesisHistoricalCorrelationPersistenceStore({
    storageRoot:
      path.join(
        genesis,
        "historical-correlation",
      ),
  });

const replays =
  new FileGenesisReplayPersistenceStore({
    storageRoot:
      path.join(
        genesis,
        "replays",
      ),
  });

const designation =
  new FileGenesisRuntimeReplayDesignationStore({
    storageRoot:
      genesis,
  }).load();

if (
  !designation
) {
  console.error(
    "No designated replay: nothing can serve as the base. Nothing changed.",
  );
  process.exit(1);
}

/* Each replay folder's execution names its replay. */
const replayIds:
  GenesisReplayId[] =
    [];

for (
  const folder
  of readdirSync(
    path.join(
      genesis,
      "replays",
    ),
    {
      withFileTypes:
        true,
    },
  )
) {
  const executionFile =
    path.join(
      genesis,
      "replays",
      folder.name,
      "execution.json",
    );

  if (
    !folder.isDirectory() ||
    !existsSync(
      executionFile,
    )
  ) {
    continue;
  }

  const replayId =
    (
      JSON.parse(
        readFileSync(
          executionFile,
          "utf8",
        ),
      ) as {
        plan?: {
          replayId?:
            GenesisReplayId;
        };
      }
    ).plan?.replayId;

  if (
    replayId &&
    existsSync(
      correlations.pathsFor(
        replayId,
      ).correlationFile,
    )
  ) {
    replayIds.push(
      replayId,
    );
  }
}

const backupDirectory =
  path.join(
    genesis,
    "historical-correlation-backup",
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-",
      ),
  );

const entries =
  compactGenesisHistoricalCorrelations({
    correlations,

    replayIds,

    loadExecution:
      replayId =>
        replays.loadExecution(
          replayId,
        ),

    protectedReplayIds: [
      designation.replayId,
    ],

    write:
      values.write
        ? {
            backupDirectory,
          }
        : undefined,
  });

const megabytes =
  (
    bytes:
      number,
  ) =>
    `${(bytes / 1e6).toFixed(1)} MB`;

const counts =
  new Map<string, number>();

for (
  const item
  of entries
) {
  counts.set(
    item.action,
    (counts.get(item.action) ?? 0) + 1,
  );

  if (
    item.action ===
      "convert" ||
    item.action ===
      "no-base" ||
    item.action ===
      "no-execution"
  ) {
    console.log(
      `${item.action.padEnd(14)} ${item.replayId}${item.baseReplayId ? ` on ${item.baseReplayId.slice(0, 30)}` : ""}  ${megabytes(item.bytesBefore)}`,
    );
  }
}

const converted =
  entries.filter(
    item =>
      item.action ===
      "convert",
  );

const before =
  entries.reduce(
    (
      sum,
      item,
    ) =>
      sum +
      item.bytesBefore,
    0,
  );

const after =
  entries.reduce(
    (
      sum,
      item,
    ) =>
      sum +
      (item.action === "convert" && !values.write
        ? 0
        : item.bytesAfter),
    0,
  );

console.log(
  `\n${[...counts].map(([action, count]) => `${count} ${action}`).join(", ")}`,
);

if (
  values.write
) {
  console.log(
    `Converted ${converted.length}: ${megabytes(before)} to ${megabytes(after)}. Originals backed up in ${path.relative(process.cwd(), backupDirectory)}.`,
  );
} else {
  console.log(
    `Preview only: ${converted.length} would convert, ${megabytes(before)} to about ${megabytes(after)} plus their small records. Run with --write to convert.`,
  );
}
