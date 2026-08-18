import type {
  PositionedKnowledgePackage,
} from "../layout/computePipelineLayout";

export interface PipelineWaypoint {
  x: number;
  y: number;
}

export interface RoutedKnowledgePackage
  extends PositionedKnowledgePackage {
  route: PipelineWaypoint[];
}

export function computePipelineRoute(
  packages: readonly PositionedKnowledgePackage[],
): RoutedKnowledgePackage[] {
  return packages.map((pkg) => {
    const x = 10 + pkg.progress * 80;
    const y = 88 + pkg.lane * 76;

    return {
      ...pkg,
      route: [
        {
          x: 10,
          y,
        },
        {
          x: Math.max(10, x - 6),
          y,
        },
        {
          x,
          y,
        },
      ],
    };
  });
}
