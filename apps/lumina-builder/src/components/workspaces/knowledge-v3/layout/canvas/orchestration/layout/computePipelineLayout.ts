import type {
  KnowledgePackage,
} from "../data/knowledgePackages";

export interface PositionedKnowledgePackage
  extends KnowledgePackage {
  lane: number;
}

export function computePipelineLayout(
  packages: readonly KnowledgePackage[],
): PositionedKnowledgePackage[] {
  const occupied: number[] = [];

  return [...packages]
    .sort(
      (a, b) =>
        a.progress - b.progress,
    )
    .map((pkg) => {
      let lane = 0;

      while (
        occupied[lane] !== undefined &&
        pkg.progress - occupied[lane] < 0.08
      ) {
        lane++;
      }

      occupied[lane] = pkg.progress;

      return {
        ...pkg,
        lane,
      };
    });
}
