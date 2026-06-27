import {
  buildRepositoryProjectGraph,
} from "./KnowledgeGraphBuilder.js";

export interface ImportGraphPopulationInput {
  repositoryId: string;

  repositoryLabel: string;

  projectId: string;

  projectLabel: string;
}

export function populateImportKnowledgeGraph(
  input: ImportGraphPopulationInput,
) {
  return buildRepositoryProjectGraph({
    repositoryId:
      input.repositoryId,
    repositoryLabel:
      input.repositoryLabel,
    projectId:
      input.projectId,
    projectLabel:
      input.projectLabel,
  });
}
