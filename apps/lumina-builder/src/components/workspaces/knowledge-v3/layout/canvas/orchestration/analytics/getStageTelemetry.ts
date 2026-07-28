import {
  KNOWLEDGE_PACKAGES,
  KNOWLEDGE_STAGES,
} from "../data/knowledgePackages";

export type KnowledgeStage =
  (typeof KNOWLEDGE_STAGES)[number];

export interface StageTelemetry {
  packageCount: number;
  averageConfidence: number;
  acceptedProportion: number;
}

export function getStageTelemetry(
  stage: KnowledgeStage,
): StageTelemetry {
  const packages =
    KNOWLEDGE_PACKAGES.filter(
      (pkg) => pkg.stage === stage,
    );

  if (packages.length === 0) {
    return {
      packageCount: 0,
      averageConfidence: 0,
      acceptedProportion: 0,
    };
  }

  return {
    packageCount: packages.length,
    averageConfidence: Math.round(
      packages.reduce(
        (sum, pkg) => sum + pkg.confidence,
        0,
      ) / packages.length,
    ),
    acceptedProportion: Math.round(
      packages.reduce(
        (sum, pkg) =>
          sum + pkg.acceptedProportion,
        0,
      ) / packages.length,
    ),
  };
}
