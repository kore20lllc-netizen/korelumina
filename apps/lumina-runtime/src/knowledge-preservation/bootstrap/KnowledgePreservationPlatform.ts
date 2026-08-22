import {
  createHash,
} from "node:crypto";

import {
  assertValidEvidenceItem,
} from "../evidence/index.js";

import type {
  EvidenceItem,
} from "../evidence/index.js";

import {
  KnowledgeCompilerPipeline,
  KnowledgeCompilerRegistry,
} from "../compiler/index.js";

import {
  KnowledgeNormalizationPipeline,
  KnowledgeNormalizationRegistry,
} from "../normalization/index.js";

import {
  KnowledgeValidationPipeline,
  KnowledgeValidationRegistry,
} from "../validation/index.js";

import {
  KnowledgePublisherRegistry,
  KnowledgePublishingPipeline,
} from "../publisher/index.js";

import {
  KnowledgePackageService,
} from "../package/index.js";

import {
  KnowledgeManufacturingRunService,
} from "../manufacturing/index.js";

import type {
  KnowledgeManufacturingStage,
} from "../manufacturing/index.js";

import {
  CanonicalKnowledgeStore,
} from "../../canonical-knowledge/index.js";

import type {
  GovernanceReadySignalPublisher,
} from "../governance/index.js";

import {
  NoopGovernanceReadySignalPublisher,
} from "../governance/index.js";

const COMPILER_STAGES: readonly {
  stage:
    KnowledgeManufacturingStage;

  compilerNames:
    readonly string[];
}[] = [
  {
    stage:
      "Documentation Compiler",

    compilerNames: [
      "DocumentationCompiler",
      "ADRCompiler",
      "SourceCompiler",
    ],
  },
  {
    stage:
      "Conversation Compiler",

    compilerNames: [
      "ConversationCompiler",
    ],
  },
  {
    stage:
      "Git Compiler",

    compilerNames: [
      "GitCompiler",
    ],
  },
  {
    stage:
      "Runtime Compiler",

    compilerNames: [
      "RuntimeCompiler",
    ],
  },
  {
    stage:
      "Mission Compiler",

    compilerNames: [
      "MissionCompiler",
    ],
  },
  {
    stage:
      "Execution Compiler",

    compilerNames: [
      "ExecutionCompiler",
    ],
  },
];

function manufacturingRunId(
  evidence:
    EvidenceItem,
): string {
  const digest =
    createHash(
      "sha256",
    )
      .update(
        evidence.id,
      )
      .digest(
        "hex",
      )
      .slice(
        0,
        20,
      );

  return `KMR-${digest}`;
}

function normalizeCompilerIdentity(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      "",
    );
}

function compilerDisplayName(
  compiler:
    {
      name:
        string;
    },
): string {
  return normalizeCompilerIdentity(
    compiler.name,
  );
}

export class KnowledgePreservationPlatform {
  constructor(
    private readonly governanceReadySignalPublisher:
      GovernanceReadySignalPublisher =
        new NoopGovernanceReadySignalPublisher(),

    private readonly now:
      () => number =
        () => Date.now(),
  ) {}

  readonly compilerRegistry =
    new KnowledgeCompilerRegistry();

  readonly normalizationRegistry =
    new KnowledgeNormalizationRegistry();

  readonly validationRegistry =
    new KnowledgeValidationRegistry();

  readonly publisherRegistry =
    new KnowledgePublisherRegistry();

  readonly packageService =
    new KnowledgePackageService();

  readonly manufacturingRunService =
    new KnowledgeManufacturingRunService();

  readonly canonicalKnowledgeStore =
    new CanonicalKnowledgeStore();

  readonly compilerPipeline =
    new KnowledgeCompilerPipeline(
      this.compilerRegistry,
    );

  readonly normalizationPipeline =
    new KnowledgeNormalizationPipeline(
      this.normalizationRegistry,
    );

  readonly validationPipeline =
    new KnowledgeValidationPipeline(
      this.validationRegistry,
    );

  readonly publishingPipeline =
    new KnowledgePublishingPipeline(
      this.publisherRegistry,
    );

  async preserve(
    evidence:
      EvidenceItem,
  ): Promise<void> {
    /*
     * Evidence admission is a runtime boundary.
     *
     * Reject malformed envelopes before persistence,
     * manufacturing-run creation, compiler selection, or
     * downstream governance.
     */
    assertValidEvidenceItem(
      evidence,
    );


    const runId =
      manufacturingRunId(
        evidence,
      );

    const existing =
      this.manufacturingRunService.get(
        runId,
      );

    if (
      existing
    ) {
      throw new Error(
        "knowledge_manufacturing_run_already_exists",
      );
    }

    this.manufacturingRunService.create({
      id:
        runId,

      evidenceId:
        evidence.id,
    });

    /*
     * Evidence Intake remains the initial entered station.
     *
     * Its completion is performed by the evidence-aware route
     * below so the capsule moves directly to the applicable
     * compiler instead of advancing linearly through the
     * compiler topology.
     */
    const supportingCompilers =
      this.compilerRegistry
        .findSupportingCompilers(
          evidence,
        );

    const supportingNames =
      new Set(
        supportingCompilers.map(
          compilerDisplayName,
        ),
      );

    /*
     * Compiler stations are parallel capabilities, not a
     * mandatory serial conveyor.
     *
     * Select only stations that actually support this evidence.
     */
    const applicableCompilerStages =
      COMPILER_STAGES.filter(
        (compilerStage) =>
          compilerStage
            .compilerNames
            .some(
              (name) =>
                supportingNames.has(
                  normalizeCompilerIdentity(
                    name,
                  ),
                ),
            ),
      );

    if (
      applicableCompilerStages.length ===
      0
    ) {
      this.manufacturingRunService.advance(
        runId,
        {
          outcome:
            "failed",

          detail:
            `No registered Knowledge Compiler supports evidence type ${evidence.type}.`,
        },
      );

      throw new Error(
        "knowledge_compiler_not_found",
      );
    }

    /*
     * Route directly from Evidence Intake to the first
     * applicable compiler. Any compiler capabilities crossed
     * on the diagram are recorded as not_applicable without
     * ever being entered.
     */
    this.manufacturingRunService.route(
      runId,
      {
        targetStage:
          applicableCompilerStages[0]
            .stage,

        outcome:
          "completed",

        detail:
          `Evidence ${evidence.id} accepted and routed directly to ${applicableCompilerStages[0].stage}.`,
      },
    );

    /*
     * Knowledge IR
     */
    let compiled;

    try {
      compiled =
        await this.compilerPipeline.compile(
          evidence,
        );
    } catch (
      error
    ) {
      this.manufacturingRunService.advance(
        runId,
        {
          outcome:
            "failed",

          detail:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        },
      );

      throw error;
    }

    const executedCompilerNames =
      new Set(
        compiled.map(
          (item) =>
            normalizeCompilerIdentity(
              item.compiler
                .compilerName,
            ),
        ),
      );

    const executedCompilerStages =
      COMPILER_STAGES.filter(
        (compilerStage) =>
          compilerStage
            .compilerNames
            .some(
              (name) =>
                executedCompilerNames.has(
                  normalizeCompilerIdentity(
                    name,
                  ),
                ),
            ),
      );

    if (
      executedCompilerStages.length ===
      0
    ) {
      this.manufacturingRunService.advance(
        runId,
        {
          outcome:
            "failed",

          detail:
            "Compiler pipeline returned no attributable Knowledge IR output.",
        },
      );

      throw new Error(
        "knowledge_compiler_output_unattributed",
      );
    }

    /*
     * If more than one distinct compiler capability legitimately
     * emitted IR, visit only those executed stations.
     */
    for (
      const compilerStage
      of executedCompilerStages.slice(
        1,
      )
    ) {
      this.manufacturingRunService.route(
        runId,
        {
          targetStage:
            compilerStage.stage,

          outcome:
            "completed",

          detail:
            `${compilerStage.stage} emitted Knowledge IR.`,
        },
      );
    }

    /*
     * Once actual compiler execution is complete, jump directly
     * to Knowledge IR. Any remaining compiler stations are
     * recorded not_applicable but are never entered.
     */
    this.manufacturingRunService.route(
      runId,
      {
        targetStage:
          "Knowledge IR",

        outcome:
          "completed",

        detail:
          `${compiled.length} Knowledge IR item(s) compiled.`,
      },
    );

    /*
     * Normalization is part of the Knowledge IR manufacturing
     * boundary and does not introduce an additional certified
     * UI station.
     */
    const normalized =
      await this.normalizationPipeline.normalize(
        compiled,
      );

    /*
     * Validation
     *
     * Normalization completed within the Knowledge IR boundary.
     * The capsule must now explicitly enter Validation before
     * the validation pipeline executes.
     */
    this.manufacturingRunService.route(
      runId,
      {
        targetStage:
          "Validation",

        outcome:
          "completed",

        detail:
          `${normalized.length} normalized Knowledge IR item(s) ready for validation.`,
      },
    );

    let validated;

    try {
      validated =
        await this.validationPipeline.validate(
          normalized,
        );
    } catch (
      error
    ) {
      this.manufacturingRunService.advance(
        runId,
        {
          outcome:
            "failed",

          detail:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        },
      );

      throw error;
    }

    this.manufacturingRunService.route(
      runId,
      {
        targetStage:
          "Knowledge Package Assembly",

        outcome:
          "completed",

        detail:
          `${validated.length} Knowledge IR item(s) validated.`,
      },
    );

    /*
     * Knowledge Package Assembly
     */
    const knowledgePackage =
      this.packageService.packageValidated(
        validated,
      );

    if (
      !knowledgePackage
    ) {
      this.manufacturingRunService.advance(
        runId,
        {
          outcome:
            "failed",

          detail:
            "No validated Knowledge IR items were available for package assembly.",
        },
      );

      return;
    }

    this.manufacturingRunService.linkPackage(
      runId,
      knowledgePackage.id,
    );

    this.manufacturingRunService.route(
      runId,
      {
        targetStage:
          "Canonical Review",

        outcome:
          "completed",

        detail:
          `Knowledge Package assembled: ${knowledgePackage.id}`,
      },
    );

    /*
     * Canonical Review is a human governance boundary.
     *
     * Entering the station is automatic because package
     * assembly has completed. Crossing the station is not.
     */
    const parkedRun =
      this.manufacturingRunService.advance(
        runId,
        {
          outcome:
            "awaiting_human_review",

          detail:
            "Knowledge Package is awaiting explicit human canonical review.",
        },
      );

    /*
     * Manufacturing announces only that durable package state
     * has reached the governance boundary.
     *
     * It does not select policy, approve review, or promote
     * Canonical Knowledge.
     */
    if (
      knowledgePackage.state ===
        "awaiting_review" &&
      knowledgePackage.approvalState ===
        "pending_review" &&
      typeof knowledgePackage.version ===
        "string" &&
      knowledgePackage.version.trim() &&
      parkedRun.currentStage ===
        "Canonical Review"
    ) {
      this.governanceReadySignalPublisher
        .publish({
          packageId:
            knowledgePackage.id,

          packageVersion:
            knowledgePackage.version,

          manufacturingRunId:
            parkedRun.id,

          evidenceId:
            evidence.id,

          emittedAt:
            this.now(),
        });
    }

    /*
     * Canonical Review and Canonical Knowledge MUST NOT be
     * auto-approved or auto-published by preserve().
     */
  }
}
