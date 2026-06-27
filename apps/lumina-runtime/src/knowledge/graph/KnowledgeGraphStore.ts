import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../index.js";

import {
  getKnowledgeGraphRoot,
} from "../../projects/knowledgePaths.js";

import type {
  KnowledgeNode,
} from "./KnowledgeNode.js";

import type {
  KnowledgeEdge,
} from "./KnowledgeEdge.js";

const nodeStore =
  new KnowledgeStore(
    new JsonStore(
      new FileStore(
        `${getKnowledgeGraphRoot()}/nodes`,
      ),
    ),
  );

const edgeStore =
  new KnowledgeStore(
    new JsonStore(
      new FileStore(
        `${getKnowledgeGraphRoot()}/edges`,
      ),
    ),
  );

export function saveKnowledgeNode(
  node: KnowledgeNode,
) {
  nodeStore.save({
    id: node.id,
    type: "knowledge-node",
    version: 1,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    data: node,
  });
}

export function loadKnowledgeNode(
  id: string,
): KnowledgeNode | null {
  const record =
    nodeStore.load<KnowledgeNode>(
      id,
    );

  return record?.data ?? null;
}

export function saveKnowledgeEdge(
  edge: KnowledgeEdge,
) {
  edgeStore.save({
    id: edge.id,
    type: "knowledge-edge",
    version: 1,
    createdAt: edge.createdAt,
    updatedAt: edge.updatedAt,
    data: edge,
  });
}

export function loadKnowledgeEdge(
  id: string,
): KnowledgeEdge | null {
  const record =
    edgeStore.load<KnowledgeEdge>(
      id,
    );

  return record?.data ?? null;
}
