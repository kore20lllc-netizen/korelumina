import {
  ShieldCheck,
} from "lucide-react";

import {
  KnowledgeContractWorkspace,
} from "./KnowledgeContractWorkspace";

export function GovernanceWorkspace() {
  return (
    <KnowledgeContractWorkspace
      eyebrow="Institutional control"
      title="Knowledge Governance"
      description="Control reviews, policy enforcement, exceptions, approvals, and the audited promotion of organizational knowledge."
      icon={ShieldCheck}
      capabilities={[
        "Review queues",
        "Policy enforcement",
        "Approval workflows",
        "Exception management",
        "Audited decisions",
      ]}
    />
  );
}

export default GovernanceWorkspace;
