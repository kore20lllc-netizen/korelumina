import type {
  EvidenceItem,
} from "../knowledge-preservation/evidence/index.js";

import type {
  KnowledgeAcquisitionProvider,
} from "./KnowledgeAcquisitionProvider.js";

import {
  KnowledgeAcquisitionRegistry,
} from "./KnowledgeAcquisitionRegistry.js";

export class KnowledgeAcquisitionPipeline {
  constructor(
    private readonly registry: KnowledgeAcquisitionRegistry,
  ) {}

  async acquire(): Promise<
    EvidenceItem[]
  > {
    const evidence: EvidenceItem[] =
      [];

    for (const provider of this.registry.list()) {
      evidence.push(
        ...(await this.acquireFrom(
          provider,
        )),
      );
    }

    return evidence;
  }

  private async acquireFrom(
    provider: KnowledgeAcquisitionProvider,
  ): Promise<
    readonly EvidenceItem[]
  > {
    await provider.discover();

    await provider.collect();

    return provider.emitEvidence();
  }
}
