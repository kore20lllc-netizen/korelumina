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
      method:
        "GET",

      cache:
        "no-store",
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


export type CanonicalReviewRisk =
  | "blocked"
  | "critical"
  | "standard"
  | "low";

export type CanonicalReviewMode =
  | "blocked"
  | "individual"
  | "batch_candidate"
  | "policy_candidate";

export interface CanonicalReviewClassification {
  packageId:
    string;

  risk:
    CanonicalReviewRisk;

  mode:
    CanonicalReviewMode;

  reasons:
    string[];

  policyId?:
    string;
}


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

  reviewClassification:
    CanonicalReviewClassification | null;


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

      individual:
        number;

      batchCandidates:
        number;

      policyCandidates:
        number;

      blocked:
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


export type CanonicalReviewBatchStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "remediation_required";

export interface CanonicalReviewBatchView {
  id:
    string;

  packageIds:
    string[];

  status:
    CanonicalReviewBatchStatus;

  reviewerId:
    string | null;

  decision:
    CanonicalReviewDecision | null;

  reason:
    string | null;

  createdAt:
    number;

  reviewedAt:
    number | null;
}

export interface CanonicalReviewBatchSnapshot {
  ok:
    true;

  batches:
    CanonicalReviewBatchView[];

  summary: {
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

export async function getCanonicalReviewBatches():
Promise<CanonicalReviewBatchSnapshot> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/canonical-review/batches`,
      {
        headers:
          getRuntimeCallerHeaders(),
      },
    );

  const body =
    await response.json();

  if (
    !response.ok
  ) {
    throw new Error(
      body?.error ??
      "failed_to_get_canonical_review_batches",
    );
  }

  return body;
}

export async function createCanonicalReviewBatch(
  packageIds:
    string[],
) {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/canonical-review/batches`,
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
            packageIds,
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
      "failed_to_create_canonical_review_batch",
    );
  }

  return body as {
    ok: true;
    batch: CanonicalReviewBatchView;
  };
}

export async function submitCanonicalReviewBatchDecision(
  batchId:
    string,

  decision:
    CanonicalReviewDecision,

  input: {
    reviewerId:
      string;

    reason?:
      string;
  },
) {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/canonical-review/batches/${encodeURIComponent(
        batchId,
      )}/decision`,
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
            decision,

            reviewerId:
              input.reviewerId,

            reason:
              input.reason,
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
      "failed_to_submit_canonical_review_batch_decision",
    );
  }

  return body as {
    ok: true;
    batch: CanonicalReviewBatchView;
    promotion: null;
  };
}

export type CanonicalReviewPolicyStatus =
  | "draft"
  | "active"
  | "revoked"
  | "superseded";

export interface CanonicalReviewPolicyView {
  id:
    string;

  version:
    string;

  status:
    CanonicalReviewPolicyStatus;

  title:
    string;

  authority:
    string;

  scope:
    string;

  owner:
    string;

  authorizedBy:
    string;

  authorizedAt:
    number;

  createdAt:
    number;

  updatedAt:
    number;

  supersedes:
    string[];

  supersededBy:
    string | null;

  rules: {
    requireCompleteGovernanceIdentity:
      boolean;

    requireProvenance:
      boolean;

    requireValidationPassed:
      boolean;

    excludedAuthorities:
      string[];
  };
}

export interface CanonicalReviewPolicySnapshot {
  ok:
    true;

  policies:
    CanonicalReviewPolicyView[];

  summary: {
    total:
      number;

    active:
      number;

    draft:
      number;

    revoked:
      number;

    superseded:
      number;
  };
}

export async function getCanonicalReviewPolicies():
Promise<CanonicalReviewPolicySnapshot> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/canonical-review/policies`,
      {
        headers:
          getRuntimeCallerHeaders(),
      },
    );

  const body =
    await response.json();

  if (
    !response.ok
  ) {
    throw new Error(
      body?.error ??
      "failed_to_get_canonical_review_policies",
    );
  }

  return body;
}

export type KnowledgeManufacturingStage =
  | "Evidence Intake"
  | "Documentation Compiler"
  | "Conversation Compiler"
  | "Git Compiler"
  | "Runtime Compiler"
  | "Mission Compiler"
  | "Execution Compiler"
  | "Knowledge IR"
  | "Validation"
  | "Knowledge Package Assembly"
  | "Canonical Review"
  | "Canonical Knowledge";

export type KnowledgeManufacturingStageOutcome =
  | "entered"
  | "processing"
  | "completed"
  | "not_applicable"
  | "awaiting_human_review"
  | "approved"
  | "published"
  | "blocked"
  | "failed";

export interface KnowledgeManufacturingStageEvent {
  stage:
    KnowledgeManufacturingStage;

  outcome:
    KnowledgeManufacturingStageOutcome;

  at:
    number;

  detail?:
    string;
}

export interface KnowledgeManufacturingRunView {
  id:
    string;

  evidenceId:
    string;

  currentStage:
    KnowledgeManufacturingStage;

  status:
    | "active"
    | "blocked"
    | "failed"
    | "completed";

  packageId?:
    string;

  canonicalKnowledgeIds:
    string[];

  stageHistory:
    KnowledgeManufacturingStageEvent[];

  createdAt:
    number;

  updatedAt:
    number;
}

export interface KnowledgeProductionLifecycleSnapshot {
  ok:
    true;

  manufacturingRuns:
    KnowledgeManufacturingRunView[];

  manufacturingReplay:
    {
      runId:
        string;

      stage:
        KnowledgeManufacturingStage;

      stageIndex:
        number;

      totalStages:
        number;

      active:
        boolean;

      startedAt:
        number;

      updatedAt:
        number;
    } |
    null;

  packages:
    CanonicalReviewPackageView[];

  canonicalItems:
    Array<{
      id:
        string;

      type:
        string;

      title:
        string;

      summary:
        string;

      confidence:
        number;

      evidenceRefs:
        string[];

      relationships:
        Record<
          string,
          string[]
        >;

      createdAt:
        number;

      updatedAt:
        number;

      status:
        string;

      metadata:
        Record<
          string,
          unknown
        >;
    }>;

  organizationalMemory:
    Array<{
      id:
        string;

      organizationId:
        string;

      projectId?:
        string;

      teamId?:
        string;

      title:
        string;

      summary:
        string;

      source:
        string;

      references:
        string[];

      governance?:
        Record<
          string,
          unknown
        >;

      createdAt:
        string;
    }>;

  summary: {
    manufacturingRuns:
      number;

    activeManufacturingRuns:
      number;

    blockedManufacturingRuns:
      number;

    failedManufacturingRuns:
      number;

    completedManufacturingRuns:
      number;

    packages:
      number;

    awaitingReview:
      number;

    approved:
      number;

    canonical:
      number;

    adapted:
      number;

    canonicalItems:
      number;

    organizationalMemory:
      number;
  };
}

export async function getKnowledgeProductionLifecycleSnapshot():
Promise<KnowledgeProductionLifecycleSnapshot> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/production-lifecycle`,
      {
        headers:
          getRuntimeCallerHeaders(),
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "failed_to_get_knowledge_production_lifecycle",
    );
  }

  return await response.json();
}
