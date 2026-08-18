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
  KnowledgePackage,
} from "./KnowledgePackage.js";

import {
  normalizeKnowledgePackage,
} from "./KnowledgePackage.js";

const packageRoot =
  resolveKnowledgeStoragePath(
    "packages",
  );

const fileStore =
  new FileStore(
    packageRoot,
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const store =
  new KnowledgeStore(
    jsonStore,
  );

export function saveKnowledgePackage(
  knowledgePackage:
    KnowledgePackage,
): void {
  store.save({
    id:
      knowledgePackage.id,

    type:
      "knowledge-package",

    version:
      1,

    createdAt:
      knowledgePackage.createdAt,

    updatedAt:
      knowledgePackage.updatedAt,

    data:
      knowledgePackage,
  });
}

export function loadKnowledgePackage(
  id: string,
): KnowledgePackage | null {
  const record =
    store.load<KnowledgePackage>(
      id,
    );

  return record?.data
    ? normalizeKnowledgePackage(
        record.data,
      )
    : null;
}

export function listKnowledgePackages():
  KnowledgePackage[] {
  return store
    .list()
    .map(
      (file) =>
        file.endsWith(".json")
          ? file.slice(0, -5)
          : file,
    )
    .map(
      (id) =>
        loadKnowledgePackage(
          id,
        ),
    )
    .filter(
      (
        knowledgePackage,
      ): knowledgePackage is KnowledgePackage =>
        knowledgePackage !== null,
    );
}


export function allocateKnowledgePackageId(
  year: number,
): string {
  const prefix =
    `KP-${year}-`;

  const sequenceFile =
    path.join(
      packageRoot,
      `.sequence-${year}`,
    );

  let currentSequence =
    0;

  if (
    fs.existsSync(
      sequenceFile,
    )
  ) {
    const raw =
      fs.readFileSync(
        sequenceFile,
        "utf8",
      ).trim();

    const parsed =
      Number.parseInt(
        raw,
        10,
      );

    if (
      Number.isSafeInteger(
        parsed,
      ) &&
      parsed >= 0
    ) {
      currentSequence =
        parsed;
    }
  }

  /*
   * The sequence counter is the authority for new governed
   * Knowledge Package identities.
   *
   * Historical deterministic/hash IDs remain readable but do
   * not influence the new sequential namespace.
   */
  for (
    let candidate =
      currentSequence + 1;
    candidate <= 999_999;
    candidate += 1
  ) {
    const id =
      `${prefix}${String(
        candidate,
      ).padStart(
        6,
        "0",
      )}`;

    if (
      loadKnowledgePackage(
        id,
      )
    ) {
      continue;
    }

    fs.mkdirSync(
      packageRoot,
      {
        recursive:
          true,
      },
    );

    fs.writeFileSync(
      sequenceFile,
      `${candidate}
`,
      "utf8",
    );

    return id;
  }

  throw new Error(
    "knowledge_package_sequence_exhausted",
  );
}


export function removeKnowledgePackageForTest(
  id: string,
): void {
  fs.rmSync(
    path.join(
      packageRoot,
      `${id}.json`,
    ),
    {
      force:
        true,
    },
  );
}
