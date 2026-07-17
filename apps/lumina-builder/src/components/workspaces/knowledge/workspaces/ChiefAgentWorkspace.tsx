import {
  Sparkles,
} from "lucide-react";

import {
  KnowledgeContractWorkspace,
} from "./KnowledgeContractWorkspace";

export function ChiefAgentWorkspace() {
  return (
    <KnowledgeContractWorkspace
      eyebrow="Organizational intelligence"
      title="Chief Agent"
      description="Operate the continuously improving intelligence layer that reasons over governed evidence, canonical memory, learning, risks, and priorities."
      icon={Sparkles}
      capabilities={[
        "Current understanding",
        "Engineering priorities",
        "Architectural risks",
        "Evidence requirements",
        "Improvement recommendations",
      ]}
    />
  );
}

export default ChiefAgentWorkspace;
