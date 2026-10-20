import { Bot } from "lucide-react";

import type { PreviewTone } from "../design/executiveDesignPreview";
import { ExecutiveSection, toneDot } from "../shared/ExecutiveSection";
import { currentMission, isOpenMission } from "../state/missionView";
import { useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * MS-5 (ADR-0044 Decision 6): agents show only what exists. The Chief Agent
 * row reads activation, missions and its latest reasoning from Runtime. The
 * specialist agents of the approved Mission System (Delegation) are listed
 * as not built until they exist.
 */

const COLUMNS = [
  ["status", "Status"],
  ["mission", "Mission"],
  ["workload", "Workload"],
  ["lastActivity", "Last activity"],
  ["confidence", "Confidence"],
  ["blocked", "Blocked"],
  ["approvals", "Autonomy"],
] as const;

type AgentRow = Record<(typeof COLUMNS)[number][0], string> & { name: string; tone: PreviewTone };

/* docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md, Delegation. */
const SPECIALISTS = ["Planning Agent", "Runtime Agent", "Builder Agent", "Knowledge Agent", "Documentation Agent", "QA Agent"];

function titleCase(value: string): string {
  return value.toLowerCase().replace(/(^|_)(\w)/g, (_match, separator: string, letter: string) => `${separator ? " " : ""}${letter.toUpperCase()}`);
}

export function AgentCenter() {
  const office = useExecutiveOffice();
  const activation = office.activation.status === "ok" ? office.activation.data : null;
  const missions = office.missions.status === "ok" ? office.missions.data : [];
  const reasoning = office.operations.status === "ok"
    ? [...office.operations.data.reasoning].sort((left, right) => right.createdAt - left.createdAt)[0] ?? null
    : null;
  const current = currentMission(missions);
  const open = missions.filter(isOpenMission);
  const awaiting = missions.filter((mission) => mission.state === "awaiting_approval").length;
  const blocked = missions.filter((mission) => mission.state === "blocked");
  const unread = (loaded: { status: string }) => (loaded.status === "loading" ? "Reading…" : "Unavailable");

  const chiefAgent: AgentRow = {
    name: "Chief Agent",
    status: activation ? titleCase(activation.state) : unread(office.activation),
    mission: office.missions.status === "ok" ? (current ? `${current.id} · ${current.title}` : "None") : unread(office.missions),
    workload: office.missions.status === "ok" ? `${open.length} open mission${open.length === 1 ? "" : "s"}${awaiting ? `, ${awaiting} awaiting you` : ""}` : unread(office.missions),
    lastActivity: reasoning ? `${reasoning.title} · ${new Date(reasoning.createdAt).toLocaleString()}` : office.operations.status === "ok" ? "No reasoning yet" : unread(office.operations),
    confidence: reasoning ? `${reasoning.confidence.toFixed(2)} last reply` : "—",
    blocked: office.missions.status === "ok" ? (blocked.length ? `Yes · ${blocked.map((mission) => mission.id).join(", ")}` : "No") : unread(office.missions),
    approvals: activation ? activation.autonomyLevel ?? "None" : unread(office.activation),
    tone: activation?.active ? "healthy" : "warning",
  };

  const rows: AgentRow[] = [
    chiefAgent,
    ...SPECIALISTS.map((name) => ({
      name,
      status: "Not built",
      mission: "—",
      workload: "—",
      lastActivity: "—",
      confidence: "—",
      blocked: "—",
      approvals: "—",
      tone: "warning" as PreviewTone,
    })),
  ];

  return (
    <ExecutiveSection
      id="executive-agents"
      icon={Bot}
      eyebrow="Agent Center"
      title="Every agent and what it is doing"
      description="Status, current mission, workload, last activity, confidence, blocked missions, and autonomy. Specialist agents appear as Not built until they exist."
      wiring="live"
    >
      <div className="overflow-x-auto rounded-[18px] border border-cyan-300/15">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-950/60 text-[10px] uppercase tracking-[0.14em] text-cyan-300/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Agent</th>
              {COLUMNS.map(([, label]) => (
                <th key={label} className="px-4 py-3 font-semibold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((agent) => (
              <tr key={agent.name} className="border-t border-cyan-300/10">
                <td className="px-4 py-3 font-semibold text-sky-50">
                  <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${toneDot[agent.tone]}`} />
                  {agent.name}
                </td>
                {COLUMNS.map(([key]) => (
                  <td key={key} className="px-4 py-3 text-sky-100/75">{agent[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ExecutiveSection>
  );
}
