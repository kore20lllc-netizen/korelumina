import {
  AlertTriangle,
  CheckCircle2,
  Database,
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
  useGenesisConversationAuthoritativeExpectedHistory,
} from "@/hooks/useGenesisConversationAuthoritativeExpectedHistory";


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


export function GenesisConversationAuthoritativeExpectedHistoryPanel() {
  const {
    expectedHistory,
    certification,
    loading,
    submitting,
    error,
    refresh,
    create,
    clearError,
  } =
    useGenesisConversationAuthoritativeExpectedHistory();


  if (
    loading &&
    !expectedHistory
  ) {
    return (
      <LuminaFlagshipPanel
        title="Authoritative Expected History"
        description="Reading governed expected-history and completeness certification state."
      >
        <div className="flex min-h-[320px] items-center justify-center gap-3 px-6 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Reading authoritative history state…
        </div>
      </LuminaFlagshipPanel>
    );
  }


  if (
    !expectedHistory ||
    !certification
  ) {
    return (
      <LuminaFlagshipPanel
        title="Authoritative Expected History"
        description="The governed expected-history creation projection is unavailable."
      >
        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Expected-history projection unavailable
            </div>

            <div className="mt-2 break-all font-mono text-xs text-red-200/80">
              {error ??
                "genesis_conversation_authoritative_expected_history_unavailable"}
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


  const inventory =
    expectedHistory.expectedHistory;

  const reconciliation =
    expectedHistory.reconciliation;

  const creationAvailable =
    certification.state ===
      "VALID" &&
    certification.authoritativeExpectedHistoryCreationAvailable &&
    inventory ===
      null;


  return (
    <LuminaFlagshipPanel
      title="Authoritative Expected History"
      description="Governed creation of authoritative expected conversation history from the valid completeness certification. Runtime derives all authority and corpus fields."
      toolbar={
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
      }
    >
      <div className="relative z-10 space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Completeness Certification"
            value={
              certification.state
            }
            detail="Required upstream authority gate"
          />

          <Metric
            label="Expected History"
            value={
              inventory
                ? "Created"
                : "Not Created"
            }
            detail="Authoritative conversation inventory"
          />

          <Metric
            label="Conversations"
            value={
              inventory
                ? String(
                    inventory.conversations.length,
                  )
                : String(
                    certification.evidence.candidateConversationCount,
                  )
            }
            detail="Governed corpus size"
          />

          <Metric
            label="Reconciliation"
            value={
              reconciliation
                ?.state ??
              "Not Assembled"
            }
            detail="Expected versus acquired corpus"
          />

          <Metric
            label="Not Yet Acquired"
            value={
              String(
                reconciliation
                  ?.notYetAcquiredConversationIds
                  .length ??
                0,
              )
            }
            detail="Expected recoverable gaps"
          />

          <Metric
            label="Unexpected Acquired"
            value={
              String(
                reconciliation
                  ?.unexpectedAcquiredConversationIds
                  .length ??
                0,
              )
            }
            detail="Acquired records outside authority"
          />

          <Metric
            label="Day-0 Coverage"
            value={
              reconciliation
                ?.dayZeroConversationCoverageCertified
                ? "Certified"
                : "Not Certified"
            }
            detail="Separate downstream governance gate"
          />

          <Metric
            label="Creation"
            value={
              creationAvailable
                ? "Available"
                : inventory
                  ? "Complete"
                  : "Unavailable"
            }
            detail="Runtime-governed authority creation"
          />
        </div>

        <div className="rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

            <div>
              <div className="text-sm font-semibold text-foreground">
                Authority boundary
              </div>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                This action creates the authoritative expected-history
                inventory from the already-certified completeness evidence.
                The Builder supplies no authority metadata and no conversation
                records. Runtime derives both from governed state.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Expected-history action failed
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

        {creationAvailable ? (
          <div className="space-y-5 rounded-2xl border [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-interactive)] p-5">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Create authoritative expected history
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The completeness certification is valid and Runtime reports
                authority creation as available. Creating the inventory will
                assemble reconciliation, but will not certify Day-0.
              </p>
            </div>

            <div className="flex justify-end border-t [border-color:var(--lumina-border-standard)] pt-5">
              <LuminaButton
                variant="toolbar"
                disabled={
                  submitting
                }
                onClick={() => {
                  void create();
                }}
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                Create authoritative expected history
              </LuminaButton>
            </div>
          </div>
        ) : inventory ? (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-100">
                  Authoritative expected history created
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Runtime created the authoritative conversation inventory from
                  certified completeness evidence. Day-0 coverage remains a
                  separate certification step.
                </p>

                <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                  <div className="break-all">
                    Inventory ID:{" "}
                    <span className="font-mono text-foreground/80">
                      {inventory.inventoryId}
                    </span>
                  </div>

                  <div className="break-all">
                    Authority ID:{" "}
                    <span className="font-mono text-foreground/80">
                      {inventory.authority.authorityId}
                    </span>
                  </div>

                  <div>
                    Authority version:{" "}
                    <span className="font-mono text-foreground/80">
                      {inventory.authority.version}
                    </span>
                  </div>

                  <div>
                    Reconciliation:{" "}
                    {reconciliation?.state ??
                      "NOT ASSEMBLED"}
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
                  Authority creation unavailable
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Runtime has not opened the authoritative expected-history
                  creation gate for the current certification state.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LuminaFlagshipPanel>
  );
}


export default GenesisConversationAuthoritativeExpectedHistoryPanel;
