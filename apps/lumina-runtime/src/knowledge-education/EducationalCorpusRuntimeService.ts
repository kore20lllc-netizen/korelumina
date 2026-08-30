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

import {
  FileEducationalAuthorityResolutionStore,
} from "./EducationalAuthorityResolutionPersistence.js";

import type {
  KnowledgeEducationSnapshot,
} from "./KnowledgeEducationProjectionService.js";

import {
  FileGenesisConversationAcquisitionPersistenceStore,
} from "../knowledge-preservation/genesis/index.js";

import type {
  GenesisConversationAcquisitionLatestState,
  GenesisDayZeroCertificationRuntimeProjection,
  GenesisOperationalProjection,
} from "../knowledge-preservation/genesis/index.js";

import {
  projectGenesisHistoricalEducation,
} from "./GenesisHistoricalEducationProjection.js";

import {
  assessGenesisHistoricalEducationSources,
} from "./GenesisHistoricalEducationSourceAssessment.js";

import {
  assembleEducationalCorpusHistoricalEvidence,
} from "./EducationalCorpusHistoricalEvidence.js";

import {
  measureHistoricalConversationEducationalCoverage,
} from "./HistoricalConversationEducationalCoverage.js";

import type {
  HistoricalConversationEducationalCoverageResult,
} from "./HistoricalConversationEducationalCoverage.js";

import {
  buildEducationalCorpusCertificationCandidate,
} from "./EducationalCorpusCertificationCandidate.js";

import type {
  EducationalCorpusCertificationCandidate,
} from "./EducationalCorpusCertificationCandidate.js";


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

  historicalConversationCoverage?:
    HistoricalConversationEducationalCoverageResult |
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

  certificationCandidate:
    EducationalCorpusCertificationCandidate |
    null;
}


export interface EducationalCorpusEducationReader {
  snapshot():
    KnowledgeEducationSnapshot;
}


export interface EducationalCorpusDayZeroReader {
  read():
    GenesisDayZeroCertificationRuntimeProjection;
}


export interface EducationalCorpusGenesisHistoricalReader {
  read():
    GenesisOperationalProjection |
    null;
}


export interface EducationalCorpusConversationEvidenceReader {
  loadLatest():
    GenesisConversationAcquisitionLatestState |
    null;
}


export class EducationalCorpusRuntimeService {
  constructor(
    private readonly persistence:
      EducationalCorpusPersistenceStore,

    private readonly education:
      EducationalCorpusEducationReader,

    private readonly dayZero:
      EducationalCorpusDayZeroReader,

    private readonly genesisHistorical?:
      EducationalCorpusGenesisHistoricalReader,

    private readonly authorityResolutions =
      new FileEducationalAuthorityResolutionStore(),

    private readonly conversationEvidence:
      EducationalCorpusConversationEvidenceReader =
        new FileGenesisConversationAcquisitionPersistenceStore(),
  ) {}


  private loadAuthorityResolutions(
    artifactIds:
      readonly string[],
  ) {
    return artifactIds
      .map(
        artifactId =>
          this.authorityResolutions
            .load(
              artifactId,
            ),
      )
      .filter(
        (
          resolution,
        ): resolution is NonNullable<
          typeof resolution
        > =>
          resolution !==
          null,
      );
  }


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

        historicalConversationCoverage:
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

        certificationCandidate:
          null,
      };
    }

    const education =
      this.education
        .snapshot();

    const genesisHistorical =
      this.genesisHistorical
        ?.read() ??
      null;

    const historicalProjection =
      genesisHistorical
        ? projectGenesisHistoricalEducation(
            genesisHistorical,
          )
        : null;

    const historicalAssessments =
      historicalProjection
        ? assessGenesisHistoricalEducationSources(
            historicalProjection.records,
          )
        : [];

    const historicalEvidence =
      historicalProjection
        ? assembleEducationalCorpusHistoricalEvidence({
            records:
              historicalProjection.records,

            assessments:
              historicalAssessments,
          })
        : null;

    const latestConversationAcquisition =
      this.conversationEvidence
        .loadLatest();

    const persistedConversationEvidence =
      latestConversationAcquisition
        ?.state ===
        "ACQUIRED"
        ? latestConversationAcquisition
            .evidence
        : [];

    const historicalConversationCoverage =
      historicalEvidence
        ? measureHistoricalConversationEducationalCoverage({
            historicalEvidence,

            conversationEvidence:
              persistedConversationEvidence,
          })
        : null;

    const sourceContract =
      buildEducationalCorpusSourceContract({
        artifacts:
          education.artifacts,

        historicalAssessments,

        authorityResolutions:
          this.loadAuthorityResolutions(
            education.artifacts.map(
              artifact =>
                artifact.id,
            ),
          ),

        dayZero,
      });

    const currentCorpus =
      assembleEducationalCorpus({
        artifacts:
          education.artifacts,

        sourceContract,

        historicalEvidence,
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
        0 ||
      sourceContract
        .summary
        .historicalBlocked >
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
        .historicalBlocked >
      0
    ) {
      blockers.push(
        "educational-corpus-historical-evidence-blocked",
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

    const projectionWithoutCandidate = {
      state,

      persistedCorpus,

      currentCorpus,

      sourceContract,

      historicalConversationCoverage,

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
          false as const,

        initialCompetencyCertified:
          false as const,

        chiefAgentActivationAuthorized:
          false as const,
      },
    };

    return {
      ...projectionWithoutCandidate,

      certificationCandidate:
        buildEducationalCorpusCertificationCandidate({
          runtime:
            projectionWithoutCandidate,

          artifacts:
            education.artifacts,
        }),
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

    const genesisHistorical =
      this.genesisHistorical
        ?.read() ??
      null;

    const historicalProjection =
      genesisHistorical
        ? projectGenesisHistoricalEducation(
            genesisHistorical,
          )
        : null;

    const historicalAssessments =
      historicalProjection
        ? assessGenesisHistoricalEducationSources(
            historicalProjection.records,
          )
        : [];

    const historicalEvidence =
      historicalProjection
        ? assembleEducationalCorpusHistoricalEvidence({
            records:
              historicalProjection.records,

            assessments:
              historicalAssessments,
          })
        : null;

    const sourceContract =
      buildEducationalCorpusSourceContract({
        artifacts:
          education.artifacts,

        historicalAssessments,

        authorityResolutions:
          this.loadAuthorityResolutions(
            education.artifacts.map(
              artifact =>
                artifact.id,
            ),
          ),

        dayZero,
      });

    const corpus =
      assembleEducationalCorpus({
        artifacts:
          education.artifacts,

        sourceContract,

        historicalEvidence,
      });

    this.persistence
      .save(
        corpus,
      );

    return this.read();
  }
}
