import {
  assembleEducationalCorpus,
} from "./EducationalCorpus.js";

import {
  buildEducationalCorpusSourceContract,
} from "./EducationalCorpusSourceContract.js";

import type {
  EducationalCorpus,
} from "./EducationalCorpus.js";

import type {
  EducationalCorpusSourceContract,
} from "./EducationalCorpusSourceContract.js";

import type {
  EducationalCorpusPersistenceStore,
} from "./EducationalCorpusPersistence.js";

import type {
  KnowledgeEducationSnapshot,
} from "./KnowledgeEducationProjectionService.js";

import type {
  GenesisDayZeroCertificationRuntimeProjection,
} from "../knowledge-preservation/genesis/index.js";


export type EducationalCorpusRuntimeState =
  | "UNSET"
  | "CURRENT"
  | "STALE"
  | "INCOMPLETE"
  | "BLOCKED";


export interface EducationalCorpusRuntimeProjection {
  state:
    EducationalCorpusRuntimeState;

  persistedCorpus:
    EducationalCorpus |
    null;

  currentCorpus:
    EducationalCorpus |
    null;

  sourceContract:
    EducationalCorpusSourceContract |
    null;

  dayZeroState:
    GenesisDayZeroCertificationRuntimeProjection[
      "state"
    ];

  blockers:
    readonly string[];

  unresolvedArtifactIds:
    readonly string[];

  downstream: {
    educationalCorpusCertified:
      false;

    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export interface EducationalCorpusEducationReader {
  snapshot():
    KnowledgeEducationSnapshot;
}


export interface EducationalCorpusDayZeroReader {
  read():
    GenesisDayZeroCertificationRuntimeProjection;
}


export class EducationalCorpusRuntimeService {
  constructor(
    private readonly persistence:
      EducationalCorpusPersistenceStore,

    private readonly education:
      EducationalCorpusEducationReader,

    private readonly dayZero:
      EducationalCorpusDayZeroReader,
  ) {}


  read():
    EducationalCorpusRuntimeProjection {
    const persistedCorpus =
      this.persistence
        .load();

    const dayZero =
      this.dayZero
        .read();

    if (
      dayZero.state !==
        "VALID" ||
      !dayZero.certification
    ) {
      return {
        state:
          "BLOCKED",

        persistedCorpus,

        currentCorpus:
          null,

        sourceContract:
          null,

        dayZeroState:
          dayZero.state,

        blockers: [
          "valid-day-zero-genesis-certification-required",
        ],

        unresolvedArtifactIds:
          [],

        downstream: {
          educationalCorpusCertified:
            false,

          initialCompetencyCertified:
            false,

          chiefAgentActivationAuthorized:
            false,
        },
      };
    }

    const education =
      this.education
        .snapshot();

    const sourceContract =
      buildEducationalCorpusSourceContract({
        artifacts:
          education.artifacts,

        dayZero,
      });

    const currentCorpus =
      assembleEducationalCorpus({
        artifacts:
          education.artifacts,

        sourceContract,
      });

    const unresolvedArtifactIds =
      [
        ...sourceContract
          .unresolvedArtifactIds,
      ].sort();

    const incomplete =
      sourceContract
        .summary
        .requiresAuthorityReview >
        0 ||
      sourceContract
        .summary
        .blocked >
        0;

    let state:
      EducationalCorpusRuntimeState;

    if (
      !persistedCorpus
    ) {
      state =
        incomplete
          ? "INCOMPLETE"
          : "UNSET";
    } else if (
      persistedCorpus
        .corpusId !==
      currentCorpus
        .corpusId
    ) {
      state =
        incomplete
          ? "INCOMPLETE"
          : "STALE";
    } else if (
      incomplete
    ) {
      state =
        "INCOMPLETE";
    } else {
      state =
        "CURRENT";
    }

    const blockers:
      string[] =
        [];

    if (
      sourceContract
        .summary
        .blocked >
      0
    ) {
      blockers.push(
        "educational-corpus-source-contract-blocked",
      );
    }

    if (
      sourceContract
        .summary
        .requiresAuthorityReview >
      0
    ) {
      blockers.push(
        "educational-corpus-authority-review-required",
      );
    }

    if (
      persistedCorpus &&
      persistedCorpus
        .corpusId !==
      currentCorpus
        .corpusId
    ) {
      blockers.push(
        "persisted-educational-corpus-stale",
      );
    }

    return {
      state,

      persistedCorpus,

      currentCorpus,

      sourceContract,

      dayZeroState:
        dayZero.state,

      blockers: [
        ...new Set(
          blockers,
        ),
      ].sort(),

      unresolvedArtifactIds,

      downstream: {
        educationalCorpusCertified:
          false,

        initialCompetencyCertified:
          false,

        chiefAgentActivationAuthorized:
          false,
      },
    };
  }


  persistCurrent():
    EducationalCorpusRuntimeProjection {
    const dayZero =
      this.dayZero
        .read();

    if (
      dayZero.state !==
        "VALID" ||
      !dayZero.certification
    ) {
      throw new Error(
        "educational_corpus_valid_day_zero_certification_required",
      );
    }

    const education =
      this.education
        .snapshot();

    const sourceContract =
      buildEducationalCorpusSourceContract({
        artifacts:
          education.artifacts,

        dayZero,
      });

    const corpus =
      assembleEducationalCorpus({
        artifacts:
          education.artifacts,

        sourceContract,
      });

    this.persistence
      .save(
        corpus,
      );

    return this.read();
  }
}
