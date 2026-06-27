import {
  recordProjectKnowledge,
} from "./project/index.js";

import {
  recordRepositoryKnowledge,
} from "./repository/index.js";

import {
  populateImportKnowledgeGraph,
} from "./graph/index.js";

export interface KnowledgeImportContext {
  projectId: string;

  projectPath: string;

  repositoryId: string;

  repoUrl: string;

  owner: string;

  repo: string;

  framework: string;
}

export async function recordImportKnowledge(
  context: KnowledgeImportContext,
): Promise<void> {
  await recordRepositoryKnowledge({
    projectId:
      context.projectId,
    projectPath:
      context.projectPath,
    repoUrl:
      context.repoUrl,
    owner:
      context.owner,
    repo:
      context.repo,
    framework:
      context.framework,
  });

  await recordProjectKnowledge({
    projectId:
      context.projectId,
    repositoryId:
      context.repositoryId,
    name:
      context.repo,
    framework:
      context.framework,
    workspace:
      "default",
    runtimeRoot:
      context.projectPath,
    sourceUrl:
      context.repoUrl,
  });

  populateImportKnowledgeGraph({
    repositoryId:
      context.repositoryId,
    repositoryLabel:
      `${context.owner}/${context.repo}`,
    projectId:
      context.projectId,
    projectLabel:
      context.repo,
  });
}
