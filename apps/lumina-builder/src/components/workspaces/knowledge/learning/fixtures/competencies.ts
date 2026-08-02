import type {
  CompetencyObjective,
} from "../model";

export const competencyObjectives: CompetencyObjective[] = [
  {
    id:
      "authority-interpretation",
    title:
      "Authority interpretation",
    description:
      "Correctly order Canon, Constitution, amendments, governance, architecture and implementation.",
    status: "completed",
    evidence:
      "Constitutional curriculum reviewed.",
  },
  {
    id: "governed-retrieval",
    title:
      "Governed retrieval",
    description:
      "Retrieve knowledge with authority, approval, scope and provenance preserved.",
    status: "active",
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
    status: "completed",
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
    status: "active",
    evidence:
      "Runtime certification curriculum under review.",
  },
  {
    id: "mission-boundaries",
    title:
      "Mission-boundary understanding",
    description:
      "Understand mission ownership, specialist delegation and validation boundaries.",
    status: "needs-review",
    evidence:
      "Mission curriculum admitted but not fully reviewed.",
  },
  {
    id: "approval-boundaries",
    title:
      "Approval-boundary understanding",
    description:
      "Recognize architecture, deployment, recovery, activation and canonical promotion gates.",
    status: "completed",
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
    status: "blocked",
    evidence:
      "Conversation and business curriculum gaps remain.",
  },
];
