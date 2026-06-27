import { JsonStore } from "./JsonStore.js";
import type { KnowledgeRecord } from "./types.js";

export class KnowledgeStore {
  constructor(
    private readonly store: JsonStore,
  ) {}

  save<T>(
    record: KnowledgeRecord<T>,
  ) {
    this.store.write(
      `${record.id}.json`,
      record,
    );
  }

  load<T>(
    id: string,
  ): KnowledgeRecord<T> | null {
    return this.store.read<KnowledgeRecord<T>>(
      `${id}.json`,
    );
  }

  remove(id: string) {
    this.store.remove(
      `${id}.json`,
    );
  }

  list() {
    return this.store.list();
  }
}
