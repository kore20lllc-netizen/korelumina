import { ArrowRight } from "lucide-react";

export function KnowledgePipelineOverview() {
  const steps = [
    "Repository",
    "Acquisition",
    "Evidence",
    "Knowledge IR",
    "Validation",
    "Canonical",
    "Learning",
    "Reasoning",
    "Memory",
    "Chief Agent",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Canonical Knowledge Lifecycle
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => (
          <div
            key={step}
            className="relative rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3"
          >
            <div className="text-[10px] tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div className="mt-1 text-[12px] font-semibold tracking-tight">
              {step}
            </div>

            {index < steps.length - 1 && (
              <ArrowRight className="absolute right-3 top-3 h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
