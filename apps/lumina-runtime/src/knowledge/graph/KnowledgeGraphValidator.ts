import {
  loadKnowledgeEdge,
  loadKnowledgeNode,
} from "./KnowledgeGraphStore.js";

export interface KnowledgeGraphValidationReport {
  valid: boolean;

  orphanEdges: string[];

  missingNodes: string[];

  selfReferencingEdges: string[];
}

export function validateKnowledgeGraph(
  nodeIds: readonly string[],
  edgeIds: readonly string[],
): KnowledgeGraphValidationReport {
  const missingNodes: string[] = [];
  const orphanEdges: string[] = [];
  const selfReferencingEdges: string[] = [];

  const nodeSet = new Set(nodeIds);

  for (const id of nodeIds) {
    if (!loadKnowledgeNode(id)) {
      missingNodes.push(id);
    }
  }

  for (const id of edgeIds) {
    const edge = loadKnowledgeEdge(id);

    if (!edge) {
      orphanEdges.push(id);
      continue;
    }

    if (
      edge.from === edge.to
    ) {
      selfReferencingEdges.push(id);
    }

    if (
      !nodeSet.has(edge.from) ||
      !nodeSet.has(edge.to)
    ) {
      orphanEdges.push(id);
    }
  }

  return {
    valid:
      missingNodes.length === 0 &&
      orphanEdges.length === 0 &&
      selfReferencingEdges.length === 0,

    missingNodes,

    orphanEdges,

    selfReferencingEdges,
  };
}
