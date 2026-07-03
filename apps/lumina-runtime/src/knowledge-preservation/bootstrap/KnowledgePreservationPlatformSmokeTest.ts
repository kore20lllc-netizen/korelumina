import type {
  EvidenceItem,
} from "../evidence/index.js";

import {
  createKnowledgePreservationPlatform,
} from "./createKnowledgePreservationPlatform.js";

export interface PlatformSmokeResult {
  compilerCount: number;
  normalizationCount: number;
  validationCount: number;
  publisherCount: number;
  compilerNames: string[];
}

export async function runKnowledgePreservationPlatformSmokeTest(
  evidence: EvidenceItem,
): Promise<PlatformSmokeResult> {
  const platform =
    createKnowledgePreservationPlatform();

  await platform.preserve(
    evidence,
  );

  return {
    compilerCount:
      platform.compilerRegistry
        .list().length,

    normalizationCount:
      platform.normalizationRegistry
        .list().length,

    validationCount:
      platform.validationRegistry
        .list().length,

    publisherCount:
      platform.publisherRegistry
        .list().length,

    compilerNames:
      platform.compilerRegistry
        .list()
        .map(
          (compiler) =>
            compiler.name,
        ),
  };
}
