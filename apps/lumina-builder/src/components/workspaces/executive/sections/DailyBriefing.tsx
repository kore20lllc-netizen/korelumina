import { Sunrise } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import { briefing } from "../design/executiveDesignPreview";
import { ExecutiveSection, toneDot } from "../shared/ExecutiveSection";

function List({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
      <div className="relative z-10">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">{title}</div>
        <ul className="mt-3 grid gap-2">
          {items.map((item) => (
            <li key={item} className="text-sm leading-6 text-sky-100/80">{item}</li>
          ))}
        </ul>
      </div>
    </LuminaFlagshipCard>
  );
}

export function DailyBriefing() {
  return (
    <ExecutiveSection
      id="executive-briefing"
      icon={Sunrise}
      eyebrow={`Daily Briefing · ${briefing.asOf}`}
      title="What should happen next?"
      description="Every session begins here: work completed, work remaining, priorities, risks, recommendations, and pending approvals."
    >
      <p className="max-w-4xl text-base leading-7 text-sky-50/90">{briefing.headline}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <List title="Completed" items={briefing.completed} />
        <List title="Remaining" items={briefing.remaining} />
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
          <div className="relative z-10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Priorities</div>
            <ol className="mt-3 grid gap-3">
              {briefing.priorities.map((priority, index) => (
                <li key={priority.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300/40 text-xs font-semibold text-amber-200">{index + 1}</span>
                  <div>
                    <div className="text-sm font-semibold text-sky-50">{priority.title}</div>
                    <div className="text-xs leading-5 text-sky-300/60">{priority.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </LuminaFlagshipCard>

        <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
          <div className="relative z-10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Risks</div>
            <ul className="mt-3 grid gap-2.5">
              {briefing.risks.map((risk) => (
                <li key={risk.title} className="flex items-start gap-2.5 text-sm leading-6 text-sky-100/80">
                  <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[risk.tone]}`} />
                  {risk.title}
                </li>
              ))}
            </ul>
          </div>
        </LuminaFlagshipCard>
      </div>
    </ExecutiveSection>
  );
}
