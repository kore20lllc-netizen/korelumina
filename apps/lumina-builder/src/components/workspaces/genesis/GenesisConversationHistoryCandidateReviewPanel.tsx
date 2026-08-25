import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash2,
  FileWarning,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  useGenesisConversationHistoryCandidateReview,
} from "@/hooks/useGenesisConversationHistoryCandidateReview";

import {
  auth,
} from "@/providers/auth-registry";

import type {
  GenesisConversationHistoryCandidateReviewDecision,
  GenesisConversationHistoryKnownOmission,
} from "@/services/runtime/genesisConversationExpectedHistoryCandidateReview";


interface EditableOmission {
  id:
    number;

  description:
    string;

  projectId:
    string;

  conversationId:
    string;

  basis:
    string;
}


function Metric({
  label,
  value,
  detail,
}: {
  label:
    string;

  value:
    string;

  detail:
    string;
}) {
  return (
    <LuminaFlagshipCard
      as="article"
      className="min-w-0 px-4 py-4"
    >
      <div className="relative z-10">
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-300/72">
          {label}
        </div>

        <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-amber-400">
          {value}
        </div>

        <div className="mt-1 text-xs leading-5 text-sky-300/58">
          {detail}
        </div>
      </div>
    </LuminaFlagshipCard>
  );
}


function StatusBadge({
  state,
}: {
  state:
    string;
}) {
  const className =
    state ===
      "PENDING_REVIEW"
      ? "border-amber-400/30 bg-amber-500/[0.08] text-amber-200"
      : state ===
          "SCOPE_ATTESTED"
        ? "border-cyan-400/30 bg-cyan-500/[0.08] text-cyan-200"
        : state ===
            "GAPS_DECLARED"
          ? "border-violet-400/30 bg-violet-500/[0.08] text-violet-200"
          : "border-red-400/30 bg-red-500/[0.08] text-red-200";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1",
        "text-[10px] font-semibold uppercase tracking-[0.12em]",
        className,
      ].join(
        " ",
      )}
    >
      {state.replaceAll(
        "_",
        " ",
      )}
    </span>
  );
}


function inputClassName() {
  return [
    "w-full rounded-xl border px-3 py-2.5 text-sm text-foreground outline-none transition",
    "[border-color:var(--lumina-border-standard)]",
    "[background:var(--lumina-surface-compact)]",
    "placeholder:text-muted-foreground/60",
    "focus:[border-color:var(--lumina-border-emphasis)]",
  ].join(
    " ",
  );
}


export function GenesisConversationHistoryCandidateReviewPanel() {
  const {
    review,
    loading,
    submitting,
    error,
    refresh,
    decide,
    clearError,
  } =
    useGenesisConversationHistoryCandidateReview();

  const currentUser =
    auth.getUser();

  const [
    selectedDecision,
    setSelectedDecision,
  ] =
    useState<
      GenesisConversationHistoryCandidateReviewDecision |
      null
    >(
      null,
    );

  const [
    notes,
    setNotes,
  ] =
    useState(
      "",
    );

  const [
    omissions,
    setOmissions,
  ] =
    useState<EditableOmission[]>(
      [],
    );

  const [
    nextOmissionId,
    setNextOmissionId,
  ] =
    useState(
      1,
    );

  const normalizedOmissions =
    useMemo(
      (): GenesisConversationHistoryKnownOmission[] =>
        omissions.map(
          omission => ({
            description:
              omission.description.trim(),

            ...(omission.projectId.trim()
              ? {
                  projectId:
                    omission.projectId.trim(),
                }
              : {}),

            ...(omission.conversationId.trim()
              ? {
                  conversationId:
                    omission.conversationId.trim(),
                }
              : {}),

            basis:
              omission.basis.trim(),
          }),
        ),
      [
        omissions,
      ],
    );

  const omissionsValid =
    normalizedOmissions.length >
      0 &&
    normalizedOmissions.every(
      omission =>
        omission.description.length >
          0 &&
        omission.basis.length >
          0,
    );

  const canSubmit =
    Boolean(
      review?.state ===
        "PENDING_REVIEW" &&
      currentUser?.id &&
      selectedDecision &&
      !submitting &&
      (
        selectedDecision !==
          "DECLARE_GAPS" ||
        omissionsValid
      ),
    );


  if (
    loading &&
    !review
  ) {
    return (
      <LuminaFlagshipPanel
        title="Conversation History Candidate Review"
        description="Reading the governed corpus-level candidate review from Runtime."
      >
        <div className="flex min-h-[320px] items-center justify-center gap-3 px-6 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Reading candidate review…
        </div>
      </LuminaFlagshipPanel>
    );
  }


  if (
    !review
  ) {
    return (
      <LuminaFlagshipPanel
        title="Conversation History Candidate Review"
        description="The governed candidate review projection is unavailable."
      >
        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Candidate review unavailable
            </div>

            <div className="mt-2 break-all font-mono text-xs text-red-200/80">
              {error ??
                "genesis_conversation_history_candidate_review_unavailable"}
            </div>
          </div>

          <LuminaButton
            variant="toolbar"
            onClick={() => {
              void refresh();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </LuminaButton>
        </div>
      </LuminaFlagshipPanel>
    );
  }


  return (
    <LuminaFlagshipPanel
      title="Conversation History Candidate Review"
      description="Governed corpus-level review of the recovered conversation-history candidate. This review does not certify Day-0 completeness or create authoritative expected history."
      toolbar={
        <div className="flex items-center gap-3">
          <StatusBadge
            state={
              review.state
            }
          />

          <LuminaButton
            variant="subtle"
            size="sm"
            disabled={
              loading ||
              submitting
            }
            onClick={() => {
              void refresh();
            }}
          >
            <RefreshCw
              className={[
                "h-3.5 w-3.5",
                loading
                  ? "animate-spin"
                  : "",
              ].join(
                " ",
              )}
            />
            Refresh
          </LuminaButton>
        </div>
      }
    >
      <div className="relative z-10 space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Review State"
            value={
              review.state.replaceAll(
                "_",
                " ",
              )
            }
            detail="Corpus-level governance state"
          />

          <Metric
            label="Candidate Conversations"
            value={
              String(
                review.candidateConversationCount,
              )
            }
            detail="Recovered candidate corpus"
          />

          <Metric
            label="Projects"
            value={
              String(
                review.candidateProjectIds.length,
              )
            }
            detail="Distinct ChatGPT project groups"
          />

          <Metric
            label="Known Omissions"
            value={
              String(
                review.knownOmissions.length,
              )
            }
            detail="Explicitly declared evidence gaps"
          />

          <Metric
            label="Authoritative Expected History"
            value={
              review.authoritativeExpectedHistoryCreated
                ? "Created"
                : "Not Created"
            }
            detail="Candidate review does not create authority"
          />

          <Metric
            label="Day-0 Coverage"
            value={
              review.dayZeroConversationCoverageCertified
                ? "Certified"
                : "Not Certified"
            }
            detail="Requires a separate evidence-backed gate"
          />

          <Metric
            label="Promotion"
            value={
              review.promotionAvailable
                ? "Available"
                : "Unavailable"
            }
            detail="No promotion contract exists here"
          />

          <Metric
            label="Reviewer"
            value={
              review.reviewedBy ??
              "Pending"
            }
            detail={
              review.reviewedAt
                ? new Date(
                    review.reviewedAt,
                  ).toLocaleString()
                : "No human decision recorded"
            }
          />
        </div>

        <div className="rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

            <div>
              <div className="text-sm font-semibold text-foreground">
                Candidate corpus review only
              </div>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                Scope attestation records a human judgment about the recovered candidate corpus.
                It does not create authoritative expected history, certify Day-0 conversation
                coverage, or make promotion available.
              </p>
            </div>
          </div>
        </div>

        {review.knownOmissions.length >
          0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300/72">
              Declared omissions
            </div>

            {review.knownOmissions.map(
              (
                omission,
                index,
              ) => (
                <LuminaFlagshipCard
                  key={`${omission.description}-${index}`}
                  as="article"
                  className="min-w-0 px-4 py-4"
                >
                  <div className="relative z-10">
                    <div className="text-sm font-semibold text-foreground">
                      {omission.description}
                    </div>

                    <div className="mt-2 text-xs leading-5 text-muted-foreground">
                      Basis: {omission.basis}
                    </div>

                    {(omission.projectId ||
                      omission.conversationId) && (
                      <div className="mt-3 flex flex-wrap gap-3 font-mono text-[11px] text-sky-300/60">
                        {omission.projectId && (
                          <span>
                            project:{omission.projectId}
                          </span>
                        )}

                        {omission.conversationId && (
                          <span>
                            conversation:{omission.conversationId}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </LuminaFlagshipCard>
              ),
            )}
          </div>
        )}

        {review.state ===
          "PENDING_REVIEW" ? (
          <div className="space-y-5 rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-interactive)] p-5">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Human review decision
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Select a governed decision. Selection alone does not write Runtime state;
                the decision is recorded only when Submit review decision is invoked.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() => {
                  setSelectedDecision(
                    "ATTEST_SCOPE",
                  );
                }}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  selectedDecision ===
                    "ATTEST_SCOPE"
                    ? "[border-color:var(--lumina-border-emphasis)] [background:var(--lumina-surface-selected)]"
                    : "[border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)]",
                ].join(
                  " ",
                )}
              >
                <CheckCircle2 className="h-5 w-5 text-cyan-300" />

                <div className="mt-3 text-sm font-semibold text-foreground">
                  Attest Scope
                </div>

                <div className="mt-2 text-xs leading-5 text-muted-foreground">
                  Record that the candidate corpus scope has been reviewed without declaring known omissions.
                </div>
              </button>

              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() => {
                  setSelectedDecision(
                    "DECLARE_GAPS",
                  );

                  if (
                    omissions.length ===
                      0
                  ) {
                    setOmissions([
                      {
                        id:
                          nextOmissionId,

                        description:
                          "",

                        projectId:
                          "",

                        conversationId:
                          "",

                        basis:
                          "",
                      },
                    ]);

                    setNextOmissionId(
                      value =>
                        value +
                        1,
                    );
                  }
                }}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  selectedDecision ===
                    "DECLARE_GAPS"
                    ? "[border-color:var(--lumina-border-emphasis)] [background:var(--lumina-surface-selected)]"
                    : "[border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)]",
                ].join(
                  " ",
                )}
              >
                <FileWarning className="h-5 w-5 text-amber-300" />

                <div className="mt-3 text-sm font-semibold text-foreground">
                  Declare Gaps
                </div>

                <div className="mt-2 text-xs leading-5 text-muted-foreground">
                  Record one or more evidence-backed omissions in the recovered candidate corpus.
                </div>
              </button>

              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() => {
                  setSelectedDecision(
                    "REJECT",
                  );
                }}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  selectedDecision ===
                    "REJECT"
                    ? "border-red-400/35 bg-red-500/[0.07]"
                    : "[border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)]",
                ].join(
                  " ",
                )}
              >
                <CircleSlash2 className="h-5 w-5 text-red-300" />

                <div className="mt-3 text-sm font-semibold text-foreground">
                  Reject Candidate
                </div>

                <div className="mt-2 text-xs leading-5 text-muted-foreground">
                  Reject this candidate corpus without creating authoritative expected history.
                </div>
              </button>
            </div>

            {selectedDecision ===
              "DECLARE_GAPS" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Known omissions
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Description and evidence basis are required. Project and conversation IDs are optional.
                    </div>
                  </div>

                  <LuminaButton
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      setOmissions(
                        current => [
                          ...current,
                          {
                            id:
                              nextOmissionId,

                            description:
                              "",

                            projectId:
                              "",

                            conversationId:
                              "",

                            basis:
                              "",
                          },
                        ],
                      );

                      setNextOmissionId(
                        value =>
                          value +
                          1,
                      );
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add omission
                  </LuminaButton>
                </div>

                {omissions.map(
                  (
                    omission,
                    index,
                  ) => (
                    <div
                      key={
                        omission.id
                      }
                      className="rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300/72">
                          Omission {index + 1}
                        </div>

                        {omissions.length >
                          1 && (
                          <LuminaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setOmissions(
                                current =>
                                  current.filter(
                                    item =>
                                      item.id !==
                                      omission.id,
                                  ),
                              );
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </LuminaButton>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <input
                          className={inputClassName()}
                          aria-label={`Omission ${index + 1} description`}
                          placeholder="Description *"
                          value={
                            omission.description
                          }
                          onChange={
                            event => {
                              const value =
                                event.target.value;

                              setOmissions(
                                current =>
                                  current.map(
                                    item =>
                                      item.id ===
                                        omission.id
                                        ? {
                                            ...item,
                                            description:
                                              value,
                                          }
                                        : item,
                                  ),
                              );
                            }
                          }
                        />

                        <input
                          className={inputClassName()}
                          aria-label={`Omission ${index + 1} basis`}
                          placeholder="Evidence basis *"
                          value={
                            omission.basis
                          }
                          onChange={
                            event => {
                              const value =
                                event.target.value;

                              setOmissions(
                                current =>
                                  current.map(
                                    item =>
                                      item.id ===
                                        omission.id
                                        ? {
                                            ...item,
                                            basis:
                                              value,
                                          }
                                        : item,
                                  ),
                              );
                            }
                          }
                        />

                        <input
                          className={inputClassName()}
                          aria-label={`Omission ${index + 1} project ID`}
                          placeholder="Project ID (optional)"
                          value={
                            omission.projectId
                          }
                          onChange={
                            event => {
                              const value =
                                event.target.value;

                              setOmissions(
                                current =>
                                  current.map(
                                    item =>
                                      item.id ===
                                        omission.id
                                        ? {
                                            ...item,
                                            projectId:
                                              value,
                                          }
                                        : item,
                                  ),
                              );
                            }
                          }
                        />

                        <input
                          className={inputClassName()}
                          aria-label={`Omission ${index + 1} conversation ID`}
                          placeholder="Conversation ID (optional)"
                          value={
                            omission.conversationId
                          }
                          onChange={
                            event => {
                              const value =
                                event.target.value;

                              setOmissions(
                                current =>
                                  current.map(
                                    item =>
                                      item.id ===
                                        omission.id
                                        ? {
                                            ...item,
                                            conversationId:
                                              value,
                                          }
                                        : item,
                                  ),
                              );
                            }
                          }
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {selectedDecision && (
              <div className="space-y-3">
                <label
                  htmlFor="genesis-candidate-review-notes"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300/72"
                >
                  Review notes
                </label>

                <textarea
                  id="genesis-candidate-review-notes"
                  rows={3}
                  className={inputClassName()}
                  placeholder="Optional governance notes"
                  value={
                    notes
                  }
                  onChange={
                    event => {
                      setNotes(
                        event.target.value,
                      );
                    }
                  }
                />
              </div>
            )}

            {!currentUser?.id && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4 text-sm text-amber-100">
                A stable signed-in operator identity is required before a review decision can be recorded.
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  Review decision failed
                </div>

                <div className="mt-2 break-all font-mono text-xs text-red-200/80">
                  {error}
                </div>

                <div className="mt-3">
                  <LuminaButton
                    variant="ghost"
                    size="sm"
                    onClick={
                      clearError
                    }
                  >
                    Clear error
                  </LuminaButton>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t [border-color:var(--lumina-border-standard)] pt-5">
              <div className="text-xs leading-5 text-muted-foreground">
                Operator:{" "}
                <span className="font-mono text-foreground/80">
                  {currentUser?.id ??
                    "unavailable"}
                </span>
              </div>

              <LuminaButton
                variant="toolbar"
                disabled={
                  !canSubmit
                }
                onClick={() => {
                  if (
                    !currentUser?.id ||
                    !selectedDecision
                  ) {
                    return;
                  }

                  void decide({
                    decision:
                      selectedDecision,

                    reviewedBy:
                      currentUser.id,

                    ...(selectedDecision ===
                      "DECLARE_GAPS"
                      ? {
                          knownOmissions:
                            normalizedOmissions,
                        }
                      : {}),

                    ...(notes.trim()
                      ? {
                          notes:
                            notes.trim(),
                        }
                      : {}),
                  });
                }}
              >
                {submitting && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
                Submit review decision
              </LuminaButton>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

              <div>
                <div className="text-sm font-semibold text-foreground">
                  Review decision recorded
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This candidate review is immutable under the current Runtime contract.
                  No authoritative expected history was created, Day-0 conversation
                  coverage remains uncertified, and promotion remains unavailable.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LuminaFlagshipPanel>
  );
}


export default GenesisConversationHistoryCandidateReviewPanel;
