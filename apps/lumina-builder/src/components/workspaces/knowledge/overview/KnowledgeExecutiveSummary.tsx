import { Brain, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { GlowCard } from "@/components/lumina/GlowCard";

export function KnowledgeExecutiveSummary() {
  const items = [
    {
      label: "Knowledge posture",
      value: "Operational",
      icon: CheckCircle2,
    },
    {
      label: "Chief Agent readiness",
      value: "Growing",
      icon: Brain,
    },
    {
      label: "Governance",
      value: "Human-led",
      icon: ShieldCheck,
    },
    {
      label: "Learning loop",
      value: "Active",
      icon: Sparkles,
    },
  ];

  return (
    <GlowCard className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Executive Summary
      </div>

      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
        Engineering intelligence is being preserved, governed, and compounded.
      </h3>

      <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
        Knowledge Operations is the operational interface for evidence acquisition,
        Knowledge IR, canonical memory, learning, reasoning, organizational memory,
        and Chief Agent growth. Every important engineering artifact must become
        governed knowledge.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold">
                    {item.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlowCard>
  );
}
