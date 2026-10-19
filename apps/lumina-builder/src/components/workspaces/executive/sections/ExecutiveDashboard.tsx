import { Compass, Gavel, Library, Lightbulb, Rocket, ServerCog, ShieldAlert, Target, type LucideIcon } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  currentMission,
  dashboardHealth,
  recentDecisions,
  recommendations,
} from "../design/executiveDesignPreview";
import { ExecutiveCardHeading, ExecutiveSection, ExecutiveTile, tonePill } from "../shared/ExecutiveSection";

const HEALTH_ICONS: Record<string, LucideIcon> = {
  mission: Rocket,
  platform: ShieldAlert,
  runtime: ServerCog,
  knowledge: Library,
};

export function ExecutiveDashboard() {
  return (
    <ExecutiveSection
      id="executive-overview"
      icon={Compass}
      eyebrow="Executive Dashboard · Overview"
      title="Platform at a glance"
      description="Mission, platform, runtime, and knowledge health, what the Chief Agent recommends, the current mission, and recent decisions."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {dashboardHealth.map((tile) => (
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
              <div className="mt-2 text-lg font-semibold text-amber-300">{currentMission.title}</div>
              <div className="mt-1 text-xs leading-5 text-sky-300/70">{currentMission.objective}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400" style={{ width: `${currentMission.progress}%` }} />
              </div>
              <div className="mt-2 text-xs text-sky-300/60">{currentMission.stage} · next: {currentMission.next}</div>
            </div>
          </LuminaFlagshipCard>

          <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
            <div className="relative z-10">
              <ExecutiveCardHeading icon={Gavel} tone="healthy">Recent decisions</ExecutiveCardHeading>
              <ul className="mt-3 grid gap-2">
                {recentDecisions.map((decision) => (
                  <li key={decision.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-sky-100/80" title={decision.id}>{decision.title}</span>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill[decision.status === "approved" || decision.status === "recorded" ? "healthy" : "warning"]}`}>
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
