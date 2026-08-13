import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

import {
  getExecutiveOperations,
  type ExecutiveOperationsSnapshot,
  type ExecutiveReasoningDisposition,
} from "@/services/executiveOperationsService";

function dispositionClass(
  disposition:
    ExecutiveReasoningDisposition,
) {
  if (
    disposition ===
    "authorize"
  ) {
    return "border-emerald-400/20 bg-emerald-400/5 text-emerald-200";
  }

  if (
    disposition ===
    "deny"
  ) {
    return "border-rose-400/20 bg-rose-400/5 text-rose-200";
  }

  return "border-amber-400/20 bg-amber-400/5 text-amber-200";
}

function statusClass(
  enabled:
    boolean,
) {
  return enabled
    ? "border-amber-400/20 bg-amber-400/5 text-amber-200"
    : "border-emerald-400/20 bg-emerald-400/5 text-emerald-200";
}

export function ChiefAgentWorkspace() {
  const [
    snapshot,
    setSnapshot,
  ] =
    useState<
      ExecutiveOperationsSnapshot |
      null
    >(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null,
    );

  const refresh =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const next =
            await getExecutiveOperations();

          setSnapshot(
            next,
          );
        } catch (
          nextError
        ) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "failed_to_get_executive_operations",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      void refresh();
    },
    [
      refresh,
    ],
  );

  const latestReasoning =
    snapshot
      ?.reasoning[0] ??
    null;

  const recentActivity =
    useMemo(
      () =>
        [
          ...(
            snapshot
              ?.reasoning
              .slice(
                0,
                3,
              )
              .map(
                (item) => ({
                  id:
                    item.id,

                  type:
                    "Reasoning",

                  title:
                    item.title,

                  detail:
                    item.conclusion,

                  timestamp:
                    item.updatedAt,
                }),
              ) ??
            []
          ),

          ...(
            snapshot
              ?.actions
              .slice(
                0,
                3,
              )
              .map(
                (item) => ({
                  id:
                    item.id,

                  type:
                    "Action",

                  title:
                    item.title,

                  detail:
                    item.description,

                  timestamp:
                    item.updatedAt,
                }),
              ) ??
            []
          ),

          ...(
            snapshot
              ?.audits
              .slice(
                0,
                3,
              )
              .map(
                (item) => ({
                  id:
                    item.id,

                  type:
                    "Audit",

                  title:
                    item.title,

                  detail:
                    item.description,

                  timestamp:
                    item.updatedAt,
                }),
              ) ??
            []
          ),
        ]
          .sort(
            (
              left,
              right,
            ) =>
              right.timestamp -
              left.timestamp,
          )
          .slice(
            0,
            6,
          ),
      [
        snapshot,
      ],
    );

  return (
    <LuminaWorkspacePanel className="min-h-[640px] p-0">
      <header
        className={[
          "flex flex-col gap-5 border-b px-6 py-6",
          "lg:flex-row lg:items-center lg:justify-between",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-compact)]",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
              "[border-color:var(--lumina-border-emphasis)]",
              "[background:var(--lumina-surface-selected)]",
              "[box-shadow:var(--lumina-shadow-selected)]",
            ].join(" ")}
          >
            <Sparkles
              className="h-5 w-5 text-cyan"
              strokeWidth={1.75}
            />
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan">
              Organizational intelligence
            </div>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Chief Agent
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Live governed reasoning, decisions, approvals,
              execution state, and audit posture from Lumina Runtime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-2",
              "text-[10px] font-semibold uppercase tracking-[0.16em]",
              snapshot
                ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"
                : "border-amber-400/20 bg-amber-400/5 text-amber-200",
            ].join(" ")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {snapshot
              ? "Runtime connected"
              : "Runtime unavailable"}
          </div>

          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            disabled={loading}
            className={[
              "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
              "[border-color:var(--lumina-border-standard)]",
              "[background:var(--lumina-surface-interactive)]",
              "transition hover:[background:var(--lumina-surface-selected)]",
              "disabled:cursor-wait disabled:opacity-60",
            ].join(" ")}
            aria-label="Refresh Chief Agent state"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                loading
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
          </button>
        </div>
      </header>

      <div className="space-y-5 p-6">
        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            [
              "Reasoning",
              snapshot?.summary.reasoning ?? 0,
            ],
            [
              "Decisions",
              snapshot?.summary.decisions ?? 0,
            ],
            [
              "Pending approvals",
              snapshot?.summary.pendingApprovals ?? 0,
            ],
            [
              "Delegations",
              snapshot?.summary.delegations ?? 0,
            ],
            [
              "Actions",
              snapshot?.summary.actions ?? 0,
            ],
            [
              "Open audits",
              snapshot?.summary.openAudits ?? 0,
            ],
          ].map(
            (
              [
                label,
                value,
              ],
            ) => (
              <div
                key={label}
                className={[
                  "rounded-2xl border px-4 py-4",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                ].join(" ")}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </div>

                <div className="mt-2 text-2xl font-semibold tracking-tight">
                  {value}
                </div>
              </div>
            ),
          )}
        </section>

        {error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">
            <AlertTriangle className="h-4 w-4" />

            {error}
          </div>
        ) : null}

        <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section
            className={[
              "min-h-[430px] overflow-hidden rounded-[28px] border",
              "[border-color:var(--lumina-border-standard)]",
              "[background:var(--lumina-surface-panel)]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between border-b px-5 py-4 [border-color:var(--lumina-border-standard)]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Live operations
                </div>

                <h3 className="mt-1 text-lg font-semibold">
                  Executive activity
                </h3>
              </div>

              <BrainCircuit className="h-5 w-5 text-cyan" />
            </div>

            <div className="space-y-2 p-4">
              {recentActivity.length ===
              0 ? (
                <div className="flex min-h-[320px] items-center justify-center text-center">
                  <div className="max-w-sm">
                    <BrainCircuit className="mx-auto h-7 w-7 text-cyan" />

                    <div className="mt-4 text-sm font-medium">
                      No Executive activity yet
                    </div>

                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      The workspace is connected to the authoritative
                      runtime and will populate from real Chief Agent
                      operations.
                    </p>
                  </div>
                </div>
              ) : (
                recentActivity.map(
                  (
                    item,
                  ) => (
                    <article
                      key={`${item.type}:${item.id}`}
                      className={[
                        "rounded-2xl border px-4 py-4",
                        "[border-color:var(--lumina-border-standard)]",
                        "[background:var(--lumina-surface-interactive)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan">
                            {item.type}
                          </div>

                          <h4 className="mt-1 truncate text-sm font-semibold">
                            {item.title}
                          </h4>

                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {item.detail}
                          </p>
                        </div>

                        <CircleDot className="mt-1 h-3.5 w-3.5 shrink-0 text-cyan" />
                      </div>
                    </article>
                  ),
                )
              )}
            </div>
          </section>

          <aside
            className={[
              "flex flex-col rounded-[28px] border",
              "[border-color:var(--lumina-border-standard)]",
              "[background:var(--lumina-surface-compact)]",
            ].join(" ")}
          >
            <div className="border-b px-5 py-5 [border-color:var(--lumina-border-standard)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Governance posture
              </div>

              <h3 className="mt-2 text-lg font-semibold">
                Current authority
              </h3>
            </div>

            <div className="flex-1 space-y-3 p-4">
              <div
                className={[
                  "rounded-2xl border p-4",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Mutation gate
                  </span>
                </div>

                <div
                  className={[
                    "mt-3 inline-flex rounded-full border px-2.5 py-1",
                    "text-[10px] font-semibold uppercase tracking-[0.12em]",
                    statusClass(
                      snapshot?.mutationEnabled ??
                      false,
                    ),
                  ].join(" ")}
                >
                  {snapshot?.mutationEnabled
                    ? "Enabled"
                    : "Disabled"}
                </div>
              </div>

              <div
                className={[
                  "rounded-2xl border p-4",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-cyan" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Latest reasoning
                  </span>
                </div>

                {latestReasoning ? (
                  <>
                    <div
                      className={[
                        "mt-3 inline-flex rounded-full border px-2.5 py-1",
                        "text-[10px] font-semibold uppercase tracking-[0.12em]",
                        dispositionClass(
                          latestReasoning.disposition,
                        ),
                      ].join(" ")}
                    >
                      {latestReasoning.disposition}
                    </div>

                    <div className="mt-3 text-sm font-semibold">
                      {latestReasoning.title}
                    </div>

                    <p className="mt-2 line-clamp-4 text-xs leading-5 text-muted-foreground">
                      {latestReasoning.conclusion}
                    </p>

                    <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Confidence{" "}
                      {Math.round(
                        latestReasoning.confidence *
                        100,
                      )}
                      %
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    No persisted Chief Agent reasoning is currently
                    available in this runtime process.
                  </p>
                )}
              </div>
            </div>

            <footer className="border-t px-5 py-4 [border-color:var(--lumina-border-standard)]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Integration
                </span>

                <span className="text-[11px] font-medium text-emerald-200">
                  Runtime live
                </span>
              </div>
            </footer>
          </aside>
        </div>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default ChiefAgentWorkspace;
