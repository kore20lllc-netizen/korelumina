import {
  buildRepositoryProjectGraph,
} from "./KnowledgeGraphBuilder.js";

import type {
  RepositoryProjectGraphInput,
} from "./KnowledgeGraphBuilder.js";

/**
 * Synchronizes knowledge domains with the Knowledge Graph.
 *
 * This service owns synchronization workflows.
 * Relationship construction remains the responsibility
 * of the KnowledgeGraphBuilder.
 */
export function synchronizeImportGraph(
  input: RepositoryProjectGraphInput,
) {
  return buildRepositoryProjectGraph(
    input,
  );
}
