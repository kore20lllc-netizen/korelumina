import type {
  EducationalTimelineEvent,
} from "../../../model";

export const educationalTimeline: EducationalTimelineEvent[] = [
  {
    id: "timeline-001",
    date: "2026-06-05",
    label:
      "Runtime recovery history admitted",
    type: "recovery",
    status: "completed",
    provenance:
      "Runtime recovery anchors and certification records",
    artifactIds: [
      "runtime-operations-certification",
    ],
    description:
      "Validated recovery evidence entered the historical educational foundation.",
  },
  {
    id: "timeline-002",
    date: "2026-07-26",
    label:
      "Knowledge Operations reconstruction mission approved",
    type: "approval",
    status: "completed",
    provenance:
      "Mission record and reconstruction handoff",
    artifactIds: [
      "mission-learning-foundations",
    ],
    description:
      "The flagship workspace mission was established under the UI-first contract.",
  },
  {
    id: "timeline-003",
    date: "2026-07-31",
    label:
      "Knowledge Constitution completed",
    type: "completion",
    status: "completed",
    provenance:
      "CA-001 through CA-004",
    artifactIds: [
      "ca-001-knowledge-package",
      "ca-002-canonical-knowledge",
      "ca-003-organizational-memory",
      "ca-004-memory-adaptation",
    ],
    description:
      "Knowledge identity, authority, memory stewardship and adaptation became constitutionally governed.",
  },
  {
    id: "timeline-004",
    date: "2026-07-31",
    label:
      "Learning Constitution approved",
    type: "approval",
    status: "completed",
    provenance: "CA-005",
    artifactIds: [
      "ca-005-learning-constitution",
    ],
    description:
      "Education-before-activation and post-activation learning were constitutionally separated.",
  },
  {
    id: "timeline-005",
    date: "2026-07-31",
    label:
      "Architectural conversations admitted",
    type: "conversation",
    status: "active",
    provenance:
      "Validated reconstruction conversation archive",
    artifactIds: [
      "conversation-architecture-reconstruction",
    ],
    description:
      "Architectural and implementation-sequencing conversations entered the educational curriculum.",
  },
  {
    id: "timeline-006",
    date: "2026-07-31",
    label:
      "Governance conversations require review",
    type: "review",
    status:
      "needs-review",
    provenance:
      "Constitutional drafting conversation archive",
    artifactIds: [
      "conversation-governance-decisions",
    ],
    description:
      "Conversation provenance is available, but full curriculum approval remains outstanding.",
  },
  {
    id: "timeline-007",
    date: "2026-07-31",
    label:
      "Business and domain dependency blocked",
    type: "dependency",
    status: "blocked",
    provenance:
      "Learning Constitution gap register",
    artifactIds: [
      "domain-business-foundations",
    ],
    description:
      "Canonical owners and source registries remain undefined.",
  },
];
