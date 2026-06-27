import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../index.js";

import {
  getDecisionKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  Decision,
} from "./Decision.js";

const fileStore =
  new FileStore(
    getDecisionKnowledgeRoot(),
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const store =
  new KnowledgeStore(
    jsonStore,
  );

export function saveDecision(
  decision: Decision,
) {
  store.save({
    id: decision.id,
    type: "decision",
    version: 1,
    createdAt:
      decision.createdAt,
    updatedAt:
      decision.updatedAt,
    data: decision,
  });
}

export function loadDecision(
  id: string,
): Decision | null {
  const record =
    store.load<Decision>(
      id,
    );

  return record?.data ?? null;
}

export function deleteDecision(
  id: string,
) {
  store.remove(
    id,
  );
}


export function listDecisions(): Decision[] {
  return store
    .list()
    .map((file) =>
      file.endsWith(".json")
        ? file.slice(0, -5)
        : file,
    )
    .map((id) =>
      loadDecision(id),
    )
    .filter(
      (decision): decision is Decision =>
        decision !== null,
    );
}
