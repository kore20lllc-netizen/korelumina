export const flagshipAppearance = {
  panel: [
    "relative overflow-hidden rounded-[30px] border",
    "border-cyan-300/58",
    "bg-[radial-gradient(circle_at_14%_0%,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_78%_14%,rgba(147,51,234,0.11),transparent_32%),radial-gradient(circle_at_38%_90%,rgba(180,83,9,0.08),transparent_28%),linear-gradient(135deg,rgba(2,6,23,0.60),rgba(15,10,40,0.57),rgba(2,8,26,0.59))]",
    "ring-1 ring-inset ring-cyan-100/18",
    "shadow-[0_0_0_1px_rgba(59,130,246,0.14),0_0_34px_rgba(37,99,235,0.12),0_24px_72px_rgba(2,6,23,0.40),inset_0_1px_0_rgba(255,255,255,0.07)]",
    "backdrop-blur-[50px] backdrop-saturate-[180%]",
  ].join(" "),

  panelReflection:
    "pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/48 to-transparent",

  panelHeader: [
    "relative border-b border-cyan-300/18",
    "bg-[linear-gradient(180deg,rgba(15,23,42,0.20),rgba(2,6,23,0.04))]",
  ].join(" "),

  panelTitle: [
    "text-xl font-semibold tracking-[-0.025em]",
    "text-amber-500",
    "drop-shadow-[0_0_20px_rgba(180,83,9,0.22)]",
  ].join(" "),

  description:
    "text-sm leading-6 text-sky-400/78",

  eyebrow:
    "text-[10px] font-semibold uppercase tracking-[0.20em] text-cyan-300/82",

  panelMeta:
    "text-[11px] font-medium text-sky-400/72",

  card: [
    "relative overflow-hidden rounded-[22px] border",
    "border-cyan-300/40",
    "bg-[linear-gradient(135deg,rgba(3,12,35,0.68),rgba(17,10,45,0.62),rgba(3,14,37,0.66))]",
    "ring-1 ring-inset ring-cyan-100/10",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(2,6,23,0.20)]",
  ].join(" "),

  cardInteractive: [
    "transition-[transform,border-color,background-color,box-shadow] duration-200",
    "hover:-translate-y-0.5 hover:border-cyan-200/72",
    "hover:bg-[linear-gradient(135deg,rgba(5,18,48,0.76),rgba(23,13,58,0.70),rgba(4,19,49,0.74))]",
    "hover:shadow-[0_0_26px_rgba(34,211,238,0.12),0_18px_42px_rgba(2,6,23,0.34)]",
    "motion-reduce:transition-none",
  ].join(" "),

  cardSelected: [
    "border-cyan-100/88",
    "bg-[radial-gradient(circle_at_14%_0%,rgba(34,211,238,0.13),transparent_42%),linear-gradient(135deg,rgba(6,22,55,0.82),rgba(28,15,65,0.76),rgba(5,24,58,0.80))]",
    "ring-cyan-100/24",
    "shadow-[0_0_0_1px_rgba(125,211,252,0.22),0_0_32px_rgba(34,211,238,0.16),0_18px_44px_rgba(2,6,23,0.36)]",
  ].join(" "),

  cardHighlight:
    "pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/55 to-transparent",

  cardTitle:
    "text-sm font-semibold tracking-[-0.01em] text-sky-200",

  body:
    "text-sm leading-6 text-sky-300/76",

  metadataLabel:
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-500/82",

  metadataValue:
    "mt-1 text-sm font-medium text-sky-200/88",

  governanceLabel:
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/88",

  governanceValue:
    "mt-1 text-sm font-medium text-amber-300/90",

  innerPanel: [
    "rounded-[22px] border border-blue-400/48",
    "ring-1 ring-inset ring-cyan-300/10",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_30px_rgba(2,6,23,0.18)]",
  ].join(" "),

  innerSurface: [
    "rounded-[18px] border border-cyan-300/32",
    "bg-slate-950/34",
    "ring-1 ring-inset ring-cyan-100/8",
  ].join(" "),

  mutedSurface: [
    "rounded-[18px] border border-cyan-300/24",
    "bg-slate-950/28",
    "ring-1 ring-inset ring-cyan-100/6",
  ].join(" "),

  iconBox: [
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
    "border-cyan-300/38 bg-cyan-300/[0.08] text-cyan-200",
    "ring-1 ring-inset ring-cyan-100/8",
  ].join(" "),

  control: [
    "h-10 rounded-[14px] border px-3 text-sm",
    "border-cyan-300/44",
    "bg-slate-950/52",
    "text-sky-200",
    "placeholder:text-sky-600/72",
    "ring-1 ring-inset ring-cyan-100/8",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    "transition-[border-color,background-color,box-shadow] duration-200",
    "hover:border-cyan-200/68 hover:bg-slate-950/66",
    "focus-visible:outline-none focus-visible:border-cyan-100/88",
    "focus-visible:ring-2 focus-visible:ring-cyan-200/38",
    "focus-visible:shadow-[0_0_24px_rgba(34,211,238,0.12)]",
    "disabled:cursor-not-allowed disabled:opacity-45",
    "motion-reduce:transition-none",
  ].join(" "),

  divider:
    "h-px bg-gradient-to-r from-transparent via-cyan-300/24 to-transparent",

  badge: [
    "inline-flex items-center rounded-full border px-2.5 py-1",
    "text-[10px] font-semibold uppercase tracking-[0.14em]",
    "border-cyan-300/34 bg-cyan-300/[0.08] text-cyan-200/88",
    "ring-1 ring-inset ring-cyan-100/8",
  ].join(" "),

  focusRing: [
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-cyan-200/74",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
  ].join(" "),
} as const;
