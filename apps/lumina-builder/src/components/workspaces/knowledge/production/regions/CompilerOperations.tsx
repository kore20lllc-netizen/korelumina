import {
  CircleDashed,
  CircleX,
  Clock3,
  RotateCcw,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  FlagshipPanel,
} from "../../learning/presentation/FlagshipPanel";

import type {
  CompilerOperation,
} from "../state";

interface CompilerOperationsProps {
  compilers: CompilerOperation[];
  selectedCompilerId: string;
  onCompilerSelect: (compilerId: string) => void;
}

const statusState = {
  queued: "active",
  parsing: "active",
  extracting: "active",
  "ir-generation": "active",
  validation: "warning",
  complete: "healthy",
  failed: "error",
  retry: "warning",
  future: "active",
} as const;

export function CompilerOperations({
  compilers,
  selectedCompilerId,
  onCompilerSelect,
}: CompilerOperationsProps) {
  return (
    <FlagshipPanel
      title="Compiler Operations"
      description="Unified production visibility across current detailed compilers and certified future stages."
    >
      <div className="grid gap-3 p-5 lg:grid-cols-2 xl:grid-cols-3">
        {compilers.map((compiler) => {
          const selected =
            compiler.id === selectedCompilerId;

          return (
            <button
              key={compiler.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onCompilerSelect(compiler.id)}
              className={[
                "rounded-[20px] border p-4 text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                "motion-reduce:transition-none",
                selected
                  ? "border-violet-200/68 bg-violet-300/[0.10] shadow-[0_0_26px_rgba(167,139,250,.13)]"
                  : "border-violet-300/28 bg-slate-950/24 hover:border-violet-200/52 hover:bg-violet-300/[0.05]",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <ExecutivePremiumIcon
                  icon={compiler.icon}
                  state={statusState[compiler.status]}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-amber-400">
                        {compiler.label}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-sky-500/78">
                        {compiler.description}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]",
                        compiler.detailed
                          ? "border-cyan-300/28 bg-cyan-300/[0.07] text-cyan-200"
                          : "border-slate-300/18 bg-slate-300/[0.05] text-slate-300",
                      ].join(" ")}
                    >
                      {compiler.detailed
                        ? "Detailed"
                        : "Future"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-cyan-300/18 bg-cyan-300/[0.04] p-3">
                      <div className="text-[9px] uppercase tracking-[0.12em] text-sky-500/60">
                        Status
                      </div>
                      <div className="mt-1 text-xs font-semibold capitalize text-cyan-200">
                        {compiler.status.replace("-", " ")}
                      </div>
                    </div>

                    <div className="rounded-xl border border-violet-300/18 bg-violet-300/[0.04] p-3">
                      <div className="text-[9px] uppercase tracking-[0.12em] text-sky-500/60">
                        Queue
                      </div>
                      <div className="mt-1 text-xs font-semibold text-violet-200">
                        {compiler.queue}
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-300/18 bg-amber-300/[0.04] p-3">
                      <div className="text-[9px] uppercase tracking-[0.12em] text-sky-500/60">
                        Confidence
                      </div>
                      <div className="mt-1 text-xs font-semibold text-amber-300">
                        {compiler.confidence
                          ? `${compiler.confidence}%`
                          : "Pending"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-violet-300/14 pt-3 text-[11px] text-sky-400/76">
                    {compiler.status === "failed" ? (
                      <CircleX className="h-3.5 w-3.5 text-rose-300" />
                    ) : compiler.status === "retry" ? (
                      <RotateCcw className="h-3.5 w-3.5 text-amber-300" />
                    ) : compiler.status === "future" ? (
                      <Clock3 className="h-3.5 w-3.5 text-slate-300" />
                    ) : (
                      <CircleDashed className="h-3.5 w-3.5 text-cyan-300" />
                    )}
                    {compiler.educationalContribution}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </FlagshipPanel>
  );
}
