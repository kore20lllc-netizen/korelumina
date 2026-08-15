import fs from "node:fs";
import path from "node:path";

import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../../knowledge/index.js";

import type {
  KnowledgeManufacturingRun,
} from "./KnowledgeManufacturingRun.js";

import {
  normalizeKnowledgeManufacturingRun,
} from "./KnowledgeManufacturingRun.js";

function resolveRepositoryRoot(): string {
  let current =
    process.cwd();

  for (
    let depth = 0;
    depth < 8;
    depth += 1
  ) {
    const packageJson =
      path.join(
        current,
        "package.json",
      );

    const runtimePackage =
      path.join(
        current,
        "apps",
        "lumina-runtime",
        "package.json",
      );

    if (
      fs.existsSync(
        packageJson,
      ) &&
      fs.existsSync(
        runtimePackage,
      )
    ) {
      return current;
    }

    const parent =
      path.dirname(
        current,
      );

    if (
      parent ===
      current
    ) {
      break;
    }

    current =
      parent;
  }

  throw new Error(
    "korelumina_repository_root_not_found",
  );
}

const manufacturingRoot =
  path.join(
    resolveRepositoryRoot(),
    "runtime",
    "knowledge",
    "manufacturing-runs",
  );

const fileStore =
  new FileStore(
    manufacturingRoot,
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const store =
  new KnowledgeStore(
    jsonStore,
  );

export function saveKnowledgeManufacturingRun(
  run:
    KnowledgeManufacturingRun,
): void {
  store.save({
    id:
      run.id,

    type:
      "knowledge-manufacturing-run",

    version:
      1,

    createdAt:
      run.createdAt,

    updatedAt:
      run.updatedAt,

    data:
      run,
  });
}

export function loadKnowledgeManufacturingRun(
  id:
    string,
): KnowledgeManufacturingRun | null {
  const record =
    store.load<KnowledgeManufacturingRun>(
      id,
    );

  return record?.data
    ? normalizeKnowledgeManufacturingRun(
        record.data,
      )
    : null;
}

export function listKnowledgeManufacturingRuns():
  KnowledgeManufacturingRun[] {
  return store
    .list()
    .map(
      (file) =>
        file.endsWith(
          ".json",
        )
          ? file.slice(
              0,
              -5,
            )
          : file,
    )
    .map(
      (id) =>
        loadKnowledgeManufacturingRun(
          id,
        ),
    )
    .filter(
      (
        run,
      ): run is KnowledgeManufacturingRun =>
        run !==
        null,
    );
}
