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
