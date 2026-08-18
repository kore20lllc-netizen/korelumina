export const semanticIconFrame = {
  size: {
    compact: "h-8 w-8 rounded-[12px]",
    standard: "h-10 w-10 rounded-[14px]",
    prominent: "h-12 w-12 rounded-[16px]",
  },

  base: [
    "inline-flex shrink-0 items-center justify-center border",
    "ring-1 ring-inset",
    "shadow-[inset_0_1px_0_rgba(255,255,255,.05)]",
  ].join(" "),

  tone: {
    neutral: [
      "border-slate-600/42",
      "bg-slate-900/52",
      "text-sky-500/58",
      "ring-slate-500/10",
    ].join(" "),

    informational: [
      "border-cyan-300/56",
      "bg-cyan-300/[0.09]",
      "text-cyan-200",
      "ring-cyan-200/14",
      "shadow-[0_0_18px_rgba(34,211,238,.14),inset_0_1px_0_rgba(207,250,254,.05)]",
    ].join(" "),

    active: [
      "border-blue-400/64",
      "bg-blue-300/[0.10]",
      "text-sky-200",
      "ring-cyan-200/16",
      "shadow-[0_0_18px_rgba(59,130,246,.17),inset_0_1px_0_rgba(219,234,254,.06)]",
    ].join(" "),

    positive: [
      "border-emerald-300/58",
      "bg-emerald-300/[0.09]",
      "text-emerald-200",
      "ring-emerald-200/14",
      "shadow-[0_0_18px_rgba(52,211,153,.14),inset_0_1px_0_rgba(209,250,229,.05)]",
    ].join(" "),

    warning: [
      "border-amber-300/58",
      "bg-amber-300/[0.10]",
      "text-amber-300",
      "ring-amber-200/14",
      "shadow-[0_0_18px_rgba(245,158,11,.18),inset_0_1px_0_rgba(254,243,199,.05)]",
    ].join(" "),

    critical: [
      "border-rose-300/58",
      "bg-rose-300/[0.09]",
      "text-rose-200",
      "ring-rose-200/14",
      "shadow-[0_0_18px_rgba(244,63,94,.16),inset_0_1px_0_rgba(255,228,230,.05)]",
    ].join(" "),

    violet: [
      "border-violet-400/70",
      "bg-violet-300/[0.12]",
      "text-violet-200",
      "ring-violet-200/18",
      "shadow-[0_0_20px_rgba(139,92,246,.24),inset_0_1px_0_rgba(237,233,254,.06)]",
    ].join(" "),
  },

  icon: {
    compact: "h-4 w-4",
    standard: "h-[18px] w-[18px]",
    prominent: "h-5 w-5",
  },
} as const;

export type SemanticIconFrame =
  typeof semanticIconFrame;

export type SemanticIconTone =
  keyof typeof semanticIconFrame.tone;

export type SemanticIconFrameSize =
  keyof typeof semanticIconFrame.size;
