export const KnowledgeNodeTypes = {
  repository:
    "repository",

  project:
    "project",

  architecture:
    "architecture",

  engineering:
    "engineering",

  runtime:
    "runtime",
} as const;

export const KnowledgeEdgeTypes = {
  contains:
    "contains",

  dependsOn:
    "dependsOn",

  runs:
    "runs",

  implements:
    "implements",

  references:
    "references",
} as const;

export type KnowledgeNodeType =
  typeof KnowledgeNodeTypes[
    keyof typeof KnowledgeNodeTypes
  ];

export type KnowledgeEdgeType =
  typeof KnowledgeEdgeTypes[
    keyof typeof KnowledgeEdgeTypes
  ];
