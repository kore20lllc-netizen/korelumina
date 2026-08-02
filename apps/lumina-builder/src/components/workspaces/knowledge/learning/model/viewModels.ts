import {
  calculateEducationalCompletion,
} from "./selectors";

import type {
  EducationalArtifact,
  EducationalModule,
} from "./types";

export interface ExecutiveEducationalSummaryViewModel {
  genesisSourceCount: number;
  approvedCurriculumCount: number;
  educationalCompletion: number;
  constitutionalCoverage: number;
  unresolvedGapCount: number;
  conversationCurriculumCount: number;
  approvedConversationCount: number;
}

const APPROVED_STATES = new Set([
  "Approved",
  "Canonical",
  "Authoritative",
  "Certified",
  "Reconciled",
  "Admitted",
]);

export function createExecutiveEducationalSummary(
  artifacts: EducationalArtifact[],
  modules: EducationalModule[],
): ExecutiveEducationalSummaryViewModel {
  const approvedArtifacts =
    artifacts.filter((artifact) =>
      APPROVED_STATES.has(
        artifact.approvalState,
      ),
    );

  const conversations =
    artifacts.filter(
      (artifact) =>
        artifact.kind ===
        "conversation",
    );

  const approvedConversations =
    conversations.filter(
      (artifact) =>
        APPROVED_STATES.has(
          artifact.approvalState,
        ),
    );

  const unresolvedGapCount =
    modules.filter(
      (module) =>
        module.status ===
          "blocked" ||
        module.status ===
          "needs-review",
    ).length;

  const constitutionalArtifacts =
    artifacts.filter(
      (artifact) =>
        artifact.kind === "canon" ||
        artifact.kind ===
          "constitution" ||
        artifact.kind ===
          "amendment",
    );

  const approvedConstitutionalArtifacts =
    constitutionalArtifacts.filter(
      (artifact) =>
        APPROVED_STATES.has(
          artifact.approvalState,
        ),
    );

  const constitutionalCoverage =
    constitutionalArtifacts.length === 0
      ? 0
      : Math.round(
          (approvedConstitutionalArtifacts.length /
            constitutionalArtifacts.length) *
            100,
        );

  return {
    genesisSourceCount:
      artifacts.length,
    approvedCurriculumCount:
      approvedArtifacts.length,
    educationalCompletion:
      calculateEducationalCompletion(
        modules,
      ),
    constitutionalCoverage,
    unresolvedGapCount,
    conversationCurriculumCount:
      conversations.length,
    approvedConversationCount:
      approvedConversations.length,
  };
}
