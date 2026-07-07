import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  getRuntimeCallerHeaders,
  RUNTIME_API,
} from "@/services/runtime/client";

export async function getKnowledgeOverview():
Promise<KnowledgeOperationsSnapshot> {
  const response = await fetch(
    `${RUNTIME_API}/api/knowledge/operations`,
    {
      headers: getRuntimeCallerHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      "failed_to_get_knowledge_overview",
    );
  }

  return await response.json();
}

export async function getKnowledgeProviders() {
  const response = await fetch(
    `${RUNTIME_API}/api/knowledge/providers`,
    {
      headers: getRuntimeCallerHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      "failed_to_get_knowledge_providers",
    );
  }

  return await response.json();
}

export async function acquireRepository(
  repositoryId: string,
  repositoryRoot: string,
) {
  const response = await fetch(
    `${RUNTIME_API}/api/knowledge/repositories/${encodeURIComponent(
      repositoryId,
    )}/acquire`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        repositoryRoot,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "failed_to_acquire_repository",
    );
  }

  return await response.json();
}

export async function getRepositoryStatus(
  repositoryId: string,
) {
  const response = await fetch(
    `${RUNTIME_API}/api/knowledge/repositories/${encodeURIComponent(
      repositoryId,
    )}/status`,
    {
      headers: getRuntimeCallerHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      "failed_to_get_repository_status",
    );
  }

  return await response.json();
}

export async function getRepositoryMetrics(
  repositoryId: string,
) {
  const response = await fetch(
    `${RUNTIME_API}/api/knowledge/repositories/${encodeURIComponent(
      repositoryId,
    )}/metrics`,
    {
      headers: getRuntimeCallerHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      "failed_to_get_repository_metrics",
    );
  }

  return await response.json();
}
