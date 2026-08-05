import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type LuminaStatusTone =
  | "healthy"
  | "active"
  | "warning"
  | "error"
  | "neutral";

type LuminaStatusBadgeProps = {
  children: ReactNode;
  tone?: LuminaStatusTone;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className">;

const toneClass: Record<LuminaStatusTone, string> = {
  healthy:
    "border-emerald-300/24 bg-emerald-300/[0.07] text-emerald-100",
  active:
    "border-cyan-300/24 bg-cyan-300/[0.07] text-cyan-100",
  warning:
    "border-amber-300/24 bg-amber-300/[0.07] text-amber-100",
  error:
    "border-rose-300/24 bg-rose-300/[0.07] text-rose-100",
  neutral:
    "border-slate-300/20 bg-slate-300/[0.05] text-slate-100",
};

export function LuminaStatusBadge({
  children,
  tone = "neutral",
  className,
  ...props
}: LuminaStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-[9px] font-semibold uppercase tracking-[0.12em]",
        toneClass[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
