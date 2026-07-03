import type {
  EvidenceItem,
} from "../knowledge-preservation/evidence/index.js";

export interface KnowledgeAcquisitionProviderMetadata {
  name: string;
  version: string;
  sourceType: string;
}

export interface KnowledgeAcquisitionProvider {
  readonly metadata: KnowledgeAcquisitionProviderMetadata;

  discover(): Promise<void>;

  collect(): Promise<readonly EvidenceItem[]>;

  emitEvidence(): Promise<readonly EvidenceItem[]>;
}
