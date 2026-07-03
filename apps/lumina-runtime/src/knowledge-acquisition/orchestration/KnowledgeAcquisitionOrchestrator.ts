import type {
  EvidenceItem,
} from "../../knowledge-preservation/evidence/index.js";

import {
  runtimeKnowledgeProvider,
} from "../../knowledge-platform/runtime/index.js";

import {
  KnowledgeAcquisitionPipeline,
} from "../KnowledgeAcquisitionPipeline.js";

export interface KnowledgeAcquisitionOrchestrationReport {
  acquiredEvidence: number;
  preservedEvidence: number;
}

export class KnowledgeAcquisitionOrchestrator {
  constructor(
    private readonly pipeline: KnowledgeAcquisitionPipeline,
  ) {}

  async run(): Promise<KnowledgeAcquisitionOrchestrationReport> {
    const evidence =
      await this.pipeline.acquire();

    await this.preserveEvidence(
      evidence,
    );

    return {
      acquiredEvidence:
        evidence.length,

      preservedEvidence:
        evidence.length,
    };
  }

  private async preserveEvidence(
    evidence: readonly EvidenceItem[],
  ): Promise<void> {
    const platform =
      runtimeKnowledgeProvider
        .getPlatform();

    for (const item of evidence) {
      await platform.preserve(
        item,
      );
    }
  }
}
