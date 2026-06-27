import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../index.js";

import {
  getRuntimeKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  RuntimeEvent,
} from "./RuntimeEvent.js";

const fileStore =
  new FileStore(
    getRuntimeKnowledgeRoot(),
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const store =
  new KnowledgeStore(
    jsonStore,
  );

export function saveRuntimeEvent(
  event: RuntimeEvent,
) {
  store.save({
    id: event.id,
    type: "runtime-event",
    version: 1,
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
    data: event,
  });
}

export function loadRuntimeEvent(
  id: string,
): RuntimeEvent | null {
  const record =
    store.load<RuntimeEvent>(
      id,
    );

  return record?.data ?? null;
}

export function listRuntimeEvents() {
  return store.list();
}

export function removeRuntimeEvent(
  id: string,
) {
  store.remove(id);
}
