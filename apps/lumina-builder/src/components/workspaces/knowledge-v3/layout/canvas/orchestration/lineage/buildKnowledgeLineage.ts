import type {
  KnowledgePackage,
} from "../data/knowledgePackages";

export interface LineageNode {
  id: string;
  title: string;
  stage: string;
  parents: string[];
}

export function buildKnowledgeLineage(
  packages: readonly KnowledgePackage[],
) {
  const lookup = new Map(
    packages.map((pkg) => [pkg.id, pkg]),
  );

  return packages.map((pkg) => ({
    id: pkg.id,
    title: pkg.title,
    stage: pkg.stage,
    parents:
      (pkg.dependsOn ?? []).filter((id) =>
        lookup.has(id),
      ),
  }));
}
