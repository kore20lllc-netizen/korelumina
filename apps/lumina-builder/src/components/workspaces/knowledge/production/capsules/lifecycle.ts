import type {
  KnowledgeCapsuleModel,
} from "./types";

export const manufacturingStations = [
  "Evidence Intake",
  "Documentation Compiler",
  "Conversation Compiler",
  "Git Compiler",
  "Runtime Compiler",
  "Mission Compiler",
  "Execution Compiler",
  "Knowledge IR",
  "Validation",
  "Knowledge Package Assembly",
  "Canonical Review",
  "Canonical Knowledge",
] as const;

export type ManufacturingStation =
  (typeof manufacturingStations)[number];

export type CapsuleFlowBranch = {
  id: string;
  parentCapsuleId: string;
  kind: "main" | "remediation";
  station: ManufacturingStation;
  state: KnowledgeCapsuleModel["state"];
  integrity: KnowledgeCapsuleModel["integrity"];
  layerIds: string[];
  mergeTarget?: ManufacturingStation;
  note?: string;
};

export type CapsuleManufacturingPosition = {
  capsuleId: string;
  station: ManufacturingStation;
  queuePosition: number;
  branches: CapsuleFlowBranch[];
};

export type ConsumerStatus =
  | "connected"
  | "consuming"
  | "waiting"
  | "pending"
  | "restricted"
  | "deprecated"
  | "superseded"
  | "archived";

export type KnowledgeConsumer = {
  id: string;
  label: string;
  status: ConsumerStatus;
  detail: string;
};

export type ConsumptionEvent = {
  id: string;
  occurredAt: string;
  consumer: string;
  action: string;
  detail: string;
};

export type CapsuleGenealogy = {
  parentCapsuleIds: string[];
  childCapsuleIds: string[];
  siblingCapsuleIds: string[];
  relatedArtifacts: string[];
  relatedConversations: string[];
  relatedMissions: string[];
  educationalInfluence: string[];
  organizationalInfluence: string[];
};

export type KnowledgeDistributionRecord = {
  capsuleId: string;
  consumers: KnowledgeConsumer[];
  history: ConsumptionEvent[];
  genealogy: CapsuleGenealogy;
};

export const capsuleManufacturingPositions: CapsuleManufacturingPosition[] = [
  {
    capsuleId: "kp-2026-000143",
    station: "Validation",
    queuePosition: 1,
    branches: [
      {
        id: "kp-2026-000143-main",
        parentCapsuleId: "kp-2026-000143",
        kind: "main",
        station: "Knowledge Package Assembly",
        state: "validated",
        integrity: "sealed",
        layerIds: [
          "semantic-layer",
          "governance-layer",
        ],
        note:
          "Validated layers continue to package assembly.",
      },
      {
        id: "kp-2026-000143-remediation",
        parentCapsuleId: "kp-2026-000143",
        kind: "remediation",
        station: "Validation",
        state: "needs-review",
        integrity: "peeling",
        layerIds: [
          "provenance-layer",
        ],
        mergeTarget:
          "Knowledge Package Assembly",
        note:
          "Provenance layer requires authority confirmation before merge.",
      },
    ],
  },
  {
    capsuleId: "kp-2026-000144",
    station: "Knowledge Package Assembly",
    queuePosition: 1,
    branches: [],
  },
  {
    capsuleId: "kp-2026-000145",
    station: "Canonical Knowledge",
    queuePosition: 1,
    branches: [],
  },
  {
    capsuleId: "kp-2026-000146",
    station: "Conversation Compiler",
    queuePosition: 1,
    branches: [],
  },
];

export const knowledgeDistributionRecords: KnowledgeDistributionRecord[] = [
  {
    capsuleId: "kp-2026-000145",
    consumers: [
      {
        id: "organizational-memory",
        label: "Organizational Memory",
        status: "consuming",
        detail:
          "Published and available for governed organizational recall.",
      },
      {
        id: "knowledge-graph",
        label: "Knowledge Graph",
        status: "connected",
        detail:
          "Concept and relationship indexing complete.",
      },
      {
        id: "semantic-search",
        label: "Semantic Search",
        status: "connected",
        detail:
          "Search retrieval surface enabled.",
      },
      {
        id: "context-builder",
        label: "Context Builder",
        status: "consuming",
        detail:
          "Actively contributing to governed context assembly.",
      },
      {
        id: "chief-agent-corpus",
        label: "Chief Agent Educational Corpus",
        status: "pending",
        detail:
          "Educational adaptation awaits final competency mapping.",
      },
      {
        id: "chief-agent-context",
        label: "Chief Agent Context",
        status: "waiting",
        detail:
          "Awaiting educational corpus publication.",
      },
      {
        id: "mission-system",
        label: "Mission System",
        status: "consuming",
        detail:
          "Referenced by Mission 42 planning.",
      },
      {
        id: "runtime-advisor",
        label: "Runtime Advisor",
        status: "connected",
        detail:
          "Available for runtime diagnostic guidance.",
      },
      {
        id: "executive-office",
        label: "Executive Office",
        status: "restricted",
        detail:
          "Executive summary access only.",
      },
      {
        id: "engineering-workspace",
        label: "Engineering Workspace",
        status: "connected",
        detail:
          "Contributes to governed engineering standards.",
      },
    ],
    history: [
      {
        id: "consumption-1",
        occurredAt: "2026-07-28T09:12:00Z",
        consumer: "Organizational Memory",
        action: "published",
        detail:
          "Canonical capsule entered organizational memory.",
      },
      {
        id: "consumption-2",
        occurredAt: "2026-07-28T09:14:00Z",
        consumer: "Knowledge Graph",
        action: "indexed",
        detail:
          "Concept and relationship graph updated.",
      },
      {
        id: "consumption-3",
        occurredAt: "2026-07-29T14:05:00Z",
        consumer: "Context Builder",
        action: "retrieved",
        detail:
          "Used during governed mission-context assembly.",
      },
      {
        id: "consumption-4",
        occurredAt: "2026-07-30T16:42:00Z",
        consumer: "Mission System",
        action: "referenced",
        detail:
          "Contributed to Mission 42 planning.",
      },
      {
        id: "consumption-5",
        occurredAt: "2026-07-31T08:21:00Z",
        consumer: "Engineering Workspace",
        action: "contributed",
        detail:
          "Referenced by an engineering operating standard.",
      },
    ],
    genealogy: {
      parentCapsuleIds: [
        "KP-2026-000084",
        "KP-2026-000101",
      ],
      childCapsuleIds: [
        "KP-2026-000211",
        "KP-2026-000238",
      ],
      siblingCapsuleIds: [
        "KP-2026-000144",
      ],
      relatedArtifacts: [
        "Knowledge Constitution v1",
        "Mission Continuity Standard",
      ],
      relatedConversations: [
        "Phase 1A certification thread",
        "Runtime continuity decision record",
      ],
      relatedMissions: [
        "Mission 42",
        "Mission 51",
      ],
      educationalInfluence: [
        "Governance Foundations",
        "Mission Continuity",
      ],
      organizationalInfluence: [
        "Engineering standards",
        "Runtime operating policy",
      ],
    },
  },
];
