export const semanticStatusLanguage = {
  neutral: {
    label: "Neutral",
    foreground: "text-slate-300",
    muted: "text-slate-400/72",
    border: "border-slate-500/42",
    background: "bg-slate-400/[0.08]",
    dot: "bg-slate-400",
  },

  informational: {
    label: "Informational",
    foreground: "text-cyan-200",
    muted: "text-cyan-300/72",
    border: "border-cyan-300/48",
    background: "bg-cyan-300/[0.08]",
    dot: "bg-cyan-300",
  },

  active: {
    label: "Active",
    foreground: "text-sky-200",
    muted: "text-sky-300/74",
    border: "border-blue-400/54",
    background: "bg-blue-300/[0.09]",
    dot: "bg-sky-300",
  },

  positive: {
    label: "Positive",
    foreground: "text-emerald-200",
    muted: "text-emerald-300/72",
    border: "border-emerald-300/48",
    background: "bg-emerald-300/[0.08]",
    dot: "bg-emerald-300",
  },

  warning: {
    label: "Warning",
    foreground: "text-amber-200",
    muted: "text-amber-300/76",
    border: "border-amber-300/54",
    background: "bg-amber-300/[0.09]",
    dot: "bg-amber-300",
  },

  critical: {
    label: "Critical",
    foreground: "text-rose-200",
    muted: "text-rose-300/76",
    border: "border-rose-300/54",
    background: "bg-rose-300/[0.09]",
    dot: "bg-rose-300",
  },

  restricted: {
    label: "Restricted",
    foreground: "text-violet-200",
    muted: "text-violet-300/74",
    border: "border-violet-300/50",
    background: "bg-violet-300/[0.09]",
    dot: "bg-violet-300",
  },

  dormant: {
    label: "Dormant",
    foreground: "text-slate-400",
    muted: "text-slate-500/72",
    border: "border-slate-600/36",
    background: "bg-slate-800/38",
    dot: "bg-slate-500",
  },
} as const;

export type SemanticStatusLanguage =
  typeof semanticStatusLanguage;

export type SemanticStatusTone =
  keyof typeof semanticStatusLanguage;
