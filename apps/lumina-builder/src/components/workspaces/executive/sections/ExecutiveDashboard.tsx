import { Compass, Gavel, Library, Lightbulb, Rocket, ServerCog, ShieldAlert, Target, type LucideIcon } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  dashboardHealth,
  recommendations,
  type PreviewTone,
} from "../design/executiveDesignPreview";
import { DesignPreviewBadge, ExecutiveCardHeading, ExecutiveSection, ExecutiveTile, tonePill } from "../shared/ExecutiveSection";
import { STATE_LABEL, STATE_TONE, currentMission, isOpenMission, missionNextStep, missionProgress } from "../state/missionView";
import { useExecutiveOffice } from "../state/useExecutiveOffice";

const DECISION_TONE: Record<string, "healthy" | "warning" | "error" | "active"> = {
  approved: "healthy",
  implemented: "healthy",
  proposed: "warning",
  rejected: "error",
};

const HEALTH_ICONS: Record<string, LucideIcon> = {
  mission: Rocket,
  platform: ShieldAlert,
  runtime: ServerCog,
  knowledge: Library,
};

export function ExecutiveDashboard() {
  const office = useExecutiveOffice();
  const decisions = office.operations.status === "ok" ? office.operations.data.decisions.slice(0, 5) : [];

  /* MS-5: mission health and the current mission read Runtime. */
  const missions = office.missions.status === "ok" ? office.missions.data : [];
  const current = currentMission(missions);
  const open = missions.filter(isOpenMission).length;
  const awaiting = missions.filter((mission) => mission.state === "awaiting_approval").length;
  const missionTile = {
    id: "mission",
    label: "Mission Health",
    value: office.missions.status === "ok" ? `${open} open` : office.missions.status === "loading" ? "Reading…" : "Unavailable",
    detail: office.missions.status === "ok"
      ? [current ? `${current.id} ${STATE_LABEL[current.state].toLowerCase()}` : "No mission in progress", awaiting ? `${awaiting} awaiting you` : ""].filter(Boolean).join(" · ")
      : office.missions.status === "error" ? office.missions.message : "",
    tone: (office.missions.status === "error" ? "error" : awaiting ? "warning" : current ? STATE_TONE[current.state] : "healthy") as PreviewTone,
  };
  const health = [missionTile, ...dashboardHealth];

  return (
    <ExecutiveSection
      id="executive-overview"
      icon={Compass}
      eyebrow="Executive Dashboard · Overview"
      title="Platform at a glance"
      description="Mission, platform, runtime, and knowledge health, what the Chief Agent recommends, the current mission, and recent decisions."
      wiring="partial"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {health.map((tile) => (
          <ExecutiveTile key={tile.id} label={tile.label} value={tile.value} detail={tile.detail} tone={tile.tone} icon={HEALTH_ICONS[tile.id]} />
        ))}
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
          <div className="relative z-10">
            <ExecutiveCardHeading icon={Lightbulb} tone="warning">Recommendations</ExecutiveCardHeading>
            <ul className="mt-3 grid gap-3">
              {recommendations.map((item) => (
                <li key={item.title} className="rounded-[14px] border border-cyan-300/15 bg-slate-950/40 p-3">
                  <div className="text-sm font-semibold text-sky-50">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-sky-300/60">{item.reason}</div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/80">Impact · {item.impact}</div>
                </li>
              ))}
            </ul>
          </div>
        </LuminaFlagshipCard>

        <div className="grid gap-4">
          <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
            <div className="relative z-10">
              <ExecutiveCardHeading icon={Target}>Current mission</ExecutiveCardHeading>
              <div className="mt-2 text-lg font-semibold text-amber-300">{current ? `${current.id} · ${current.title}` : "No mission in progress"}</div>
              <div className="mt-1 text-xs leading-5 text-sky-300/70">{current ? current.objective : "Ask the Chief Agent to propose one, or approve a proposal waiting for you."}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400" style={{ width: `${current ? missionProgress(current) : 0}%` }} />
              </div>
              <div className="mt-2 text-xs text-sky-300/60">{current ? `${STATE_LABEL[current.state]} · next: ${missionNextStep(current)}` : "—"}</div>
            </div>
          </LuminaFlagshipCard>

          <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3">
                <ExecutiveCardHeading icon={Gavel} tone="healthy">Recent decisions</ExecutiveCardHeading>
                <DesignPreviewBadge wiring="live" />
              </div>
              <ul className="mt-3 grid gap-2">
                {office.operations.status === "loading" ? (
                  <li className="text-sm text-sky-300/60">Reading decisions…</li>
                ) : null}
                {office.operations.status === "error" ? (
                  <li className="text-sm text-rose-200">Decisions unavailable: {office.operations.message}</li>
                ) : null}
                {office.operations.status === "ok" && decisions.length === 0 ? (
                  <li className="text-sm text-sky-300/60">No executive decisions yet.</li>
                ) : null}
                {decisions.map((decision) => (
                  <li key={decision.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-sky-100/80" title={`${decision.id} · ${new Date(decision.updatedAt).toLocaleString()}`}>{decision.title}</span>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill[DECISION_TONE[decision.status] ?? "active"]}`}>
                      {decision.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </LuminaFlagshipCard>
        </div>
      </div>
    </ExecutiveSection>
  );
}
