import type { PreviewTone } from "../design/executiveDesignPreview";
import type { ExecutiveOfficeState } from "./useExecutiveOffice";

/*
 * MS-2026-0004 (E1.T1): the dashboard's platform, Runtime and knowledge
 * health, derived from records the office already reads. A tile that has
 * not read its source says so; it never shows a guessed healthy value.
 */

export interface HealthTile {
  id: "platform" | "runtime" | "knowledge";
  label: string;
  value: string;
  detail: string;
  tone: PreviewTone;
}

const GATE_LABEL: Record<string, string> = {
  "day-zero-certification": "Day-0",
  "educational-corpus-certification": "educational corpus",
  "initial-competency-certification": "initial competency",
  "initial-competency-human-acceptance": "your acceptance",
  "production-workspace-authorization": "workspace authorization",
};

function ago(at: number | undefined, now: number): string {
  if (!at) return "";
  const minutes = Math.max(0, Math.round((now - at) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

export function platformHealth(office: ExecutiveOfficeState): HealthTile {
  const read = office.prerequisites;
  const tile = { id: "platform" as const, label: "Platform Health" };
  if (read.status === "loading") return { ...tile, value: "Reading…", detail: "Re-deriving the activation certifications", tone: "active" };
  if (read.status === "error") return { ...tile, value: "Unreadable", detail: read.message, tone: "error" };
  const prerequisites = read.data;
  const invalid = prerequisites.filter((entry) => entry.state !== "VALID");
  return {
    ...tile,
    value: `${prerequisites.length - invalid.length}/${prerequisites.length} valid`,
    detail: invalid.length
      ? `Not valid: ${invalid.map((entry) => `${GATE_LABEL[entry.gate] ?? entry.gate} (${entry.state.toLowerCase()})`).join(", ")}`
      : "Every activation certification is valid",
    tone: invalid.length ? "warning" : "healthy",
  };
}

export function runtimeHealth(office: ExecutiveOfficeState, now = Date.now()): HealthTile {
  const tile = { id: "runtime" as const, label: "Runtime Health" };
  const reads = [office.operations, office.activation, office.learning, office.missions];
  if (reads.every((entry) => entry.status === "loading")) return { ...tile, value: "Reading…", detail: "", tone: "active" };
  const answering = reads.some((entry) => entry.status === "ok");
  if (!answering) return { ...tile, value: "Not answering", detail: "No Runtime read succeeded", tone: "error" };

  const cycles = office.learning.status === "ok" ? office.learning.data.cycles : [];
  const last = [...cycles].sort((left, right) => right.startedAt - left.startedAt)[0];
  const running = office.learning.status === "ok" && office.learning.data.running;
  return {
    ...tile,
    value: "Online",
    detail: running
      ? "A learning cycle is running"
      : last
        ? `Last learning cycle ${last.outcome.toLowerCase()} ${ago(last.completedAt ?? last.startedAt, now)}`
        : "No learning cycle yet",
    tone: last && last.outcome === "FAILED" ? "warning" : "healthy",
  };
}

export function knowledgeHealth(office: ExecutiveOfficeState): HealthTile {
  const tile = { id: "knowledge" as const, label: "Knowledge Health" };
  const read = office.lifecycle;
  if (read.status === "loading") return { ...tile, value: "Reading…", detail: "", tone: "active" };
  if (read.status === "error") return { ...tile, value: "Unreadable", detail: read.message, tone: "error" };
  const items = read.data.canonicalItems;
  const learned = items.filter((item) => item.contentRef.startsWith("docs/learning/")).length;
  const waiting = office.canonicalReviews.status === "ok" ? office.canonicalReviews.data.length : null;
  return {
    ...tile,
    value: String(items.length),
    detail: [`Canonical items, ${learned} learned`, waiting === null ? "" : `${waiting} awaiting review`].filter(Boolean).join(" · "),
    tone: waiting ? "warning" : "healthy",
  };
}
