import {
  upsertKnowledgeEdge,
  upsertKnowledgeNode,
} from "./KnowledgeGraphService.js";

import type {
  KnowledgeEdge,
} from "./KnowledgeEdge.js";

import type {
  KnowledgeNode,
} from "./KnowledgeNode.js";

export function ingestNode(
  node: KnowledgeNode,
) {
  upsertKnowledgeNode(node);

  return node;
}

export function ingestNodes(
  nodes: readonly KnowledgeNode[],
) {
  nodes.forEach(ingestNode);

  return nodes;
}

export function ingestEdge(
  edge: KnowledgeEdge,
) {
  upsertKnowledgeEdge(edge);

  return edge;
}

export function ingestEdges(
  edges: readonly KnowledgeEdge[],
) {
  edges.forEach(ingestEdge);

  return edges;
}

export function ingestGraph(input: {
  nodes?: readonly KnowledgeNode[];
  edges?: readonly KnowledgeEdge[];
}) {
  if (input.nodes) {
    ingestNodes(input.nodes);
  }

  if (input.edges) {
    ingestEdges(input.edges);
  }

  return input;
}
