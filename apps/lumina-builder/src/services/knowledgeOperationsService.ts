import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  runtimeApi,
} from "./runtimeApi";

export async function getKnowledgeOverview():
Promise<KnowledgeOperationsSnapshot> {
  return runtimeApi.getKnowledgeOverview();
}

export async function getKnowledgeProviders() {
  return runtimeApi.getKnowledgeProviders();
}

export async function acquireRepository(
  repositoryId: string,
  repositoryRoot: string,
) {
  return runtimeApi.acquireKnowledgeRepository(
    repositoryId,
    repositoryRoot,
  );
}

export async function getRepositoryStatus(
  repositoryId: string,
) {
  return runtimeApi.getKnowledgeRepositoryStatus(
    repositoryId,
  );
}

export async function getRepositoryMetrics(
  repositoryId: string,
) {
  return runtimeApi.getKnowledgeRepositoryMetrics(
    repositoryId,
  );
}
