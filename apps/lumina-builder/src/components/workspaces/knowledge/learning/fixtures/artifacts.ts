import type {
  EducationalArtifact,
} from "../model";

export const educationalArtifacts: EducationalArtifact[] = [
  {
    id: "canon-vision-2050",
    title: "Vision 2050",
    kind: "canon",
    category: "Canon and Vision",
    authorityClass: "Supreme Canon",
    approvalState: "Canonical",
    owner: "Constitutional Office",
    scope:
      "KoreLumina long-term purpose and organizational evolution",
    version: "2050",
    provenance:
      "docs/canon/VISION_2050.md",
    source:
      "Repository documentation",
    lineage: [
      "Vision 2050",
      "Platform Constitution",
      "Learning Constitution",
    ],
    dependencies: [],
    supersession: "Current",
    educationalStatus:
      "completed",
    educationalImpact:
      "Establishes institutional purpose, human leadership and long-term learning direction.",
    relatedArtifacts: [
      "platform-constitution",
      "ca-005-learning-constitution",
    ],
    relatedKnowledgePackages: [],
    relatedCanonicalKnowledge: [
      "Organizational purpose",
      "Human authority",
    ],
    relatedMemory: [
      "Institutional continuity",
    ],
    relatedMissions: [],
    relatedDecisions: [],
  },
  {
    id: "platform-constitution",
    title: "Platform Constitution",
    kind: "constitution",
    category: "Constitution",
    authorityClass: "Constitution",
    approvalState: "Authoritative",
    owner: "Constitutional Office",
    scope:
      "Platform laws, traceability, knowledge and Runtime boundaries",
    version: "1.0",
    provenance:
      "docs/architecture/00_PLATFORM_CONSTITUTION.md",
    source:
      "Repository documentation",
    lineage: [
      "Vision 2050",
      "Platform Constitution",
      "Constitutional Amendments",
    ],
    dependencies: [
      "canon-vision-2050",
    ],
    supersession: "Current",
    educationalStatus:
      "completed",
    educationalImpact:
      "Defines mandatory platform behavior and the requirement that historical work becomes reusable knowledge.",
    relatedArtifacts: [
      "ca-001-knowledge-package",
      "ca-002-canonical-knowledge",
      "ca-003-organizational-memory",
      "ca-004-memory-adaptation",
      "ca-005-learning-constitution",
    ],
    relatedKnowledgePackages: [],
    relatedCanonicalKnowledge: [
      "Platform laws",
    ],
    relatedMemory: [
      "Constitutional continuity",
    ],
    relatedMissions: [],
    relatedDecisions: [],
  },
  {
    id: "ca-001-knowledge-package",
    title:
      "CA-001 — Knowledge Package",
    kind: "amendment",
    category:
      "Constitutional Amendments",
    authorityClass:
      "Constitutional Amendment",
    approvalState: "Approved",
    owner: "Constitutional Office",
    scope:
      "Governed knowledge package identity and lifecycle",
    version: "1.0.0",
    provenance:
      "docs/architecture/amendments/CA-001_KNOWLEDGE_PACKAGE.md",
    source:
      "Repository documentation",
    lineage: [
      "Platform Constitution",
      "CA-001",
      "Knowledge Package model",
    ],
    dependencies: [
      "platform-constitution",
    ],
    supersession: "Current",
    educationalStatus:
      "completed",
    educationalImpact:
      "Teaches the governed unit between Knowledge IR and canonical review.",
    relatedArtifacts: [
      "ca-002-canonical-knowledge",
    ],
    relatedKnowledgePackages: [
      "Educational foundation package",
    ],
    relatedCanonicalKnowledge: [],
    relatedMemory: [],
    relatedMissions: [],
    relatedDecisions: [],
  },
  {
    id: "ca-002-canonical-knowledge",
    title:
      "CA-002 — Canonical Knowledge",
    kind: "amendment",
    category:
      "Constitutional Amendments",
    authorityClass:
      "Constitutional Amendment",
    approvalState: "Approved",
    owner: "Constitutional Office",
    scope:
      "Canonical trust, promotion and authority",
    version: "1.0.0",
    provenance:
      "docs/architecture/amendments/CA-002_CANONICAL_KNOWLEDGE.md",
    source:
      "Repository documentation",
    lineage: [
      "Platform Constitution",
      "CA-001",
      "CA-002",
    ],
    dependencies: [
      "platform-constitution",
      "ca-001-knowledge-package",
    ],
    supersession: "Current",
    educationalStatus:
      "completed",
    educationalImpact:
      "Teaches the distinction between validated candidate knowledge and authoritative canonical knowledge.",
    relatedArtifacts: [
      "ca-003-organizational-memory",
      "ca-004-memory-adaptation",
    ],
    relatedKnowledgePackages: [],
    relatedCanonicalKnowledge: [
      "Canonical trust model",
    ],
    relatedMemory: [],
    relatedMissions: [],
    relatedDecisions: [],
  },
  {
    id: "ca-003-organizational-memory",
    title:
      "CA-003 — Organizational Memory Stewardship",
    kind: "amendment",
    category:
      "Constitutional Amendments",
    authorityClass:
      "Constitutional Amendment",
    approvalState: "Approved",
    owner: "Constitutional Office",
    scope:
      "Durable institutional memory stewardship",
    version: "1.0.0",
    provenance:
      "docs/architecture/amendments/CA-003_ORGANIZATIONAL_MEMORY_STEWARDSHIP.md",
    source:
      "Repository documentation",
    lineage: [
      "CA-002",
      "CA-003",
      "Organizational Memory",
    ],
    dependencies: [
      "ca-002-canonical-knowledge",
    ],
    supersession: "Current",
    educationalStatus:
      "completed",
    educationalImpact:
      "Establishes how approved knowledge is preserved and retrieved across organizational time.",
    relatedArtifacts: [
      "ca-004-memory-adaptation",
    ],
    relatedKnowledgePackages: [],
    relatedCanonicalKnowledge: [
      "Organizational memory stewardship",
    ],
    relatedMemory: [
      "Institutional memory",
    ],
    relatedMissions: [],
    relatedDecisions: [],
  },
  {
    id: "ca-004-memory-adaptation",
    title:
      "CA-004 — Canonical Memory Adaptation",
    kind: "amendment",
    category:
      "Constitutional Amendments",
    authorityClass:
      "Constitutional Amendment",
    approvalState: "Approved",
    owner: "Constitutional Office",
    scope:
      "Canonical-to-memory adaptation boundaries",
    version: "1.0.0",
    provenance:
      "docs/architecture/amendments/CA-004_CANONICAL_MEMORY_ADAPTATION.md",
    source:
      "Repository documentation",
    lineage: [
      "CA-002",
      "CA-003",
      "CA-004",
    ],
    dependencies: [
      "ca-002-canonical-knowledge",
      "ca-003-organizational-memory",
    ],
    supersession: "Current",
    educationalStatus:
      "completed",
    educationalImpact:
      "Teaches preservation of authority, provenance, scope and lineage during memory adaptation.",
    relatedArtifacts: [
      "ca-005-learning-constitution",
    ],
    relatedKnowledgePackages: [],
    relatedCanonicalKnowledge: [
      "Memory adaptation contract",
    ],
    relatedMemory: [
      "Governed memory projections",
    ],
    relatedMissions: [],
    relatedDecisions: [],
  },
  {
    id: "ca-005-learning-constitution",
    title:
      "CA-005 — Learning Constitution",
    kind: "amendment",
    category:
      "Constitutional Amendments",
    authorityClass:
      "Constitutional Amendment",
    approvalState: "Approved",
    owner: "Constitutional Office",
    scope:
      "Education, activation and continuous learning",
    version: "1.0.0",
    provenance:
      "docs/architecture/amendments/CA-005_LEARNING_CONSTITUTION.md",
    source:
      "Repository documentation",
    lineage: [
      "Platform Constitution",
      "Learning Constitution Reconciliation",
      "CA-005",
    ],
    dependencies: [
      "platform-constitution",
      "ca-001-knowledge-package",
      "ca-002-canonical-knowledge",
      "ca-003-organizational-memory",
      "ca-004-memory-adaptation",
    ],
    supersession: "Current",
    educationalStatus:
      "completed",
    educationalImpact:
      "Defines pre-activation education and separates it from post-activation learning.",
    relatedArtifacts: [
      "chief-agent-operational-learning-model",
      "conversation-architecture-reconstruction",
    ],
    relatedKnowledgePackages: [
      "Learning constitution package",
    ],
    relatedCanonicalKnowledge: [
      "Educational lifecycle",
    ],
    relatedMemory: [
      "Learning constitution continuity",
    ],
    relatedMissions: [
      "Chief Agent learning foundation",
    ],
    relatedDecisions: [
      "Education precedes activation",
    ],
  },
  {
    id: "chief-agent-operational-learning-model",
    title:
      "Chief Agent Operational Learning Model",
    kind: "reconciliation",
    category: "Reconciliations",
    authorityClass:
      "Architecture Reconciliation",
    approvalState: "Reconciled",
    owner: "Constitutional Office",
    scope:
      "Integrated Knowledge and Learning Constitution lifecycle",
    version: "1.0.0",
    provenance:
      "docs/architecture/reconciliation/CHIEF_AGENT_OPERATIONAL_LEARNING_MODEL.md",
    source:
      "Repository documentation",
    lineage: [
      "Knowledge Constitution",
      "Learning Constitution",
      "Operational model",
    ],
    dependencies: [
      "ca-005-learning-constitution",
    ],
    supersession: "Current",
    educationalStatus: "active",
    educationalImpact:
      "Integrates education, activation, mission operation and later learning into one sequence.",
    relatedArtifacts: [
      "ca-005-learning-constitution",
      "conversation-architecture-reconstruction",
    ],
    relatedKnowledgePackages: [
      "Operational learning model package",
    ],
    relatedCanonicalKnowledge: [
      "Chief Agent educational lifecycle",
    ],
    relatedMemory: [
      "Operational learning continuity",
    ],
    relatedMissions: [
      "Learning foundations implementation",
    ],
    relatedDecisions: [
      "UI is the contract",
    ],
  },
  {
    id: "runtime-operations-certification",
    title:
      "Runtime Operations Certification",
    kind:
      "runtime-documentation",
    category:
      "Runtime Documentation",
    authorityClass:
      "Operational Certification",
    approvalState: "Certified",
    owner: "Runtime Operations",
    scope:
      "Runtime truth, lifecycle and recovery",
    version:
      "Certified baseline",
    provenance:
      "runtime-certification/",
    source:
      "Repository certification records",
    lineage: [
      "Runtime architecture",
      "Runtime implementation",
      "Runtime certification",
    ],
    dependencies: [
      "platform-constitution",
    ],
    supersession: "Current",
    educationalStatus: "active",
    educationalImpact:
      "Teaches that Runtime truth is authoritative for execution state.",
    relatedArtifacts: [
      "chief-agent-operational-learning-model",
    ],
    relatedKnowledgePackages: [],
    relatedCanonicalKnowledge: [
      "Runtime truth boundary",
    ],
    relatedMemory: [
      "Runtime recovery history",
    ],
    relatedMissions: [
      "Runtime certification",
    ],
    relatedDecisions: [],
  },
  {
    id: "conversation-architecture-reconstruction",
    title:
      "Architecture Reconstruction Conversations",
    kind: "conversation",
    category:
      "Conversation Curriculum",
    authorityClass:
      "Validated Educational Conversation",
    approvalState: "Admitted",
    owner: "Architecture Office",
    scope:
      "Architectural reconstruction, governance and implementation sequencing",
    version: "2026-07",
    provenance:
      "Validated conversation archive → architecture reconciliation references",
    source:
      "Governed conversation archive",
    lineage: [
      "Conversation evidence",
      "Validated decisions",
      "Reconciliations",
      "Educational curriculum",
    ],
    dependencies: [
      "platform-constitution",
      "ca-005-learning-constitution",
    ],
    supersession: "Current",
    educationalStatus: "active",
    educationalImpact:
      "Preserves the reasoning, constraints and decisions that shaped reconstruction and the UI-first contract.",
    relatedArtifacts: [
      "chief-agent-operational-learning-model",
      "ca-005-learning-constitution",
    ],
    relatedKnowledgePackages: [
      "Reconstruction decision package",
    ],
    relatedCanonicalKnowledge: [
      "UI-first implementation contract",
    ],
    relatedMemory: [
      "Reconstruction operating method",
    ],
    relatedMissions: [
      "Knowledge Operations reconstruction",
      "Runtime Operations certification",
    ],
    relatedDecisions: [
      "UI is the contract",
      "No commit before visual approval",
    ],
    authors: [
      "Human leadership",
      "Repository Engineer",
    ],
  },
  {
    id: "conversation-governance-decisions",
    title:
      "Governance and Constitutional Conversations",
    kind: "conversation",
    category:
      "Conversation Curriculum",
    authorityClass:
      "Validated Educational Conversation",
    approvalState: "Needs review",
    owner: "Constitutional Office",
    scope:
      "Amendment sequence, authority boundaries and approval governance",
    version: "2026-07",
    provenance:
      "Governed conversation archive → amendment drafting sessions",
    source:
      "Governed conversation archive",
    lineage: [
      "Conversation evidence",
      "Amendment drafts",
      "Approved amendments",
    ],
    dependencies: [
      "ca-005-learning-constitution",
    ],
    supersession: "Current",
    educationalStatus:
      "needs-review",
    educationalImpact:
      "Explains why constitutional authority, canonical promotion and activation remain human governed.",
    relatedArtifacts: [
      "ca-001-knowledge-package",
      "ca-002-canonical-knowledge",
      "ca-005-learning-constitution",
    ],
    relatedKnowledgePackages: [
      "Governance conversation package",
    ],
    relatedCanonicalKnowledge: [
      "Human approval boundaries",
    ],
    relatedMemory: [
      "Constitutional decision history",
    ],
    relatedMissions: [
      "Constitutional reconciliation",
    ],
    relatedDecisions: [
      "Canonical promotion requires approval",
    ],
    authors: [
      "Human leadership",
      "Constitutional Office",
    ],
  },
  {
    id: "mission-learning-foundations",
    title:
      "Learning Foundations Mission Record",
    kind: "mission",
    category:
      "Mission Documentation",
    authorityClass:
      "Approved Mission Record",
    approvalState: "Approved",
    owner:
      "Chief Agent Executive Office",
    scope:
      "Educational dashboard UI contract",
    version: "Phase 1A",
    provenance:
      "docs/architecture/reconciliation/CHIEF_AGENT_OPERATIONAL_LEARNING_MODEL.md",
    source:
      "Mission documentation",
    lineage: [
      "Operational learning model",
      "Implementation readiness audit",
      "Phase 1A",
    ],
    dependencies: [
      "chief-agent-operational-learning-model",
    ],
    supersession: "Current",
    educationalStatus: "active",
    educationalImpact:
      "Provides a bounded mission example for education, approval and implementation traceability.",
    relatedArtifacts: [
      "chief-agent-operational-learning-model",
    ],
    relatedKnowledgePackages: [],
    relatedCanonicalKnowledge: [],
    relatedMemory: [
      "Implementation mission history",
    ],
    relatedMissions: [
      "Learning foundations implementation",
    ],
    relatedDecisions: [
      "Backend wiring follows visual certification",
    ],
  },
  {
    id: "domain-business-foundations",
    title:
      "Business and Domain Foundations",
    kind: "business",
    category:
      "Business and Domain",
    authorityClass:
      "Organizational Curriculum",
    approvalState: "Partial",
    owner:
      "Business Architecture",
    scope:
      "Business purpose, domains and operating constraints",
    version:
      "Draft registry",
    provenance:
      "Repository business and domain documentation",
    source:
      "Repository documentation",
    lineage: [
      "Business documentation",
      "Domain documentation",
      "Educational curriculum",
    ],
    dependencies: [
      "canon-vision-2050",
    ],
    supersession: "Current",
    educationalStatus:
      "blocked",
    educationalImpact:
      "Provides organizational and domain context required for complete Chief Agent education.",
    relatedArtifacts: [],
    relatedKnowledgePackages: [],
    relatedCanonicalKnowledge: [],
    relatedMemory: [],
    relatedMissions: [],
    relatedDecisions: [],
  },
];
