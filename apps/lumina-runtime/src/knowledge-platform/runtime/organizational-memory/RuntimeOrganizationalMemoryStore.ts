
import {
  resolveKnowledgeStoragePath,
} from "../../../knowledge-preservation/storage/index.js";

import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../../../knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "../../../knowledge/organizational-memory/index.js";

export class RuntimeOrganizationalMemoryStore {
  private readonly store:
    KnowledgeStore;

  constructor(
    root =
      resolveKnowledgeStoragePath(
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
