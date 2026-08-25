import {
  useState,
} from "react";

import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  RefreshCw,
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
  useGenesisConversationAuthoritativeCompletenessCertification,
} from "@/hooks/useGenesisConversationAuthoritativeCompletenessCertification";

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
      "VALID"
      ? "border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-200"
      : state ===
          "UNSET"
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


export function GenesisConversationAuthoritativeCompletenessCertificationPanel() {
  const {
    projection,
    loading,
    submitting,
    error,
    refresh,
    certify,
    clearError,
  } =
    useGenesisConversationAuthoritativeCompletenessCertification();

  const [
    reason,
    setReason,
  ] =
    useState(
      "",
    );

  const currentUser =
    auth.getUser();

  const canCertify =
    Boolean(
      projection
        ?.certificationAvailable &&
      projection
        .evidence
        .state ===
          "READY_FOR_REVIEW" &&
      currentUser?.id &&
      reason.trim()
        .length >
        0 &&
      !submitting,
    );


  if (
    loading &&
    !projection
  ) {
    return (
      <LuminaFlagshipPanel
        title="Authoritative Completeness Certification"
        description="Reading the governed completeness-evidence certification projection."
      >
        <div className="flex min-h-[320px] items-center justify-center gap-3 px-6 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Reading completeness certification…
        </div>
      </LuminaFlagshipPanel>
    );
  }


  if (
    !projection
  ) {
    return (
      <LuminaFlagshipPanel
        title="Authoritative Completeness Certification"
        description="The authoritative completeness certification projection is unavailable."
      >
        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Certification projection unavailable
            </div>

            <div className="mt-2 break-all font-mono text-xs text-red-200/80">
              {error ??
                "genesis_conversation_authoritative_completeness_certification_unavailable"}
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


  const {
    evidence,
    certification,
    validation,
  } =
    projection;


  return (
    <LuminaFlagshipPanel
      title="Authoritative Completeness Certification"
      description="Human certification of the governed completeness evidence package. This does not create authoritative expected history and does not certify Day-0."
      toolbar={
        <div className="flex items-center gap-3">
          <StatusBadge
            state={
              projection.state
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
            label="Evidence State"
            value={
              evidence.state.replaceAll(
                "_",
                " ",
              )
            }
            detail="Current governed evidence package"
          />

          <Metric
            label="Candidate Conversations"
            value={
              String(
                evidence.candidateConversationCount,
              )
            }
            detail="Attested candidate corpus"
          />

          <Metric
            label="Acquired Conversations"
            value={
              String(
                evidence.acquiredConversationCount,
              )
            }
            detail="Current acquired corpus"
          />

          <Metric
            label="Projects"
            value={
              String(
                evidence.projectCount,
              )
            }
            detail="Attested ChatGPT project groups"
          />

          <Metric
            label="Evidence Records"
            value={
              String(
                evidence.evidenceCount,
              )
            }
            detail="Governed acquisition evidence"
          />

          <Metric
            label="Known Omissions"
            value={
              String(
                evidence.knownOmissionCount,
              )
            }
            detail="Declared candidate omissions"
          />

          <Metric
            label="Expected History"
            value={
              projection.authoritativeExpectedHistoryCreated
                ? "Created"
                : "Not Created"
            }
            detail="Separate downstream authority step"
          />

          <Metric
            label="Day-0 Coverage"
            value={
              projection.dayZeroConversationCoverageCertified
                ? "Certified"
                : "Not Certified"
            }
            detail="Separate downstream certification gate"
          />
        </div>

        <div className="rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

            <div>
              <div className="text-sm font-semibold text-foreground">
                Completeness evidence boundary
              </div>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                Certification records a human judgment that the current
                evidence package is sufficient for the next governed
                authority step. It does not itself create authoritative
                expected history, certify Day-0 coverage, or enable promotion.
              </p>
            </div>
          </div>
        </div>

        {evidence.blockers.length >
          0 && (
          <div className="rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300/72">
              Evidence blockers
            </div>

            <div className="mt-3 space-y-2">
              {evidence.blockers.map(
                blocker => (
                  <div
                    key={
                      blocker
                    }
                    className="font-mono text-xs text-muted-foreground"
                  >
                    {blocker}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {projection.state ===
          "UNSET" &&
        projection.certificationAvailable ? (
          <div className="space-y-5 rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-interactive)] p-5">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Human completeness certification
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The evidence package is ready for a single governed
                certification. A reason and stable signed-in operator identity
                are required.
              </p>
            </div>

            <div>
              <label
                htmlFor="genesis-authoritative-completeness-certification-reason"
                className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300/72"
              >
                Certification reason
              </label>

              <textarea
                id="genesis-authoritative-completeness-certification-reason"
                rows={4}
                className={[
                  "mt-3 w-full rounded-xl border px-3 py-2.5 text-sm text-foreground outline-none transition",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-compact)]",
                  "placeholder:text-muted-foreground/60",
                  "focus:[border-color:var(--lumina-border-emphasis)]",
                ].join(
                  " ",
                )}
                placeholder="Required governance rationale"
                value={
                  reason
                }
                onChange={
                  event => {
                    setReason(
                      event.target.value,
                    );
                  }
                }
              />
            </div>

            {!currentUser?.id && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4 text-sm text-amber-100">
                A stable signed-in operator identity is required before
                completeness evidence can be certified.
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  Certification failed
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
                  !canCertify
                }
                onClick={() => {
                  if (
                    !currentUser?.id
                  ) {
                    return;
                  }

                  void certify({
                    certifiedBy:
                      currentUser.id,

                    reason:
                      reason.trim(),
                  });
                }}
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
                Certify completeness evidence
              </LuminaButton>
            </div>
          </div>
        ) : certification ? (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-100">
                  Completeness evidence certified
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The certification remains governed by current-candidate
                  validation. Authoritative expected history has not been
                  created and Day-0 remains uncertified.
                </p>

                <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                  <div>
                    Certified by:{" "}
                    <span className="font-mono text-foreground/80">
                      {certification.certifiedBy}
                    </span>
                  </div>

                  <div>
                    Certified at:{" "}
                    {new Date(
                      certification.certifiedAt,
                    ).toLocaleString()}
                  </div>

                  <div>
                    Validation:{" "}
                    {validation?.state ??
                      "UNKNOWN"}
                  </div>

                  <div className="break-all">
                    Certification ID:{" "}
                    <span className="font-mono text-foreground/80">
                      {certification.certificationId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

              <div>
                <div className="text-sm font-semibold text-amber-100">
                  Certification unavailable
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The current completeness evidence package does not satisfy
                  the Runtime certification gate.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LuminaFlagshipPanel>
  );
}


export default GenesisConversationAuthoritativeCompletenessCertificationPanel;
