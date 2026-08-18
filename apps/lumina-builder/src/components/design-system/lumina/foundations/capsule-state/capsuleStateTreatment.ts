export const capsuleStateTreatment = {
  integrity: {
    sealed: {
      shell: [
        "border border-cyan-300/52",
        "bg-[linear-gradient(135deg,rgba(5,20,45,.82),rgba(20,15,58,.76),rgba(5,22,48,.80))]",
        "ring-1 ring-inset ring-cyan-200/14",
        "shadow-[0_0_0_1px_rgba(34,211,238,.11),0_0_22px_rgba(34,211,238,.12),inset_0_1px_0_rgba(207,250,254,.06)]",
      ].join(" "),
      seam: "bg-gradient-to-r from-transparent via-cyan-200/56 to-transparent",
      motion: "transition-[border-color,box-shadow,background-color] duration-200 ease-out motion-reduce:transition-none",
    },

    exposed: {
      shell: [
        "border border-amber-300/58",
        "bg-[linear-gradient(135deg,rgba(48,26,9,.84),rgba(55,27,68,.78),rgba(42,24,10,.82))]",
        "ring-1 ring-inset ring-amber-200/16",
        "shadow-[0_0_0_1px_rgba(245,158,11,.13),0_0_24px_rgba(245,158,11,.15),inset_0_1px_0_rgba(254,243,199,.06)]",
      ].join(" "),
      seam: "bg-gradient-to-r from-transparent via-amber-200/62 to-transparent",
      motion: "transition-[border-color,box-shadow,background-color] duration-200 ease-out motion-reduce:transition-none",
    },

    resealing: {
      shell: [
        "border border-violet-300/58",
        "bg-[linear-gradient(135deg,rgba(38,20,76,.86),rgba(66,29,101,.80),rgba(34,18,70,.84))]",
        "ring-1 ring-inset ring-violet-200/18",
        "shadow-[0_0_0_1px_rgba(139,92,246,.14),0_0_26px_rgba(139,92,246,.17),inset_0_1px_0_rgba(237,233,254,.06)]",
      ].join(" "),
      seam: "bg-gradient-to-r from-transparent via-violet-200/66 to-transparent",
      motion: "transition-[border-color,box-shadow,background-color] duration-300 ease-out motion-reduce:transition-none",
    },
  },

  layer: {
    stable: [
      "border border-emerald-300/42",
      "bg-emerald-300/[0.07]",
      "text-emerald-200",
    ].join(" "),

    active: [
      "border border-cyan-300/44",
      "bg-cyan-300/[0.07]",
      "text-cyan-200",
    ].join(" "),

    disputed: [
      "border border-amber-300/46",
      "bg-amber-300/[0.08]",
      "text-amber-200",
    ].join(" "),

    failed: [
      "border border-rose-300/48",
      "bg-rose-300/[0.08]",
      "text-rose-200",
    ].join(" "),

    dormant: [
      "border border-slate-600/36",
      "bg-slate-800/36",
      "text-slate-400",
    ].join(" "),
  },

  interaction: {
    selectable: [
      "cursor-pointer",
      "transition-[transform,border-color,box-shadow] duration-200 ease-out",
      "hover:-translate-y-0.5",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/54",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
      "motion-reduce:transform-none motion-reduce:transition-none",
    ].join(" "),

    selected: [
      "border-cyan-200/76",
      "shadow-[0_0_0_1px_rgba(34,211,238,.18),0_0_30px_rgba(34,211,238,.20),inset_0_1px_0_rgba(207,250,254,.08)]",
    ].join(" "),

    disabled: [
      "cursor-not-allowed",
      "opacity-50",
      "grayscale-[0.25]",
    ].join(" "),
  },

  anatomy: {
    shell: "relative overflow-hidden rounded-full",
    content: "relative z-10 min-w-0",
    seam: "pointer-events-none absolute inset-x-[10%] top-0 h-px",
    layerStack: "relative z-10 flex min-w-0 items-center gap-1.5",
  },
} as const;

export type CapsuleStateTreatment =
  typeof capsuleStateTreatment;

export type CapsuleIntegrityTreatment =
  keyof typeof capsuleStateTreatment.integrity;

export type CapsuleLayerTreatment =
  keyof typeof capsuleStateTreatment.layer;
