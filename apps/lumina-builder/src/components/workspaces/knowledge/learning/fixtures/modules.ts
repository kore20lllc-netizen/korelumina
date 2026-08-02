import type {
  EducationalModule,
} from "../model";

export const educationalModules: EducationalModule[] = [
  {
    id: "constitutional-literacy",
    title:
      "Constitutional Literacy",
    description:
      "Interpret Canon, Constitution, amendments and authority order.",
    status: "completed",
    completion: 100,
    dependencyIds: [],
    competencyObjectives: [
      "Authority interpretation",
      "Approval-boundary understanding",
    ],
  },
  {
    id: "knowledge-governance",
    title:
      "Knowledge Governance",
    description:
      "Understand Evidence, Knowledge IR, Knowledge Packages, Canonical Knowledge and Organizational Memory.",
    status: "completed",
    completion: 100,
    dependencyIds: [
      "constitutional-literacy",
    ],
    competencyObjectives: [
      "Governed retrieval",
      "Provenance preservation",
    ],
  },
  {
    id: "operational-boundaries",
    title:
      "Operational Boundaries",
    description:
      "Distinguish knowledge from Runtime truth, execution authority and human approval.",
    status: "active",
    completion: 78,
    dependencyIds: [
      "constitutional-literacy",
    ],
    competencyObjectives: [
      "Runtime truth distinction",
      "Mission-boundary understanding",
    ],
    coverageGap:
      "Operator action taxonomy is not yet fully represented in curriculum.",
  },
  {
    id: "conversation-curriculum",
    title:
      "Conversation Curriculum",
    description:
      "Review validated architectural, engineering, mission, governance, executive, design and operational conversations.",
    status: "active",
    completion: 64,
    dependencyIds: [
      "constitutional-literacy",
      "knowledge-governance",
    ],
    competencyObjectives: [
      "Explainable output grounding",
      "Decision-history interpretation",
    ],
    coverageGap:
      "Governance and mission conversation approval remains incomplete.",
  },
  {
    id: "business-domain-literacy",
    title:
      "Business and Domain Literacy",
    description:
      "Understand organizational domains, business constraints and customer context.",
    status: "blocked",
    completion: 32,
    dependencyIds: [
      "constitutional-literacy",
    ],
    competencyObjectives: [
      "Organizational context",
      "Domain-bound decision support",
    ],
    conflict:
      "Canonical business and domain source registry is not yet defined.",
  },
];
