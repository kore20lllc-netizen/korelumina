import { Bot } from "lucide-react";

import { agents } from "../design/executiveDesignPreview";
import { ExecutiveSection, toneDot } from "../shared/ExecutiveSection";

const COLUMNS = [
  ["status", "Status"],
  ["mission", "Mission"],
  ["workload", "Workload"],
  ["lastActivity", "Last activity"],
  ["confidence", "Confidence"],
  ["blocked", "Blocked"],
  ["approvals", "Autonomy"],
] as const;

export function AgentCenter() {
  return (
    <ExecutiveSection
      id="executive-agents"
      icon={Bot}
      eyebrow="Agent Center"
      title="Every agent and what it is doing"
      description="Status, current mission, workload, last activity, confidence, blocked state, and required approvals. Agents can be inspected individually."
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
            {agents.map((agent) => (
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
