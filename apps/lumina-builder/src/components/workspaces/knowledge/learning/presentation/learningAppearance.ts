export const learningAppearance = {
  panel: [
    "relative overflow-hidden rounded-[28px] border",
    "border-cyan-300/42",
    "bg-slate-950/64",
    "ring-1 ring-inset ring-cyan-300/15",
    "shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_28px_90px_rgba(0,0,0,0.42)]",
    "backdrop-blur-2xl",
  ].join(" "),

  panelStrong: [
    "relative overflow-hidden rounded-[28px] border",
    "border-cyan-200/58",
    "bg-slate-950/70",
    "ring-1 ring-inset ring-cyan-300/20",
    "shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_38px_rgba(34,211,238,0.12),0_34px_110px_rgba(0,0,0,0.48)]",
    "backdrop-blur-2xl",
  ].join(" "),

  card: [
    "group relative overflow-hidden rounded-[20px] border",
    "border-cyan-300/40",
    "bg-[linear-gradient(135deg,rgba(7,20,40,0.78),rgba(16,12,35,0.72),rgba(6,18,32,0.80))]",
    "ring-1 ring-inset ring-cyan-300/10",
    "shadow-[0_0_0_1px_rgba(34,211,238,0.05),inset_0_1px_0_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.24)]",
    "backdrop-blur-xl",
    "transition-[transform,border-color,background-color,box-shadow] duration-200",
    "motion-reduce:transition-none",
  ].join(" "),

  cardInteractive: [
    "hover:-translate-y-1.5",
    "hover:scale-[1.004]",
    "hover:border-cyan-200/85",
    "hover:ring-cyan-200/28",
    "hover:shadow-[0_0_0_1px_rgba(103,232,249,0.18),0_0_42px_rgba(34,211,238,0.24),0_32px_72px_rgba(0,0,0,0.50)]",
    "focus-visible:-translate-y-1",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-cyan-200/85",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-slate-950",
  ].join(" "),

  cardSelected: [
    "-translate-y-0.5",
    "border-cyan-100/95",
    "ring-1 ring-inset ring-cyan-100/35",
    "shadow-[0_0_0_1px_rgba(103,232,249,0.20),0_0_44px_rgba(34,211,238,0.26),0_30px_72px_rgba(0,0,0,0.48)]",
  ].join(" "),

  cardHighlight: [
    "pointer-events-none absolute inset-x-5 top-0 h-px",
    "bg-gradient-to-r from-transparent via-cyan-100/80 to-transparent",
    "opacity-70 transition-opacity duration-200",
    "group-hover:opacity-100",
    "motion-reduce:transition-none",
  ].join(" "),

  header: [
    "border-b border-cyan-300/24",
    "bg-gradient-to-r from-cyan-300/[0.065] via-sky-300/[0.025] to-transparent",
  ].join(" "),

  divider:
    "border-cyan-300/20",

  mutedSurface: [
    "rounded-2xl border",
    "border-cyan-300/34",
    "bg-[linear-gradient(135deg,rgba(7,20,40,0.66),rgba(13,16,34,0.62))]",
    "ring-1 ring-inset ring-cyan-300/08",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  ].join(" "),

  iconBox: [
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
    "border-cyan-200/42",
    "bg-cyan-300/[0.10]",
    "text-cyan-100",
    "shadow-[0_0_22px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]",
  ].join(" "),

  control: [
    "h-10 rounded-xl border",
    "border-cyan-200/55",
    "!bg-slate-950/90",
    "!text-cyan-50",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(34,211,238,0.08)]",
    "placeholder:!text-slate-500",
    "hover:border-cyan-100/75",
    "focus:border-cyan-100/85",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-cyan-300/30",
  ].join(" "),

  eyebrow:
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/78",

  title:
    "text-lg font-semibold tracking-[-0.02em] text-cyan-100",

  sectionTitle:
    "text-sm font-semibold tracking-[-0.01em] text-sky-100",

  description:
    "text-sm leading-6 text-slate-300/72",

  body:
    "text-xs leading-5 text-slate-300/72",

  value:
    "font-medium text-sky-100/90",

  accentValue:
    "font-semibold text-cyan-100",

  warningValue:
    "font-semibold text-amber-200",

  successValue:
    "font-semibold text-emerald-200",
} as const;
