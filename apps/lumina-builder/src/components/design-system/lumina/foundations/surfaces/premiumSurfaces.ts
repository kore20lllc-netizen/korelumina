export const premiumSurfaces = {
  base: {
    shell: [
      "relative overflow-hidden",
      "bg-[linear-gradient(135deg,rgba(3,10,30,.84),rgba(14,9,39,.78),rgba(3,12,34,.84))]",
      "backdrop-blur-[34px]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,.05)]",
    ].join(" "),

    panel: [
      "relative overflow-hidden",
      "bg-[linear-gradient(135deg,rgba(3,12,35,.72),rgba(17,10,45,.66),rgba(3,14,37,.70))]",
      "backdrop-blur-[28px]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,.05)]",
    ].join(" "),

    card: [
      "relative overflow-hidden",
      "bg-[linear-gradient(135deg,rgba(5,14,38,.68),rgba(20,12,48,.60),rgba(5,16,39,.66))]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,.045)]",
    ].join(" "),

    inset: [
      "relative overflow-hidden",
      "bg-slate-950/28",
      "shadow-[inset_0_1px_0_rgba(255,255,255,.035)]",
    ].join(" "),
  },

  emphasis: {
    neutral: [
      "bg-[linear-gradient(135deg,rgba(6,15,38,.76),rgba(19,13,48,.68),rgba(6,17,40,.74))]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,.05)]",
    ].join(" "),

    cool: [
      "bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,.12),transparent_38%),linear-gradient(135deg,rgba(6,22,52,.78),rgba(23,17,62,.70),rgba(5,22,50,.76))]",
      "shadow-[inset_0_1px_0_rgba(186,230,253,.07)]",
    ].join(" "),

    violet: [
      "bg-[radial-gradient(circle_at_18%_0%,rgba(167,139,250,.16),transparent_40%),linear-gradient(135deg,rgba(38,20,74,.84),rgba(61,28,93,.78),rgba(33,18,68,.82))]",
      "shadow-[inset_0_1px_0_rgba(237,233,254,.07)]",
    ].join(" "),

    warm: [
      "bg-[radial-gradient(circle_at_18%_0%,rgba(245,158,11,.14),transparent_40%),linear-gradient(135deg,rgba(48,28,10,.82),rgba(56,27,66,.76),rgba(40,24,10,.80))]",
      "shadow-[inset_0_1px_0_rgba(254,243,199,.07)]",
    ].join(" "),
  },

  interaction: {
    hoverLift: [
      "transition-[transform,background-color,box-shadow,border-color] duration-200",
      "hover:-translate-y-0.5",
      "motion-reduce:transform-none motion-reduce:transition-none",
    ].join(" "),

    focusRing: [
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-offset-slate-950",
    ].join(" "),
  },
} as const;

export type PremiumSurfaces =
  typeof premiumSurfaces;
