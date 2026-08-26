import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  BookCheck,
  CheckCircle2,
  RefreshCw,
  Save,
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
  useEducationalCorpusCertification,
} from "@/hooks/useEducationalCorpusCertification";

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
      className="p-4"
    >
      <div className="relative z-10">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/72">
          {label}
        </div>

        <div className="mt-2 text-xl font-semibold text-amber-400">
          {value}
        </div>

        <div className="mt-1 text-xs leading-5 text-sky-300/58">
          {detail}
        </div>
      </div>
    </LuminaFlagshipCard>
  );
}


function Badge({
  state,
}: {
  state:
    string;
}) {
  const tone =
    state ===
      "VALID" ||
    state ===
      "READY"
      ? "border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-200"
      : state ===
          "BLOCKED"
        ? "border-red-400/30 bg-red-500/[0.08] text-red-200"
        : "border-amber-400/30 bg-amber-500/[0.08] text-amber-200";

  return (
    <span
      className={[
        "rounded-full border px-3 py-1",
        "text-[10px] font-semibold uppercase tracking-[0.12em]",
        tone,
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


export function EducationalCorpusCertificationPanel() {
  const {
    corpus,
    certification,
    loading,
    busy,
    error,
    refresh,
    persist,
    certify,
    clearError,
  } =
    useEducationalCorpusCertification();

  const [
    reason,
    setReason,
  ] =
    useState(
      "",
    );

  const [
    exclusionsAcknowledged,
    setExclusionsAcknowledged,
  ] =
    useState(
      false,
    );

  const currentUser =
    auth.getUser();

  const candidate =
    certification
      ?.candidate ??
    corpus
      ?.certificationCandidate ??
    null;

  const excludedIds =
    useMemo(
      () =>
        candidate
          ?.excludedMaterial
          .filter(
            item =>
              item.decision ===
              "EXCLUDED",
          )
          .map(
            item =>
              item.artifactId,
          ) ??
        [],
      [
        candidate,
      ],
    );

  const requiresExclusionAcknowledgement =
    excludedIds.length >
    0;

  const canCertify =
    Boolean(
      candidate
        ?.approval.available &&
      certification?.state !==
        "VALID" &&
      currentUser?.id &&
      reason.trim()
        .length >
        0 &&
      (
        !requiresExclusionAcknowledgement ||
        exclusionsAcknowledged
      ) &&
      !busy,
    );

  const corpusNeedsPersist =
    Boolean(
      corpus &&
      (
        corpus.state ===
          "UNSET" ||
        corpus.state ===
          "STALE"
      ),
    );


  return (
    <LuminaFlagshipPanel
      title="Educational Corpus Certification"
      description="Authoritative corpus preparation, exception review, constitutional coverage, and one human certification decision."
      emphasis="strong"
      toolbar={
        <div className="flex items-center gap-2">
          {corpus && (
            <Badge
              state={
                corpus.state
              }
            />
          )}

          {certification && (
            <Badge
              state={
                certification.state
              }
            />
          )}
        </div>
      }
    >
      <div className="space-y-5 p-5">
        {error && (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Educational Corpus operation failed
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

        {loading &&
        !corpus ? (
          <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Reading Educational Corpus authority…
          </div>
        ) : null}

        {corpus && (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Corpus state"
                value={
                  corpus.state
                }
                detail="Persisted corpus compared with current authority"
              />

              <Metric
                label="Curriculum"
                value={String(
                  candidate
                    ?.summary.curriculumItems ??
                  corpus
                    .currentCorpus
                    ?.summary
                    .curriculumItems ??
                  0,
                )}
                detail="Governed curriculum items"
              />

              <Metric
                label="Constitutional"
                value={
                  candidate
                    ? `${candidate.coverage.constitutionalLiteracy.completion}%`
                    : "—"
                }
                detail="Required constitutional curriculum coverage"
              />

              <Metric
                label="Exceptions"
                value={String(
                  candidate
                    ?.summary.exceptions ??
                  0,
                )}
                detail={`${candidate?.summary.excludedItems ?? 0} visible exclusions`}
              />
            </div>

            {corpusNeedsPersist && (
              <LuminaFlagshipCard
                as="article"
                className="p-5"
              >
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                      <Save className="h-4 w-4" />
                      Persist current Educational Corpus
                    </div>

                    <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
                      Runtime has assembled the current governed corpus, but certification requires that exact corpus identity to be persisted first.
                    </p>
                  </div>

                  <LuminaButton
                    variant="warning"
                    disabled={
                      busy ||
                      corpus.state ===
                        "BLOCKED" ||
                      corpus.state ===
                        "INCOMPLETE"
                    }
                    onClick={() => {
                      void persist();
                    }}
                  >
                    <Save className="h-4 w-4" />
                    {busy
                      ? "Persisting…"
                      : "Persist Current Corpus"}
                  </LuminaButton>
                </div>
              </LuminaFlagshipCard>
            )}

            {candidate && (
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <LuminaFlagshipCard
                  as="article"
                  className="p-5"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <AlertTriangle className="h-4 w-4 text-amber-300" />
                        Certification exceptions
                      </div>

                      <Badge
                        state={
                          candidate.state
                        }
                      />
                    </div>

                    {candidate.exceptions.length ===
                    0 ? (
                      <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                          <CheckCircle2 className="h-4 w-4" />
                          No unresolved certification exceptions
                        </div>
                      </div>
                    ) : (
                      <div
                        className="
                          mt-4 max-h-[300px] space-y-3
                          overflow-y-auto overscroll-contain pr-1
                          [scrollbar-gutter:stable]
                          [touch-action:pan-y]
                        "
                      >
                        {candidate.exceptions.map(
                          (
                            item,
                            index,
                          ) => (
                            <div
                              key={`${item.category}:${item.code}:${item.subjectId ?? ""}:${index}`}
                              className="rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-3"
                            >
                              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                                {item.category.replaceAll(
                                  "-",
                                  " ",
                                )}
                              </div>

                              <div className="mt-1 font-mono text-xs text-foreground">
                                {item.code}
                              </div>

                              {item.subjectId && (
                                <div className="mt-1 break-all text-xs text-muted-foreground">
                                  {item.subjectId}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </LuminaFlagshipCard>

                <LuminaFlagshipCard
                  as="article"
                  className="p-5"
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <BookCheck className="h-4 w-4 text-cyan-300" />
                      Excluded material
                    </div>

                    {candidate.excludedMaterial.length ===
                    0 ? (
                      <p className="mt-4 text-xs leading-5 text-muted-foreground">
                        No material is excluded from this Educational Corpus.
                      </p>
                    ) : (
                      <div className="mt-4 max-h-[300px] space-y-2 overflow-y-auto">
                        {candidate.excludedMaterial.map(
                          item => (
                            <div
                              key={`${item.decision}:${item.artifactId}`}
                              className="rounded-xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-3"
                            >
                              <div className="break-all font-mono text-xs text-foreground">
                                {item.artifactId}
                              </div>

                              <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                                {item.decision.replaceAll(
                                  "_",
                                  " ",
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </LuminaFlagshipCard>
              </div>
            )}

            <LuminaFlagshipCard
              as="article"
              className="p-5"
            >
              <div className="relative z-10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <ShieldCheck className="h-4 w-4 text-cyan-300" />
                      Human Educational Corpus certification
                    </div>

                    <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
                      This is one corpus-level certification decision. It does not certify Chief Agent competency and does not authorize activation.
                    </p>
                  </div>

                  <LuminaButton
                    variant="ghost"
                    size="sm"
                    disabled={
                      loading ||
                      busy
                    }
                    onClick={() => {
                      void refresh();
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </LuminaButton>
                </div>

                {certification?.state ===
                  "VALID" &&
                certification.certification ? (
                  <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Educational Corpus certified
                    </div>

                    <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <div className="uppercase tracking-[0.1em] text-muted-foreground">
                          Certified by
                        </div>

                        <div className="mt-1 break-all font-mono text-foreground">
                          {certification.certification.certifiedBy}
                        </div>
                      </div>

                      <div>
                        <div className="uppercase tracking-[0.1em] text-muted-foreground">
                          Certified at
                        </div>

                        <div className="mt-1 text-foreground">
                          {new Date(
                            certification.certification.certifiedAt,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-muted-foreground">
                      {certification.certification.reason}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label
                        htmlFor="educational-corpus-certification-reason"
                        className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        Certification reason
                      </label>

                      <textarea
                        id="educational-corpus-certification-reason"
                        value={
                          reason
                        }
                        disabled={
                          !candidate
                            ?.approval.available ||
                          busy
                        }
                        onChange={
                          event => {
                            setReason(
                              event.target.value,
                            );
                          }
                        }
                        placeholder="Record the basis for accepting this Educational Corpus."
                        className={[
                          "mt-2 min-h-[110px] w-full resize-y rounded-2xl border px-4 py-3",
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

                    {requiresExclusionAcknowledgement && (
                      <label className="flex items-start gap-3 rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-4">
                        <input
                          type="checkbox"
                          checked={
                            exclusionsAcknowledged
                          }
                          disabled={
                            !candidate
                              ?.approval.available ||
                            busy
                          }
                          onChange={
                            event => {
                              setExclusionsAcknowledged(
                                event.target.checked,
                              );
                            }
                          }
                          className="mt-0.5 h-4 w-4"
                        />

                        <span className="text-xs leading-5 text-muted-foreground">
                          I acknowledge the{" "}
                          <strong className="text-foreground">
                            {excludedIds.length}
                          </strong>{" "}
                          explicitly excluded artifact{
                            excludedIds.length ===
                              1
                              ? ""
                              : "s"
                          }. Exclusion does not erase the underlying historical record.
                        </span>
                      </label>
                    )}

                    {!currentUser && (
                      <div className="rounded-xl border border-red-400/20 bg-red-500/[0.05] p-3 text-xs text-red-200">
                        An authenticated human operator is required to certify the Educational Corpus.
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs leading-5 text-muted-foreground">
                        {candidate
                          ?.approval.reason ??
                          "Educational Corpus certification is not currently available."}
                      </div>

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

                            acknowledgedExcludedArtifactIds:
                              excludedIds,
                          }).then(
                            success => {
                              if (
                                success
                              ) {
                                setReason(
                                  "",
                                );

                                setExclusionsAcknowledged(
                                  false,
                                );
                              }
                            },
                          );
                        }}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {busy
                          ? "Certifying…"
                          : "Certify Educational Corpus"}
                      </LuminaButton>
                    </div>
                  </div>
                )}
              </div>
            </LuminaFlagshipCard>
          </>
        )}
      </div>
    </LuminaFlagshipPanel>
  );
}


export default EducationalCorpusCertificationPanel;
