export type ExecutiveIconState =
  | "healthy"
  | "active"
  | "warning"
  | "error";

export const executiveIconTheme = {
  healthy: {
    frame: "border-emerald-300/15 bg-emerald-300/[0.06]",
    glow: "shadow-[0_0_18px_rgba(110,231,183,.18)]",
    icon: "text-emerald-100",
    halo: "bg-emerald-300/20",
  },
  active: {
    frame: "border-cyan-300/15 bg-cyan-300/[0.06]",
    glow: "shadow-[0_0_18px_rgba(34,211,238,.18)]",
    icon: "text-cyan-100",
    halo: "bg-cyan-300/20",
  },
  warning: {
    frame: "border-amber-300/15 bg-amber-300/[0.06]",
    glow: "shadow-[0_0_18px_rgba(252,211,77,.18)]",
    icon: "text-amber-100",
    halo: "bg-amber-300/20",
  },
  error: {
    frame: "border-rose-300/15 bg-rose-300/[0.06]",
    glow: "shadow-[0_0_18px_rgba(251,113,133,.18)]",
    icon: "text-rose-100",
    halo: "bg-rose-300/20",
  },
} as const;
