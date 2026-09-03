import {
  createHash,
} from "node:crypto";

import type {
  GenesisDayZeroCertificationCandidate,
  GenesisDayZeroCertificationCandidateId,
} from "./GenesisDayZeroCertificationCandidate.js";


export type GenesisDayZeroConversationCoverageCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface GenesisDayZeroConversationCoverageCertificationGate {
  state:
    GenesisDayZeroConversationCoverageCertificationRuntimeState;

  certificationId:
    string | null;
}


export interface GenesisDayZeroGovernedCertificationCandidate
  extends GenesisDayZeroCertificationCandidate {
  conversationCoverageCertification: {
    state:
      GenesisDayZeroConversationCoverageCertificationRuntimeState;

    certificationId:
      string | null;

    valid:
      boolean;
  };
}


function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          key => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}


function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}


export function buildGenesisDayZeroGovernedCertificationCandidate(
  input: {
    candidate:
      GenesisDayZeroCertificationCandidate;

    conversationCoverageCertification:
      GenesisDayZeroConversationCoverageCertificationGate;
  },
): GenesisDayZeroGovernedCertificationCandidate {
  const coverageValid =
    input
      .conversationCoverageCertification
      .state ===
        "VALID" &&
    input
      .conversationCoverageCertification
      .certificationId !==
        null;

  const blockers = [
    ...input.candidate.blockers,

    ...(
      coverageValid
        ? []
        : [
            "day-zero-conversation-coverage-not-certified",
          ]
    ),
  ];

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const state =
    input.candidate.state ===
      "BLOCKED" ||
    input
      .conversationCoverageCertification
      .state ===
        "BLOCKED"
      ? "BLOCKED" as const
      : normalizedBlockers.length >
          0
        ? "INCOMPLETE" as const
        : "READY" as const;

  const candidateId =
    `genesis-day-zero-certification-candidate:${hash({
      rawCandidateId:
        input.candidate
          .candidateId,

      coverageCertificationState:
        input
          .conversationCoverageCertification
          .state,

      coverageCertificationId:
        input
          .conversationCoverageCertification
          .certificationId,

      blockers:
        normalizedBlockers,

      state,
    })}` as GenesisDayZeroCertificationCandidateId;

  return {
    ...input.candidate,

    candidateId,

    state,

    blockers:
      normalizedBlockers,

    conversationCoverageCertification: {
      state:
        input
          .conversationCoverageCertification
          .state,

      certificationId:
        input
          .conversationCoverageCertification
          .certificationId,

      valid:
        coverageValid,
    },
  };
}
