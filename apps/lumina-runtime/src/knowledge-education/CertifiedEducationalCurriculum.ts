export type EducationalRuntimeStatus =
  | "completed"
  | "active"
  | "blocked"
  | "not-started"
  | "needs-review";

export interface EducationalCoverageMeasurement {
  satisfiedRequirements:
    string[];

  missingRequirements:
    string[];

  satisfiedCount:
    number;

  requirementCount:
    number;

  measurementVersion:
    "education-coverage-v1";
}

export interface EducationalRuntimeModuleDefinition {
  id:
    string;

  title:
    string;

  description:
    string;

  dependencyIds:
    string[];

  competencyObjectives:
    string[];

  coverageGap?:
    string;

  conflict?:
    string;
}

export interface EducationalRuntimeModule
  extends EducationalRuntimeModuleDefinition {
  status:
    EducationalRuntimeStatus;

  completion:
    number;

  coverage:
    EducationalCoverageMeasurement;
}

export interface EducationalRuntimeCompetency {
  id:
    string;

  title:
    string;

  description:
    string;

  status:
    EducationalRuntimeStatus;

  evidence:
    string;
}

/*
 * Certified Education UI contract.
 *
 * These are no longer Builder fixtures.
 * They define the curriculum topology expected by the
 * Educational Progress and Competency Posture surfaces.
 *
 * Runtime owns this contract and can evolve status/completion
 * later from authoritative learning evidence without requiring
 * any UI-composition change.
 */
export const certifiedEducationalModules:
  readonly EducationalRuntimeModuleDefinition[] = [
    {
      id:
        "constitutional-literacy",

      title:
        "Constitutional Literacy",

      description:
        "Interpret Canon, Constitution, amendments and authority order.",

      dependencyIds:
        [],

      competencyObjectives: [
        "Authority interpretation",
        "Approval-boundary understanding",
      ],
    },

    {
      id:
        "knowledge-governance",

      title:
        "Knowledge Governance",

      description:
        "Understand Evidence, Knowledge IR, Knowledge Packages, Canonical Knowledge and Organizational Memory.",

      dependencyIds: [
        "constitutional-literacy",
      ],

      competencyObjectives: [
        "Governed retrieval",
        "Provenance preservation",
      ],
    },

    {
      id:
        "operational-boundaries",

      title:
        "Operational Boundaries",

      description:
        "Distinguish knowledge from Runtime truth, execution authority and human approval.",

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
      id:
        "conversation-curriculum",

      title:
        "Conversation Curriculum",

      description:
        "Review validated architectural, engineering, mission, governance, executive, design and operational conversations.",

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
      id:
        "business-domain-literacy",

      title:
        "Business and Domain Literacy",

      description:
        "Understand organizational domains, business constraints and customer context.",

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

export const certifiedEducationalCompetencies:
  readonly EducationalRuntimeCompetency[] = [
    {
      id:
        "authority-interpretation",

      title:
        "Authority interpretation",

      description:
        "Correctly order Canon, Constitution, amendments, governance, architecture and implementation.",

      status:
        "completed",

      evidence:
        "Constitutional curriculum reviewed.",
    },

    {
      id:
        "governed-retrieval",

      title:
        "Governed retrieval",

      description:
        "Retrieve knowledge with authority, approval, scope and provenance preserved.",

      status:
        "active",

      evidence:
        "Knowledge Constitution coverage complete; retrieval exercises remain.",
    },

    {
      id:
        "provenance-preservation",

      title:
        "Provenance preservation",

      description:
        "Maintain source identity, lineage and dependency traceability.",

      status:
        "completed",

      evidence:
        "Evidence and Knowledge Package curriculum complete.",
    },

    {
      id:
        "runtime-truth-distinction",

      title:
        "Knowledge vs Runtime truth",

      description:
        "Recognize that operational execution state must be verified against Runtime.",

      status:
        "active",

      evidence:
        "Runtime certification curriculum under review.",
    },

    {
      id:
        "mission-boundaries",

      title:
        "Mission-boundary understanding",

      description:
        "Understand mission ownership, specialist delegation and validation boundaries.",

      status:
        "needs-review",

      evidence:
        "Mission curriculum admitted but not fully reviewed.",
    },

    {
      id:
        "approval-boundaries",

      title:
        "Approval-boundary understanding",

      description:
        "Recognize architecture, deployment, recovery, activation and canonical promotion gates.",

      status:
        "completed",

      evidence:
        "Operating model and governance curriculum complete.",
    },

    {
      id:
        "explainable-grounding",

      title:
        "Explainable output grounding",

      description:
        "Ground recommendations in governed sources and disclose missing authority or knowledge.",

      status:
        "blocked",

      evidence:
        "Conversation and business curriculum gaps remain.",
    },
  ];
