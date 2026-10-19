import { Network } from "lucide-react";

import { planningTree } from "../design/executiveDesignPreview";
import { ExecutiveSection } from "../shared/ExecutiveSection";

export function PlanningCenter() {
  return (
    <ExecutiveSection
      id="executive-planning"
      icon={Network}
      eyebrow="Planning Center"
      title="From vision to task"
      description="Vision → Roadmap → Objective → Mission → Epic → Sprint → Task. The Chief Agent keeps this hierarchy up to date."
    >
      <ol className="grid gap-2">
        {planningTree.map((node, index) => (
          <li
            key={node.level}
            className="flex items-center gap-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 py-2.5 pr-3"
            style={{ paddingLeft: `${12 + index * 18}px` }}
          >
            <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/90">{node.level}</span>
            <span className="text-sm text-sky-100/85">{node.title}</span>
          </li>
        ))}
      </ol>
    </ExecutiveSection>
  );
}
