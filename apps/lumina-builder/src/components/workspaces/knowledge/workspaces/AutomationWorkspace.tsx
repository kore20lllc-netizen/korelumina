import {
  Bot,
} from "lucide-react";

import {
  KnowledgeContractWorkspace,
} from "./KnowledgeContractWorkspace";

export function AutomationWorkspace() {
  return (
    <KnowledgeContractWorkspace
      eyebrow="Improvement execution"
      title="Knowledge Automation"
      description="Operate governed improvement, synchronization, recovery, and knowledge-dependent automation without bypassing institutional controls."
      icon={Bot}
      capabilities={[
        "Execution queues",
        "Knowledge dependencies",
        "Governed actions",
        "Recovery workflows",
        "Execution history",
      ]}
    />
  );
}

export default AutomationWorkspace;
