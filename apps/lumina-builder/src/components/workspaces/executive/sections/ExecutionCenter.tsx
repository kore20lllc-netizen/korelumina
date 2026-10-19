import { Activity } from "lucide-react";

import { executionItems } from "../design/executiveDesignPreview";
import { ExecutiveSection, tonePill } from "../shared/ExecutiveSection";

export function ExecutionCenter() {
  return (
    <ExecutiveSection
      id="executive-execution"
      icon={Activity}
      eyebrow="Execution Center"
      title="Live execution stays observable"
      description="Active tasks, delegated work, runtime events, logs, validation, completion, and failures."
    >
      <ul className="grid gap-2.5">
        {executionItems.map((item) => (
          <li key={item.title} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-sky-50">{item.title}</div>
              <div className="text-xs leading-5 text-sky-300/60">{item.detail}</div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[item.tone]}`}>{item.state}</span>
          </li>
        ))}
      </ul>
    </ExecutiveSection>
  );
}
