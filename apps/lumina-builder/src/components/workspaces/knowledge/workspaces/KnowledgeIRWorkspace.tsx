import {
  Workflow,
} from "lucide-react";

import {
  KnowledgeContractWorkspace,
} from "./KnowledgeContractWorkspace";

export function KnowledgeIRWorkspace() {
  return (
    <KnowledgeContractWorkspace
      eyebrow="Knowledge transformation"
      title="Knowledge IR"
      description="Review normalized knowledge candidates before canonical promotion, graph compilation, or Chief Agent consumption."
      icon={Workflow}
      capabilities={[
        "Candidate review",
        "Schema validation",
        "Evidence references",
        "Confidence assessment",
        "Promotion eligibility",
      ]}
    />
  );
}

export default KnowledgeIRWorkspace;
