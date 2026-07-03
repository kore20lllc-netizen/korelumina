import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import {
  createKnowledgePreservationPlatform,
} from "./createKnowledgePreservationPlatform.js";

export interface PlatformSmokeResult {
  registeredCompilers: string[];
  compiledItems: KnowledgeIRItem[];
}

export async function runKnowledgePreservationPlatformSmokeTest(
  evidence: EvidenceItem,
): Promise<PlatformSmokeResult> {
  const platform =
    createKnowledgePreservationPlatform();

  const registeredCompilers =
    platform.compilerRegistry
      .list()
      .map(
        (compiler) =>
          compiler.name,
      );

  const compiledItems =
    await platform.compilerPipeline.compile(
      evidence,
    );

  return {
    registeredCompilers,
    compiledItems,
  };
}
