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
  _context: KnowledgeImportContext,
): Promise<void> {
  // Integration will be added incrementally.
}
