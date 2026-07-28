import type {
  RoutedKnowledgePackage,
} from "../routing/computePipelineRoute";

export interface RouteSegment {
  id: string;
  points: string;
}

export function buildRouteSegments(
  packages: readonly RoutedKnowledgePackage[],
): RouteSegment[] {
  return packages.map((pkg) => ({
    id: pkg.id,
    points: pkg.route
      .map(
        (point) =>
          `${point.x}%,${point.y}`,
      )
      .join(" "),
  }));
}
