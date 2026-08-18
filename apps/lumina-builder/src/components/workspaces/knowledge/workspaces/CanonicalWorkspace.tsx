import {
  BookOpenCheck,
} from "lucide-react";

import {
  KnowledgeContractWorkspace,
} from "./KnowledgeContractWorkspace";

export function CanonicalWorkspace() {
  return (
    <KnowledgeContractWorkspace
      eyebrow="Institutional memory"
      title="Canonical Memory"
      description="Operate the governed record of validated organizational knowledge, publication history, confidence, and version evolution."
      icon={BookOpenCheck}
      capabilities={[
        "Canonical review",
        "Governed promotion",
        "Publication history",
        "Version lineage",
        "Confidence governance",
      ]}
    />
  );
}

export default CanonicalWorkspace;
