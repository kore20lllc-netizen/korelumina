import type {
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

type LearningStatusTone =
  | "complete"
  | "active"
  | "partial"
  | "blocked"
  | "review"
  | "neutral";

interface LearningStatusBadgeProps {
  tone: LearningStatusTone;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<
  LearningStatusTone,
  string
> = {
  complete:
    "border-emerald-300/22 bg-emerald-300/[0.07] text-emerald-200",
  active:
    "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100",
  partial:
    "border-amber-300/24 bg-amber-300/[0.07] text-amber-200",
  blocked:
    "border-rose-300/22 bg-rose-300/[0.065] text-rose-200",
  review:
    "border-violet-300/22 bg-violet-300/[0.065] text-violet-200",
  neutral:
    "border-white/12 bg-white/[0.035] text-white/58",
};

export function LearningStatusBadge({
  tone,
  children,
  className,
}: LearningStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
