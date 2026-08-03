import {
  useMemo,
  useState,
} from "react";

import {
  KnowledgeCapsuleFlowEngine,
  KnowledgeCapsuleInspector,
  knowledgeCapsules,
  knowledgeDistributionRecords,
} from "../capsules";

import {
  KnowledgeDistributionHub,
} from "../distribution";

import {
  CanonicalKnowledge,
} from "../canonical";

import {
  CanonicalReview,
} from "../governance";

import {
  OrganizationalMemory,
} from "../memory";

export function KnowledgeProductionCommandCenter() {
  const [
    selectedCapsuleId,
    setSelectedCapsuleId,
  ] = useState("");

  const selectedCapsule = useMemo(
    () =>
      knowledgeCapsules.find(
        (capsule) =>
          capsule.id === selectedCapsuleId,
      ) ?? null,
    [selectedCapsuleId],
  );

  function handleCapsuleSelect(
    capsuleId: string,
  ) {
    setSelectedCapsuleId(
      (current) =>
        current === capsuleId
          ? current
          : capsuleId,
    );

    requestAnimationFrame(() => {
      document
        .getElementById(
          "knowledge-capsule-inspector",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  return (
    <div className="grid gap-6">
      <KnowledgeCapsuleFlowEngine
        capsules={knowledgeCapsules}
        selectedCapsuleId={selectedCapsuleId}
        onCapsuleSelect={handleCapsuleSelect}
      />

      {selectedCapsule ? (
        <div
          id="knowledge-capsule-inspector"
          className="scroll-mt-6"
        >
          <KnowledgeCapsuleInspector
            capsule={selectedCapsule}
            onClose={() =>
              setSelectedCapsuleId("")
            }
          />
        </div>
      ) : null}

      <CanonicalReview />

      <CanonicalKnowledge />

      <OrganizationalMemory />

      <KnowledgeDistributionHub
        capsules={knowledgeCapsules}
        records={knowledgeDistributionRecords}
        selectedCapsuleId={selectedCapsuleId}
        onCapsuleSelect={handleCapsuleSelect}
      />
    </div>
  );
}
