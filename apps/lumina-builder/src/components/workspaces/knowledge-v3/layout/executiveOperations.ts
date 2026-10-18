import type {
  Checked,
  KnowledgeOperationsTruth,
} from "./useKnowledgeOperationsTruth";

export type ExecutiveOperationState =
  | "healthy"
  | "active"
  | "warning"
  | "error";

export type ExecutiveOperationIcon =
  | "runtime"
  | "compiler"
  | "repository"
  | "intelligence"
  | "knowledge";

export interface ExecutiveOperation {
  id: string;
  label: string;
  status: string;
  detail: string;
  state: ExecutiveOperationState;
  icon: ExecutiveOperationIcon;
}

/*
 * UI-1: every heartbeat row is derived from a real Runtime check. A check
 * still running shows "Checking"; a failed check shows the failure.
 */

const checking = (
  id: string,
  label: string,
  icon: ExecutiveOperationIcon,
): ExecutiveOperation => ({
  id,
  label,
  status: "Checking",
  detail: "Waiting for the Runtime to answer",
  state: "active",
  icon,
});

const failed = (
  id: string,
  label: string,
  icon: ExecutiveOperationIcon,
  message: string,
): ExecutiveOperation => ({
  id,
  label,
  status: "Unknown",
  detail: `Check failed: ${message}`,
  state: "error",
  icon,
});

function certificationRow(
  id: string,
  label: string,
  icon: ExecutiveOperationIcon,
  value: KnowledgeOperationsTruth["dayZero"],
  validDetail: string,
): ExecutiveOperation {
  if (value.status === "loading") return checking(id, label, icon);
  if (value.status === "error") return failed(id, label, icon, value.message);

  switch (value.data.state) {
    case "VALID":
      return { id, label, icon, status: "Certified", detail: validDetail, state: "healthy" };
    case "STALE":
      return { id, label, icon, status: "Stale", detail: "Knowledge changed since certification; re-certify when ready", state: "warning" };
    default:
      return { id, label, icon, status: value.data.state.toLowerCase().replace(/_/g, " "), detail: "Not currently certified", state: "warning" };
  }
}

export function deriveExecutiveOperations(
  truth: KnowledgeOperationsTruth,
): ExecutiveOperation[] {
  const runtime: ExecutiveOperation =
    truth.runtime.status === "loading"
      ? checking("runtime", "Runtime", "runtime")
      : truth.runtime.status === "error"
        ? { id: "runtime", label: "Runtime", icon: "runtime", status: "Offline", detail: `Not answering: ${truth.runtime.message}`, state: "error" }
        : { id: "runtime", label: "Runtime", icon: "runtime", status: "Online", detail: "Health check answered", state: "healthy" };

  const knowledge: ExecutiveOperation =
    truth.overview.status === "loading"
      ? checking("knowledge", "Knowledge", "knowledge")
      : truth.overview.status === "error"
        ? failed("knowledge", "Knowledge", "knowledge", truth.overview.message)
        : {
            id: "knowledge",
            label: "Knowledge",
            icon: "knowledge",
            status: `${truth.overview.data.canonicalItems} canonical`,
            detail: `${truth.overview.data.evidenceTotal} evidence records on file`,
            state: truth.overview.data.canonicalItems > 0 ? "healthy" : "warning",
          };

  const activation = truth.activation;
  const chiefAgent: ExecutiveOperation =
    activation.status === "loading"
      ? checking("chief-agent", "Chief Agent", "intelligence")
      : activation.status === "error"
        ? failed("chief-agent", "Chief Agent", "intelligence", activation.message)
        : activation.data.state === "ACTIVE"
          ? { id: "chief-agent", label: "Chief Agent", icon: "intelligence", status: "Active", detail: `Autonomy: ${(activation.data.autonomyLevel ?? "unknown").toLowerCase().replace(/_/g, " ")}`, state: "healthy" }
          : activation.data.state === "NOT_ACTIVATED"
            ? { id: "chief-agent", label: "Chief Agent", icon: "intelligence", status: "Not activated", detail: "Awaiting the owner's activation decision", state: "active" }
            : { id: "chief-agent", label: "Chief Agent", icon: "intelligence", status: activation.data.state.toLowerCase(), detail: "Reasoning refused until resumed or re-activated", state: activation.data.state === "UNAVAILABLE" ? "error" : "warning" };

  const rows: Array<[ExecutiveOperation, Checked<unknown>]> = [
    [runtime, truth.runtime],
    [certificationRow("genesis", "Genesis", "repository", truth.dayZero, "Day-0 certification valid"), truth.dayZero],
    [knowledge, truth.overview],
    [certificationRow("curriculum", "Curriculum", "compiler", truth.corpusCertification, "Educational Corpus certification valid"), truth.corpusCertification],
    [chiefAgent, truth.activation],
  ];

  /* A value kept from the last good check says so. */
  return rows.map(([row, source]) =>
    source.status === "ok" && source.stale
      ? { ...row, detail: `${row.detail} · last re-check failed` }
      : row,
  );
}

export type ExecutiveOverall = {
  label: string;
  tone: "nominal" | "attention" | "offline" | "checking";
};

export function deriveExecutiveOverall(
  operations: readonly ExecutiveOperation[],
  truth: KnowledgeOperationsTruth,
): ExecutiveOverall {
  if (truth.runtime.status === "error") return { label: "Offline", tone: "offline" };
  if (operations.some((o) => o.status === "Checking")) return { label: "Checking", tone: "checking" };
  if (operations.some((o) => o.state === "error" || o.state === "warning")) return { label: "Attention", tone: "attention" };
  return { label: "Nominal", tone: "nominal" };
}
