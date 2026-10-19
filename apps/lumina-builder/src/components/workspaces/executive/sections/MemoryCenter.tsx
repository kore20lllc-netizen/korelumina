import { ArrowDown, Database } from "lucide-react";
import { Fragment } from "react";

import { memoryLayers } from "../design/executiveDesignPreview";
import { ExecutiveSection } from "../shared/ExecutiveSection";

export function MemoryCenter() {
  return (
    <ExecutiveSection
      id="executive-memory"
      icon={Database}
      eyebrow="Memory Center"
      title="Where knowledge lives and how it flows"
      description="Working memory flows up through conversation, session, project, repository, and organizational memory into canonical knowledge."
    >
      <ol className="grid gap-1.5">
        {memoryLayers.map((layer, index) => (
          <Fragment key={layer.layer}>
            <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-4 py-2.5">
              <div>
                <div className="text-sm font-semibold text-sky-50">{layer.layer}</div>
                <div className="text-xs text-sky-300/60">{layer.detail}</div>
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${layer.state === "Not built" || layer.state === "0 records" ? "text-amber-200/80" : "text-emerald-200/80"}`}>
                {layer.state}
              </span>
            </li>
            {index < memoryLayers.length - 1 ? (
              <ArrowDown aria-hidden="true" className="mx-auto h-3.5 w-3.5 text-cyan-300/50" />
            ) : null}
          </Fragment>
        ))}
      </ol>
    </ExecutiveSection>
  );
}
