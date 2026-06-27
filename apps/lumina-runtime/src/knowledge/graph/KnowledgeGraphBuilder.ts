import {
  KnowledgeEdgeTypes,
  KnowledgeNodeTypes,
} from "./KnowledgeGraphSchema.js";

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

export type RepositoryProjectGraphInput = {
  repositoryId: string;
  repositoryLabel: string;
  projectId: string;
  projectLabel: string;
};

function now() {
  return Date.now();
}

export function buildRepositoryProjectGraph(
  input: RepositoryProjectGraphInput,
) {
  const timestamp =
    now();

  const repositoryNode: KnowledgeNode = {
    id:
      input.repositoryId,
    type:
      KnowledgeNodeTypes.repository,
    label:
      input.repositoryLabel,
    properties: {},
    createdAt:
      timestamp,
    updatedAt:
      timestamp,
  };

  const projectNode: KnowledgeNode = {
    id:
      input.projectId,
    type:
      KnowledgeNodeTypes.project,
    label:
      input.projectLabel,
    properties: {
      repositoryId:
        input.repositoryId,
    },
    createdAt:
      timestamp,
    updatedAt:
      timestamp,
  };

  const edge: KnowledgeEdge = {
    id:
      `${input.repositoryId}->${input.projectId}`,
    from:
      input.repositoryId,
    to:
      input.projectId,
    type:
      KnowledgeEdgeTypes.contains,
    properties: {},
    createdAt:
      timestamp,
    updatedAt:
      timestamp,
  };

  upsertKnowledgeNode(
    repositoryNode,
  );

  upsertKnowledgeNode(
    projectNode,
  );

  upsertKnowledgeEdge(
    edge,
  );

  return {
    nodes: [
      repositoryNode,
      projectNode,
    ],
    edges: [
      edge,
    ],
  };
}
