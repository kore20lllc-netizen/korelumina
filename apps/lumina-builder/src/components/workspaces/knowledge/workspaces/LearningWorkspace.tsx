import {
  BrainCircuit,
} from "lucide-react";

import {
  KnowledgeContractWorkspace,
} from "./KnowledgeContractWorkspace";

export function LearningWorkspace() {
  return (
    <KnowledgeContractWorkspace
      eyebrow="Continuous intelligence"
      title="Learning Intelligence"
      description="Inspect validated patterns, recurring engineering signals, promotion readiness, and the evolution of Chief Agent understanding."
      icon={BrainCircuit}
      capabilities={[
        "Pattern discovery",
        "Learning validation",
        "Promotion readiness",
        "Knowledge drift detection",
        "Chief Agent learning packages",
      ]}
    />
  );
}

export default LearningWorkspace;
