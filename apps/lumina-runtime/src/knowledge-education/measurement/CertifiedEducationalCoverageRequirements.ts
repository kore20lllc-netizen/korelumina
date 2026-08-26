import type {
  EducationalCoverageRequirement,
} from "./EducationalCoverageEngine.js";

export interface EducationalModuleCoverageDefinition {
  moduleId:
    string;

  requirements:
    EducationalCoverageRequirement[];
}

/*
 * Educational Coverage Requirements v1
 *
 * Every resolvable requirement is bound to a governed repository
 * source identity.
 *
 * Coverage measures admitted curriculum presence only.
 * It does NOT measure Chief Agent mastery or competency.
 */
export const certifiedEducationalCoverageRequirements:
EducationalModuleCoverageDefinition[] = [
  {
    moduleId:
      "constitutional-literacy",

    requirements: [
      {
        id:
          "constitutional:vision-2050",

        description:
          "Vision 2050 is admitted as supreme organizational curriculum.",

        match: {
          sourceRefs: [
            "docs/canon/VISION_2050.md",
          ],
        },
      },

      {
        id:
          "constitutional:platform-constitution",

        description:
          "The Platform Constitution is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/00_PLATFORM_CONSTITUTION.md",
          ],
        },
      },

      {
        id:
          "constitutional:document-governance",

        description:
          "Constitutional document governance is admitted.",

        match: {
          sourceRefs: [
            "docs/canon/CANONICAL_DOCUMENT_HIERARCHY.md",
          ],
        },
      },

      {
        id:
          "constitutional:ca-001",

        description:
          "CA-001 Knowledge Package is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-001_KNOWLEDGE_PACKAGE.md",
          ],
        },
      },

      {
        id:
          "constitutional:ca-002",

        description:
          "CA-002 Canonical Knowledge is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-002_CANONICAL_KNOWLEDGE.md",
          ],
        },
      },

      {
        id:
          "constitutional:ca-003",

        description:
          "CA-003 Organizational Memory Stewardship is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-003_ORGANIZATIONAL_MEMORY_STEWARDSHIP.md",
          ],
        },
      },

      {
        id:
          "constitutional:ca-004",

        description:
          "CA-004 Canonical Memory Adaptation is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-004_CANONICAL_MEMORY_ADAPTATION.md",
          ],
        },
      },

      {
        id:
          "constitutional:ca-005",

        description:
          "CA-005 Learning Constitution is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-005_LEARNING_CONSTITUTION.md",
          ],
        },
      },

      {
        id:
          "constitutional:governing-architecture",

        description:
          "The governing KoreLumina Master Architecture is admitted.",

        match: {
          sourceRefs: [
            "BLUEPRINT.md",
          ],
        },
      },
    ],
  },

  {
    moduleId:
      "knowledge-governance",

    requirements: [
      {
        id:
          "knowledge:evidence-model",

        description:
          "The governed Evidence Model is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/knowledge-governance/EVIDENCE_MODEL.md",
          ],
        },
      },

      {
        id:
          "knowledge:knowledge-ir",

        description:
          "The governed Knowledge Intermediate Representation is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md",
          ],
        },
      },

      {
        id:
          "knowledge:knowledge-package",

        description:
          "Knowledge Package governance is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-001_KNOWLEDGE_PACKAGE.md",
          ],
        },
      },

      {
        id:
          "knowledge:canonical-knowledge",

        description:
          "Canonical Knowledge governance is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-002_CANONICAL_KNOWLEDGE.md",
            "docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md",
          ],
        },
      },

      {
        id:
          "knowledge:organizational-memory",

        description:
          "Organizational Memory governance is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-003_ORGANIZATIONAL_MEMORY_STEWARDSHIP.md",
          ],
        },
      },

      {
        id:
          "knowledge:canonical-memory-adaptation",

        description:
          "Canonical Memory Adaptation governance is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-004_CANONICAL_MEMORY_ADAPTATION.md",
          ],
        },
      },
    ],
  },

  {
    moduleId:
      "operational-boundaries",

    requirements: [
      {
        id:
          "operations:runtime-truth",

        description:
          "Chief Agent Runtime truth boundaries are admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/CHIEF_AGENT_ARCHITECTURE.md",
          ],
        },
      },

      {
        id:
          "operations:human-approval",

        description:
          "Human approval and override boundaries are admitted.",

        match: {
          sourceRefs: [
            "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",
          ],
        },
      },

      {
        id:
          "operations:mission-lifecycle",

        description:
          "Chief Agent mission lifecycle governance is admitted.",

        match: {
          sourceRefs: [
            "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",
          ],
        },
      },

      {
        id:
          "operations:activation-boundary",

        description:
          "The constitutional activation boundary is admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/amendments/CA-005_LEARNING_CONSTITUTION.md",
          ],
        },
      },

      {
        id:
          "operations:recovery-obligations",

        description:
          "Repository recovery and historical learning obligations are admitted.",

        match: {
          sourceRefs: [
            "docs/architecture/KORELUMINA_REPOSITORY_KNOWLEDGE_SEEDING_V1.md",
          ],
        },
      },
    ],
  },

  /*
   * Conversation curriculum is intentionally not reduced to repository
   * documentation. These requirements must resolve from governed,
   * admitted conversation evidence once the conversation source registry
   * carries stable source identities.
   */
  {
    moduleId:
      "conversation-curriculum",

    requirements: [
      {
        id:
          "conversation:architecture",

        description:
          "Governed architectural conversation corpus is admitted.",

        match: {
          kinds: [
            "conversation",
          ],

          titleIncludes: [
            "architecture",
          ],
        },
      },

      {
        id:
          "conversation:governance",

        description:
          "Governed governance conversation corpus is admitted.",

        match: {
          kinds: [
            "conversation",
          ],

          titleIncludes: [
            "governance",
          ],
        },
      },

      {
        id:
          "conversation:engineering",

        description:
          "Governed engineering conversation corpus is admitted.",

        match: {
          kinds: [
            "conversation",
          ],

          titleIncludes: [
            "engineering",
          ],
        },
      },

      {
        id:
          "conversation:mission",

        description:
          "Governed mission conversation corpus is admitted.",

        match: {
          kinds: [
            "conversation",
          ],

          titleIncludes: [
            "mission",
          ],
        },
      },

      {
        id:
          "conversation:operations",

        description:
          "Governed operational conversation corpus is admitted.",

        match: {
          kinds: [
            "conversation",
          ],

          titleIncludes: [
            "operations",
          ],
        },
      },
    ],
  },

  /*
   * CA-005 explicitly leaves canonical Business and Domain source
   * registries unresolved. These remain measurable gaps rather than
   * fabricated progress.
   */
  {
    moduleId:
      "business-domain-literacy",

    requirements: [
      {
        id:
          "business:approved-business-knowledge",

        description:
          "Approved business curriculum exists in the governed corpus.",

        match: {
          kinds: [
            "business",
          ],
        },
      },

      {
        id:
          "domain:approved-domain-knowledge",

        description:
          "Approved domain curriculum exists in the governed corpus.",

        match: {
          kinds: [
            "domain",
          ],
        },
      },
    ],
  },
];

export function coverageRequirementsForModule(
  moduleId:
    string,
): EducationalCoverageRequirement[] {
  return (
    certifiedEducationalCoverageRequirements.find(
      (definition) =>
        definition.moduleId ===
        moduleId,
    )?.requirements ??
    []
  );
}
