export const electricContour = {
  strength: {
    subtle: [
      "border border-blue-400/44",
      "ring-1 ring-inset ring-cyan-300/10",
      "shadow-[0_0_0_1px_rgba(59,130,246,.10),0_0_14px_rgba(37,99,235,.08),inset_0_0_12px_rgba(56,189,248,.025)]",
    ].join(" "),

    standard: [
      "border border-blue-400/56",
      "ring-1 ring-inset ring-cyan-300/14",
      "shadow-[0_0_0_1px_rgba(59,130,246,.13),0_0_20px_rgba(37,99,235,.12),inset_0_0_14px_rgba(56,189,248,.035)]",
    ].join(" "),

    prominent: [
      "border border-blue-400/68",
      "ring-1 ring-inset ring-cyan-300/18",
      "shadow-[0_0_0_1px_rgba(59,130,246,.17),0_0_28px_rgba(37,99,235,.16),inset_0_0_18px_rgba(56,189,248,.045)]",
    ].join(" "),

    flagship: [
      "border border-blue-400/76",
      "ring-1 ring-inset ring-cyan-200/22",
      "shadow-[0_0_0_1px_rgba(59,130,246,.20),0_0_34px_rgba(37,99,235,.19),0_24px_70px_rgba(2,6,23,.34),inset_0_1px_0_rgba(255,255,255,.07)]",
    ].join(" "),
  },

  accent: {
    cyan: [
      "border-cyan-300/62",
      "ring-cyan-200/18",
      "shadow-[0_0_0_1px_rgba(34,211,238,.14),0_0_24px_rgba(34,211,238,.14),inset_0_0_15px_rgba(34,211,238,.035)]",
    ].join(" "),

    violet: [
      "border-violet-400/66",
      "ring-violet-200/18",
      "shadow-[0_0_0_1px_rgba(139,92,246,.15),0_0_24px_rgba(139,92,246,.16),inset_0_0_15px_rgba(167,139,250,.04)]",
    ].join(" "),

    amber: [
      "border-amber-300/62",
      "ring-amber-200/16",
      "shadow-[0_0_0_1px_rgba(245,158,11,.14),0_0_22px_rgba(245,158,11,.14),inset_0_0_15px_rgba(251,191,36,.035)]",
    ].join(" "),
  },

  highlight: {
    cool: "pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/48 to-transparent",
    violet: "pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-violet-200/62 to-transparent",
    warm: "pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-amber-200/58 to-transparent",
    neutral: "pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-sky-200/20 to-transparent",
  },
} as const;

export type ElectricContour =
  typeof electricContour;
