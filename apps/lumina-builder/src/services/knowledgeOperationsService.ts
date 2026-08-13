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

export type CanonicalReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "remediation_required";

export type CanonicalReviewDecision =
  | "approved"
  | "rejected"
  | "remediation_required";

export interface CanonicalReviewHistoryRecord {
  packageId:
    string;

  packageVersion:
    string | null;

  decision:
    CanonicalReviewDecision;

  reviewerId:
    string;

  reviewedAt:
    number;

  evidenceConsidered:
    string[];

  reason?:
    string;
}

export interface CanonicalReviewPackageView {
  id:
    string;

  state:
    string;

  approvalState:
    string;

  reviewStatus:
    CanonicalReviewStatus;

  sourceEvidenceRefs:
    string[];

  knowledgeItemIds:
    string[];

  items:
    Array<{
      id:
        string;

      title:
        string;

      summary:
        string;

      confidence:
        number;

      status:
        string;

      metadata:
        Record<
          string,
          unknown
        >;

      compiler:
        {
          compilerName:
            string;

          compilerVersion:
            string;
        };
    }>;

  provenance:
    {
      evidenceIds:
        string[];

      sourceLocations:
        string[];

      contentRefs:
        string[];

      sources:
        string[];
    };

  authority:
    string | null;

  owner:
    string | null;

  scope:
    string | null;

  version:
    string | null;

  confidence:
    number;

  destination:
    string | null;

  dependencies:
    string[];

  lineage:
    string[];

  remediation:
    {
      required:
        boolean;

      status:
        string;

      blockedItemIds:
        string[];

      updatedAt:
        number;
    };

  validationResults:
    Array<{
      itemId:
        string;

      status:
        string;

      confidence:
        number;

      blocked:
        boolean;

      details:
        Record<
          string,
          unknown
        >;
    }>;

  compilerHistory:
    Array<{
      itemId:
        string;

      compiler:
        {
          compilerName:
            string;

          compilerVersion:
            string;
        };
    }>;

  lifecycleHistory:
    Array<{
      state:
        string;

      at:
        number;

      reason?:
        string;
    }>;

  metadata:
    {
      review?:
        CanonicalReviewHistoryRecord;

      reviewHistory?:
        CanonicalReviewHistoryRecord[];

      [key:
        string]:
        unknown;
    };

  createdAt:
    number;

  updatedAt:
    number;
}

export interface CanonicalReviewSnapshot {
  ok:
    true;

  packages:
    CanonicalReviewPackageView[];

  summary:
    {
      total:
        number;

      pending:
        number;

      approved:
        number;

      rejected:
        number;

      remediationRequired:
        number;
    };
}

export async function getCanonicalReviewSnapshot():
Promise<CanonicalReviewSnapshot> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/canonical-review`,
      {
        headers:
          getRuntimeCallerHeaders(),
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "failed_to_get_canonical_review",
    );
  }

  return await response.json();
}

export async function submitCanonicalReviewDecision(
  packageId:
    string,

  decision:
    CanonicalReviewDecision,

  input:
    {
      reviewerId:
        string;

      reason?:
        string;

      evidenceConsidered?:
        string[];
    },
) {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/canonical-review`,
      {
        method:
          "POST",

        headers:
          getRuntimeCallerHeaders({
            "Content-Type":
              "application/json",
          }),

        body:
          JSON.stringify({
            packageId,

            decision,

            reviewerId:
              input.reviewerId,

            reason:
              input.reason,

            evidenceConsidered:
              input.evidenceConsidered,
          }),
      },
    );

  const body =
    await response.json();

  if (
    !response.ok
  ) {
    throw new Error(
      body?.error ??
      "failed_to_submit_canonical_review",
    );
  }

  return body;
}
