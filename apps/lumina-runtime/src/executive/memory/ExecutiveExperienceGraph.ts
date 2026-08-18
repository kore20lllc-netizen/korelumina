import type {
  ExecutiveExperience,
  ExecutiveExperienceNode,
  ExecutiveExperienceStage,
} from "./ExecutiveExperience.js";

export type ExecutiveExperienceEdgeType =
  | "caused"
  | "informed"
  | "implemented"
  | "validated"
  | "deployed"
  | "produced"
  | "reflected-on"
  | "derived-pattern"
  | "related";

export interface ExecutiveExperienceEdge {
  id: string;

  experienceId: string;

  fromNodeId: string;

  toNodeId: string;

  type:
    ExecutiveExperienceEdgeType;

  createdAt: number;

  metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface ExecutiveExperienceGraphSnapshot {
  experiences:
    readonly ExecutiveExperience[];

  nodes:
    readonly ExecutiveExperienceNode[];

  edges:
    readonly ExecutiveExperienceEdge[];
}

export interface ExecutiveExperienceGraph {
  addExperience(
    experience:
      ExecutiveExperience,
  ): void;

  addNode(
    experienceId: string,
    node:
      ExecutiveExperienceNode,
  ): void;

  addEdge(
    edge:
      ExecutiveExperienceEdge,
  ): void;

  getExperience(
    experienceId: string,
  ): ExecutiveExperience | undefined;

  getNodes(
    experienceId: string,
  ): readonly ExecutiveExperienceNode[];

  getEdges(
    experienceId: string,
  ): readonly ExecutiveExperienceEdge[];

  getNodesByStage(
    experienceId: string,
    stage:
      ExecutiveExperienceStage,
  ): readonly ExecutiveExperienceNode[];

  snapshot():
    ExecutiveExperienceGraphSnapshot;
}

export class InMemoryExecutiveExperienceGraph
  implements ExecutiveExperienceGraph
{
  private readonly experiences =
    new Map<
      string,
      ExecutiveExperience
    >();

  private readonly nodes =
    new Map<
      string,
      ExecutiveExperienceNode
    >();

  private readonly edges =
    new Map<
      string,
      ExecutiveExperienceEdge
    >();

  addExperience(
    experience:
      ExecutiveExperience,
  ): void {
    if (
      this.experiences.has(
        experience.id,
      )
    ) {
      throw new Error(
        `Executive experience "${experience.id}" already exists.`,
      );
    }

    this.experiences.set(
      experience.id,
      experience,
    );
  }

  addNode(
    experienceId: string,
    node:
      ExecutiveExperienceNode,
  ): void {
    const experience =
      this.experiences.get(
        experienceId,
      );

    if (!experience) {
      throw new Error(
        `Executive experience "${experienceId}" was not found.`,
      );
    }

    if (
      this.nodes.has(node.id)
    ) {
      throw new Error(
        `Executive experience node "${node.id}" already exists.`,
      );
    }

    this.nodes.set(
      node.id,
      Object.freeze({
        ...node,

        metadata:
          Object.freeze({
            ...node.metadata,
          }),
      }),
    );

    this.experiences.set(
      experienceId,
      Object.freeze({
        ...experience,

        nodeIds:
          Object.freeze([
            ...experience.nodeIds,
            node.id,
          ]),

        updatedAt:
          Date.now(),
      }),
    );
  }

  addEdge(
    edge:
      ExecutiveExperienceEdge,
  ): void {
    if (
      this.edges.has(edge.id)
    ) {
      throw new Error(
        `Executive experience edge "${edge.id}" already exists.`,
      );
    }

    if (
      !this.experiences.has(
        edge.experienceId,
      )
    ) {
      throw new Error(
        `Executive experience "${edge.experienceId}" was not found.`,
      );
    }

    if (
      !this.nodes.has(
        edge.fromNodeId,
      ) ||
      !this.nodes.has(
        edge.toNodeId,
      )
    ) {
      throw new Error(
        "Executive experience edges require existing source and destination nodes.",
      );
    }

    this.edges.set(
      edge.id,
      Object.freeze({
        ...edge,

        metadata:
          Object.freeze({
            ...edge.metadata,
          }),
      }),
    );
  }

  getExperience(
    experienceId: string,
  ): ExecutiveExperience | undefined {
    return this.experiences.get(
      experienceId,
    );
  }

  getNodes(
    experienceId: string,
  ): readonly ExecutiveExperienceNode[] {
    const experience =
      this.experiences.get(
        experienceId,
      );

    if (!experience) {
      return [];
    }

    return experience.nodeIds
      .map(
        (nodeId) =>
          this.nodes.get(nodeId),
      )
      .filter(
        (
          node,
        ): node is ExecutiveExperienceNode =>
          Boolean(node),
      );
  }

  getEdges(
    experienceId: string,
  ): readonly ExecutiveExperienceEdge[] {
    return Array.from(
      this.edges.values(),
    ).filter(
      (edge) =>
        edge.experienceId ===
        experienceId,
    );
  }

  getNodesByStage(
    experienceId: string,
    stage:
      ExecutiveExperienceStage,
  ): readonly ExecutiveExperienceNode[] {
    return this.getNodes(
      experienceId,
    ).filter(
      (node) =>
        node.stage === stage,
    );
  }

  snapshot():
    ExecutiveExperienceGraphSnapshot {
    return {
      experiences:
        Array.from(
          this.experiences.values(),
        ),

      nodes:
        Array.from(
          this.nodes.values(),
        ),

      edges:
        Array.from(
          this.edges.values(),
        ),
    };
  }
}
