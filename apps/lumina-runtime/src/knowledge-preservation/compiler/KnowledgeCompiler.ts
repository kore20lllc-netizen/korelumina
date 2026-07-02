import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../ir/index.js";

export interface KnowledgeCompiler {
  readonly name: string;
  readonly version: string;

  supports(
    evidence: EvidenceItem,
  ): boolean;

  compile(
    evidence: EvidenceItem,
  ): Promise<KnowledgeIRItem[]>;
}
