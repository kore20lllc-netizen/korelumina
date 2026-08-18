import fs from "node:fs";
import path from "node:path";

import {
  resolveKnowledgeStoragePath,
} from "../storage/index.js";

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

const manufacturingRoot =
  resolveKnowledgeStoragePath(
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
