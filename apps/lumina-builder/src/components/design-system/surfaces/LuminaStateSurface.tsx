import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import type {
  LuminaStatusTone,
} from "./LuminaStatusBadge";

type LuminaStateSurfaceProps = {
  children: ReactNode;
  tone?: LuminaStatusTone;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">;

const toneClass: Record<LuminaStatusTone, string> = {
  healthy:
    "border-emerald-300/14 bg-emerald-300/[0.025] text-emerald-100",
  active:
    "border-cyan-300/14 bg-cyan-300/[0.025] text-cyan-100",
  warning:
    "border-amber-300/14 bg-amber-300/[0.025] text-amber-100",
  error:
    "border-rose-300/14 bg-rose-300/[0.025] text-rose-100",
  neutral:
    "border-slate-300/14 bg-slate-300/[0.025] text-slate-100",
};

export function LuminaStateSurface({
  children,
  tone = "neutral",
  className,
  ...props
}: LuminaStateSurfaceProps) {
  return (
    <div
      className={[
        "rounded-[18px] border p-4",
        toneClass[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
