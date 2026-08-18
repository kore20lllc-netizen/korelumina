export const KNOWLEDGE_STAGES = [
  "Acquire",
  "Reduce",
  "Compile",
  "Validate",
  "Canonical",
] as const;

export type KnowledgeStage =
  (typeof KNOWLEDGE_STAGES)[number];

export type KnowledgePackageState =
  | "active"
  | "waiting"
  | "blocked"
  | "canonical";

export interface KnowledgePackageFragment {
  id: string;
  label: string;
  disposition:
    | "accepted"
    | "discarded"
    | "split";
  proportion: number;
  childPackageId?: string;
}

export interface KnowledgePackage {
  id: string;
  parentId?: string;
  title: string;
  source: string;
  stage: KnowledgeStage;

  /**
   * Continuous pipeline coordinate.
   * 0.0 = Acquire
   * 1.0 = Canonical
   */
  progress: number;

  dependsOn?: string[];

  institutionalDomain?: string;

  confidence: number;
  state: KnowledgePackageState;
  evidence: number;
  acceptedProportion: number;
  discardedProportion: number;
  fragments: KnowledgePackageFragment[];
}

export const KNOWLEDGE_PACKAGES: KnowledgePackage[] = [
  {
    id: "PKG-421",
    title: "HIPAA Compliance Audit",
    source: "Repository",
    stage: "Reduce",
    progress: 0.26,
    
    institutionalDomain: "Architecture",

    confidence: 84,
    state: "active",
    evidence: 37,
    acceptedProportion: 72,
    discardedProportion: 28,
    fragments: [
      {
        id: "FRG-421-A",
        label: "Control evidence",
        disposition: "accepted",
        proportion: 48,
      },
      {
        id: "FRG-421-B",
        label: "Duplicate findings",
        disposition: "discarded",
        proportion: 28,
      },
      {
        id: "FRG-421-C",
        label: "Security architecture",
        disposition: "split",
        proportion: 24,
        childPackageId: "PKG-421A",
      },
    ],
  },
  {
    id: "PKG-421A",
    parentId: "PKG-421",
    title: "Security Architecture",
    source: "Package split",
    stage: "Compile",
    progress: 0.47,
    dependsOn: ["PKG-421"],
    
    institutionalDomain: "Architecture",

    confidence: 89,
    state: "active",
    evidence: 14,
    acceptedProportion: 100,
    discardedProportion: 0,
    fragments: [],
  },
  {
    id: "PKG-422",
    title: "Repository Import",
    source: "Git",
    stage: "Compile",
    progress: 0.52,
    dependsOn: ["PKG-421A"],
    
    institutionalDomain: "Runtime",

    confidence: 91,
    state: "active",
    evidence: 52,
    acceptedProportion: 81,
    discardedProportion: 19,
    fragments: [
      {
        id: "FRG-422-A",
        label: "Runtime architecture",
        disposition: "accepted",
        proportion: 52,
      },
      {
        id: "FRG-422-B",
        label: "Generated artifacts",
        disposition: "discarded",
        proportion: 19,
      },
      {
        id: "FRG-422-C",
        label: "Builder architecture",
        disposition: "accepted",
        proportion: 29,
      },
    ],
  },
  {
    id: "PKG-423",
    title: "Clinical Policy Manual",
    source: "PDF",
    stage: "Validate",
    progress: 0.74,
    dependsOn: ["PKG-422"],
    
    institutionalDomain: "Security",

    confidence: 76,
    state: "waiting",
    evidence: 18,
    acceptedProportion: 64,
    discardedProportion: 36,
    fragments: [
      {
        id: "FRG-423-A",
        label: "Approved policies",
        disposition: "accepted",
        proportion: 64,
      },
      {
        id: "FRG-423-B",
        label: "Superseded procedures",
        disposition: "discarded",
        proportion: 36,
      },
    ],
  },
  {
    id: "PKG-424",
    title: "Institutional Memory",
    source: "Knowledge Base",
    stage: "Canonical",
    progress: 0.96,
    dependsOn: ["PKG-423"],
    
    institutionalDomain: "Knowledge Compiler",

    confidence: 100,
    state: "canonical",
    evidence: 124,
    acceptedProportion: 100,
    discardedProportion: 0,
    fragments: [],
  },
];
