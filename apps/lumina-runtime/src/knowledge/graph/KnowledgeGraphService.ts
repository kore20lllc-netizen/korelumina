import type {
  KnowledgeNode,
} from "./KnowledgeNode.js";

import type {
  KnowledgeEdge,
} from "./KnowledgeEdge.js";

import {
  saveKnowledgeNode,
  saveKnowledgeEdge,
} from "./KnowledgeGraphStore.js";

export function upsertKnowledgeNode(
  node: KnowledgeNode,
) {
  saveKnowledgeNode(
    node,
  );

  return node;
}

export function upsertKnowledgeEdge(
  edge: KnowledgeEdge,
) {
  saveKnowledgeEdge(
    edge,
  );

  return edge;
}
