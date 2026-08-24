import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  History,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
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
  useGenesisDayZeroCertification,
} from "@/hooks/useGenesisDayZeroCertification";

import {
  auth,
} from "@/providers/auth-registry";


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
      "CERTIFIED"
      ? "border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-200"
      : state ===
          "READY_FOR_SINGLE_APPROVAL"
        ? "border-cyan-400/30 bg-cyan-500/[0.08] text-cyan-200"
        : state ===
            "BLOCKED"
          ? "border-red-400/30 bg-red-500/[0.08] text-red-200"
          : "border-amber-400/30 bg-amber-500/[0.08] text-amber-200";

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


function scrollToReconstruction() {
  const target =
    document.getElementById(
      "genesis-operational-reconstruction",
    );

  if (
    !target
  ) {
    return;
  }

  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

  target.scrollIntoView({
    behavior:
      reduceMotion
        ? "auto"
        : "smooth",

    block:
      "start",
  });
}


export function GenesisDayZeroCertificationPanel() {
  const {
    projection,
    loading,
    submitting,
    error,
    refresh,
    certify,
    clearError,
  } =
    useGenesisDayZeroCertification();

  const [
    reason,
    setReason,
  ] =
    useState(
      "",
    );

  const [
    gapsAcknowledged,
    setGapsAcknowledged,
  ] =
    useState(
      false,
    );

  const currentUser =
    auth.getUser();

  const approval =
    projection
      ?.approval ??
    null;

  const gaps =
    approval
      ?.acknowledgedHistoricalGaps ??
    [];

  const requiresGapAcknowledgement =
    gaps.length >
    0;

  const canCertify =
    Boolean(
      approval
        ?.approval
        .available &&
      currentUser?.id &&
      reason.trim()
        .length >
        0 &&
      (
        !requiresGapAcknowledgement ||
        gapsAcknowledged
      ) &&
      !submitting,
    );

  const exceptionGroups =
    useMemo(
      () => {
        if (
          !approval
        ) {
          return [];
        }

        return approval.exceptions;
      },
      [
        approval,
      ],
    );


  if (
    loading &&
    !projection
  ) {
    return (
      <LuminaFlagshipPanel
        title="Day-0 Certification"
        description="Reading the authoritative Day-0 certification and exception projection."
      >
        <div className="flex min-h-[320px] items-center justify-center gap-3 px-6 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Reading certification state…
        </div>
      </LuminaFlagshipPanel>
    );
  }


  if (
    !projection
  ) {
    return (
      <LuminaFlagshipPanel
        title="Day-0 Certification"
        description="Authoritative Runtime certification state is unavailable."
      >
        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Certification projection unavailable
            </div>

            <div className="mt-2 break-all font-mono text-xs text-red-200/80">
              {error ??
                "genesis_day_zero_certification_projection_unavailable"}
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
      title="Day-0 Certification"
      description="Exception-only human certification of KoreLumina's reconstructed Day-0 institutional history."
      toolbar={
        approval
          ? (
              <StatusBadge
                state={
                  approval.state
                }
              />
            )
          : undefined
      }
    >
      <div className="space-y-5 p-5">
        {error && (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Certification action failed
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
                Clear
              </LuminaButton>
            </div>
          </div>
        )}

        {approval && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Repository history"
                value={
                  approval.summary
                    .repositorySources ===
                  null
                    ? "—"
                    : `${approval.summary.repositorySourcesCompleted ?? 0}/${approval.summary.repositorySources}`
                }
                detail="Repository-native source coverage"
              />

              <Metric
                label="Conversations"
                value={`${approval.summary.acquiredExpectedConversations}/${approval.summary.expectedRecoverableConversations}`}
                detail="Expected recoverable conversations acquired"
              />

              <Metric
                label="Conversation events"
                value={String(
                  approval.summary
                    .correlatedConversationEvents,
                )}
                detail={`${approval.summary.correlatedConversationSources} correlated conversation sources`}
              />

              <Metric
                label="Exceptions"
                value={String(
                  approval.summary
                    .unresolvedExceptions,
                )}
                detail={`${approval.summary.historicallyUnavailableConversations} certified historical gap${approval.summary.historicallyUnavailableConversations === 1 ? "" : "s"}`}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <LuminaFlagshipCard
                as="article"
                className="p-5"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-300" />

                    <div className="text-sm font-semibold">
                      Remediation exceptions
                    </div>
                  </div>

                  {exceptionGroups.length ===
                  0 ? (
                    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        No unresolved exceptions
                      </div>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Automated acquisition, replay, correlation, explicit-link resolution, and lineage checks have no unresolved certification exceptions.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {exceptionGroups.map(
                        (
                          item,
                          index,
                        ) => (
                          <div
                            key={`${item.category}:${item.code}:${item.subjectId ?? ""}:${item.relatedId ?? ""}:${index}`}
                            className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-4"
                          >
                            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">
                              {item.category.replaceAll(
                                "-",
                                " ",
                              )}
                            </div>

                            <div className="mt-2 font-mono text-xs text-foreground">
                              {item.code}
                            </div>

                            {item.subjectId && (
                              <div className="mt-2 break-all text-xs text-muted-foreground">
                                Subject:{" "}
                                {item.subjectId}
                              </div>
                            )}

                            {item.relatedId && (
                              <div className="mt-1 break-all text-xs text-muted-foreground">
                                Related:{" "}
                                {item.relatedId}
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {exceptionGroups.length >
                    0 && (
                    <div className="mt-4">
                      <LuminaButton
                        variant="warning"
                        onClick={
                          scrollToReconstruction
                        }
                      >
                        <RotateCcw className="h-4 w-4" />
                        Return for remediation
                      </LuminaButton>
                    </div>
                  )}
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard
                as="article"
                className="p-5"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-cyan-300" />

                    <div className="text-sm font-semibold">
                      Known historical gaps
                    </div>
                  </div>

                  {gaps.length ===
                  0 ? (
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">
                      No conversation records are currently certified as historically unavailable.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {gaps.map(
                        conversationId => (
                          <div
                            key={
                              conversationId
                            }
                            className="break-all rounded-xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] px-3 py-2 font-mono text-xs text-muted-foreground"
                          >
                            {conversationId}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </LuminaFlagshipCard>
            </div>

            <LuminaFlagshipCard
              as="article"
              className="p-5"
            >
              <div className="relative z-10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-300" />

                      <div className="text-sm font-semibold">
                        Human certification
                      </div>
                    </div>

                    <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
                      This is one corpus-level decision. Individual conversations and messages do not require separate approval.
                    </p>
                  </div>

                  <LuminaButton
                    variant="ghost"
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

                {approval.state ===
                  "CERTIFIED" &&
                projection.certification ? (
                  <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Day-0 Genesis certified
                    </div>

                    <div className="mt-3 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                      <div>
                        <div className="uppercase tracking-[0.1em]">
                          Certified by
                        </div>

                        <div className="mt-1 break-all font-mono text-foreground">
                          {
                            projection
                              .certification
                              .certifiedBy
                          }
                        </div>
                      </div>

                      <div>
                        <div className="uppercase tracking-[0.1em]">
                          Certified at
                        </div>

                        <div className="mt-1 text-foreground">
                          {new Date(
                            projection
                              .certification
                              .certifiedAt,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs leading-5 text-muted-foreground">
                      {
                        projection
                          .certification
                          .reason
                      }
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {!currentUser && (
                      <div className="rounded-xl border border-red-400/20 bg-red-500/[0.05] p-3 text-xs text-red-200">
                        An authenticated human operator is required to certify Day-0 Genesis.
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="genesis-day-zero-certification-reason"
                        className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        Certification reason
                      </label>

                      <textarea
                        id="genesis-day-zero-certification-reason"
                        value={
                          reason
                        }
                        disabled={
                          !approval
                            .approval
                            .available ||
                          submitting
                        }
                        onChange={
                          event => {
                            setReason(
                              event.target
                                .value,
                            );
                          }
                        }
                        placeholder="Record the basis for accepting the reconstructed Day-0 corpus."
                        className={[
                          "mt-2 min-h-[112px] w-full resize-y rounded-2xl border px-4 py-3",
                          "text-sm leading-6 text-foreground outline-none",
                          "[border-color:var(--lumina-border-standard)]",
                          "[background:var(--lumina-surface-compact)]",
                          "focus:[border-color:var(--lumina-border-emphasis)]",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        ].join(
                          " ",
                        )}
                      />
                    </div>

                    {requiresGapAcknowledgement && (
                      <label className="flex items-start gap-3 rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-4">
                        <input
                          type="checkbox"
                          checked={
                            gapsAcknowledged
                          }
                          disabled={
                            !approval
                              .approval
                              .available ||
                            submitting
                          }
                          onChange={
                            event => {
                              setGapsAcknowledged(
                                event.target
                                  .checked,
                              );
                            }
                          }
                          className="mt-0.5 h-4 w-4"
                        />

                        <span className="text-xs leading-5 text-muted-foreground">
                          I acknowledge the{" "}
                          <strong className="font-semibold text-foreground">
                            {gaps.length}
                          </strong>{" "}
                          conversation record{
                            gaps.length ===
                              1
                              ? ""
                              : "s"
                          } certified as historically unavailable. These gaps will remain visible in Genesis and will not be fabricated or reconstructed from substitute sources.
                        </span>
                      </label>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs leading-5 text-muted-foreground">
                        {
                          approval
                            .approval
                            .reason
                        }
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <LuminaButton
                          variant="outline"
                          disabled={
                            submitting
                          }
                          onClick={
                            scrollToReconstruction
                          }
                        >
                          <RotateCcw className="h-4 w-4" />
                          Return for remediation
                        </LuminaButton>

                        <LuminaButton
                          variant="success"
                          disabled={
                            !canCertify
                          }
                          onClick={() => {
                            if (
                              !currentUser
                            ) {
                              return;
                            }

                            void certify({
                              certifiedBy:
                                currentUser.id,

                              reason:
                                reason.trim(),

                              acknowledgedHistoricallyUnavailableConversationIds:
                                gaps,
                            }).then(
                              success => {
                                if (
                                  success
                                ) {
                                  setReason(
                                    "",
                                  );

                                  setGapsAcknowledged(
                                    false,
                                  );
                                }
                              },
                            );
                          }}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          {submitting
                            ? "Certifying…"
                            : "Certify Day-0 Genesis"}
                        </LuminaButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </LuminaFlagshipCard>

            <div className="break-all font-mono text-[10px] leading-4 text-muted-foreground">
              Certification projection:{" "}
              {approval.projectionId}
            </div>
          </>
        )}
      </div>
    </LuminaFlagshipPanel>
  );
}


export default GenesisDayZeroCertificationPanel;
