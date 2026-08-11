import fs from "node:fs";
import path from "node:path";

import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../../../knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "../../../knowledge/organizational-memory/index.js";

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
      fs.existsSync(packageJson) &&
      fs.existsSync(runtimePackage)
    ) {
      return current;
    }

    const parent =
      path.dirname(
        current,
      );

    if (
      parent === current
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

export class RuntimeOrganizationalMemoryStore {
  private readonly store:
    KnowledgeStore;

  constructor(
    root =
      path.join(
        resolveRepositoryRoot(),
        "runtime",
        "knowledge",
        "organizational-memory",
      ),
  ) {
    const fileStore =
      new FileStore(
        root,
      );

    const jsonStore =
      new JsonStore(
        fileStore,
      );

    this.store =
      new KnowledgeStore(
        jsonStore,
      );
  }

  save(
    record:
      OrganizationalMemoryRecord,
  ): void {
    this.store.save({
      id:
        record.id,

      type:
        "organizational-memory-record",

      version:
        1,

      createdAt:
        Date.parse(
          record.createdAt,
        ),

      updatedAt:
        Date.now(),

      data:
        record,
    });
  }

  saveAll(
    records:
      readonly OrganizationalMemoryRecord[],
  ): void {
    for (
      const record
      of records
    ) {
      this.save(
        record,
      );
    }
  }

  list():
    OrganizationalMemoryRecord[] {
    return this.store
      .list()
      .filter(
        (file) =>
          file.endsWith(
            ".json",
          ),
      )
      .map(
        (file) =>
          file.slice(
            0,
            -5,
          ),
      )
      .map(
        (id) =>
          this.store.load<
            OrganizationalMemoryRecord
          >(
            id,
          ),
      )
      .filter(
        (
          record,
        ): record is NonNullable<
          typeof record
        > =>
          record !== null,
      )
      .filter(
        (record) =>
          record.type ===
          "organizational-memory-record",
      )
      .map(
        (record) =>
          record.data,
      );
  }
}
