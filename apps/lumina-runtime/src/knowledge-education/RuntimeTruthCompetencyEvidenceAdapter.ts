import type {
  PublicRuntimeRecord,
  RuntimeStatus,
} from "../runtime/registry.js";

import {
  createInitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";

import type {
  InitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";


export interface RuntimeTruthObservation {
  observedAt:
    number;

  sourceRef:
    string;

  runtime:
    PublicRuntimeRecord;
}


export interface RuntimeTruthEvidenceAssessment {
  projectId:
    string;

  eligible:
    boolean;

  missingRequirements:
    readonly string[];

  evidence:
    InitialCompetencyEvidenceRecord |
    null;
}


const authoritativeRuntimeStates:
  readonly RuntimeStatus[] = [
    "starting",
    "running",
    "stopping",
    "exited",
    "error",
  ];


function nonEmptyString(
  value:
    unknown,
): string | null {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  )
    ? value.trim()
    : null;
}


function validTimestamp(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    ) &&
    value >
      0
  );
}


export function deriveRuntimeTruthCompetencyEvidence(
  observation:
    RuntimeTruthObservation,
): RuntimeTruthEvidenceAssessment {
  const runtime =
    observation.runtime;

  const missing:
    string[] =
      [];

  const projectId =
    nonEmptyString(
      runtime.projectId,
    );

  const sourceRef =
    nonEmptyString(
      observation.sourceRef,
    );

  if (
    !projectId
  ) {
    missing.push(
      "project-id",
    );
  }

  if (
    !sourceRef
  ) {
    missing.push(
      "runtime-source-ref",
    );
  }

  if (
    !validTimestamp(
      observation.observedAt,
    )
  ) {
    missing.push(
      "observation-time",
    );
  }

  if (
    !authoritativeRuntimeStates.includes(
      runtime.status,
    )
  ) {
    missing.push(
      "runtime-status",
    );
  }

  if (
    !validTimestamp(
      runtime.startedAt,
    )
  ) {
    missing.push(
      "runtime-started-at",
    );
  }

  if (
    !nonEmptyString(
      runtime.framework,
    )
  ) {
    missing.push(
      "runtime-framework",
    );
  }

  if (
    !Number.isFinite(
      runtime.port,
    ) ||
    runtime.port <=
      0
  ) {
    missing.push(
      "runtime-port",
    );
  }

  const normalizedMissing =
    [
      ...new Set(
        missing,
      ),
    ].sort();

  if (
    normalizedMissing.length >
      0 ||
    !projectId ||
    !sourceRef ||
    !validTimestamp(
      observation.observedAt,
    )
  ) {
    return {
      projectId:
        projectId ??
        "",

      eligible:
        false,

      missingRequirements:
        normalizedMissing,

      evidence:
        null,
    };
  }

  const evidence =
    createInitialCompetencyEvidenceRecord({
      evidenceId:
        `competency-evidence:runtime-truth:${projectId}:${observation.observedAt}`,

      competencyId:
        "runtime-truth-distinction",

      source:
        "runtime",

      sourceRef,

      claim:
        [
          `Operational state for project ${projectId}`,
          `was observed directly from the Runtime registry as ${runtime.status}.`,
          "The claim is grounded in Runtime state rather than inferred from knowledge or memory.",
        ].join(
          " ",
        ),

      observedAt:
        observation.observedAt,
    });

  return {
    projectId,

    eligible:
      true,

    missingRequirements:
      [],

    evidence,
  };
}
