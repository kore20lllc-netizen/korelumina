export const flagshipAppearance = {
  eyebrow:
    "text-[10px] font-semibold uppercase tracking-[0.20em] text-cyan-300/82",

  panelMeta:
    "text-[11px] font-medium text-sky-400/72",

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

  canonicalDetailSurface: [
    "rounded-[16px]",
    "p-3",
  ].join(" "),

  canonicalPanelSurface: [
    "rounded-[18px]",
    "p-4",
  ].join(" "),

  iconBox: [
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
    "border-cyan-300/38 bg-cyan-300/[0.08] text-cyan-200",
    "ring-1 ring-inset ring-cyan-100/8",
  ].join(" "),

  segmentedTab: [
    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2",
    "text-[10px] font-semibold",
    "transition-[border-color,background-color,color,box-shadow,transform] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55",
    "motion-reduce:transition-none",
  ].join(" "),

  segmentedTabActive: [
    "border-cyan-300/42",
    "bg-cyan-300/[0.10]",
    "text-cyan-100",
    "shadow-[0_0_18px_rgba(34,211,238,.09)]",
  ].join(" "),

  segmentedTabInactive: [
    "border-cyan-300/14",
    "bg-slate-950/24",
    "text-sky-400/72",
    "hover:-translate-y-0.5",
    "hover:border-cyan-300/28",
    "hover:text-sky-100",
  ].join(" "),

  inspectorMetric: [
    "rounded-[18px] border border-blue-400/48",
    "bg-cyan-300/[0.04]",
    "px-4 py-3",
    "ring-1 ring-inset ring-cyan-300/10",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  ].join(" "),

  inspectorIconButton: [
    "inline-flex h-10 w-10 items-center justify-center rounded-full border",
    "border-blue-400/55",
    "bg-cyan-300/[0.045]",
    "text-cyan-100",
    "ring-1 ring-inset ring-cyan-300/14",
    "transition-[border-color,background-color,box-shadow,transform] duration-200",
    "hover:-translate-y-1 hover:scale-[1.03]",
    "hover:border-cyan-200/72",
    "hover:bg-cyan-300/[0.12]",
    "hover:shadow-[0_0_0_1px_rgba(103,232,249,0.20),0_0_26px_rgba(34,211,238,0.24),0_10px_22px_rgba(2,6,23,0.34)]",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-cyan-300/60",
    "motion-reduce:transition-none",
  ].join(" "),

  inspectorDetailCard: [
    "rounded-[16px] border border-blue-400/48 p-3",
    "ring-1 ring-inset ring-cyan-300/10",
  ].join(" "),

  inspectorDetailTone: {
    cyan:
      "bg-cyan-300/[0.035] text-cyan-100",
    violet:
      "bg-violet-300/[0.035] text-violet-100",
    amber:
      "bg-amber-300/[0.035] text-amber-100",
    emerald:
      "bg-emerald-300/[0.035] text-emerald-100",
    rose:
      "bg-rose-300/[0.035] text-rose-100",
  },

  inspectorEmptyState: [
    "rounded-[16px] border border-dashed",
    "border-cyan-300/12 bg-cyan-300/[0.015]",
    "px-3 py-4 text-center",
    "text-[10px] leading-5 text-sky-500/52",
  ].join(" "),

  inspectorStateTone: {
    queued:
      "border-sky-300/26 bg-sky-300/[0.07] text-sky-100",
    processing:
      "border-cyan-300/28 bg-cyan-300/[0.08] text-cyan-100",
    waiting:
      "border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-violet-300/[0.08] text-violet-100",
    blocked:
      "border-rose-300/30 bg-rose-300/[0.08] text-rose-100",
    failed:
      "border-rose-300/34 bg-rose-300/[0.10] text-rose-100",
    "needs-review":
      "border-amber-300/32 bg-amber-300/[0.09] text-amber-100",
    validated:
      "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100",
    approved:
      "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100",
    published:
      "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100",
    adapted:
      "border-violet-300/30 bg-violet-300/[0.08] text-violet-100",
    consumed:
      "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100",
    superseded:
      "border-slate-300/24 bg-slate-300/[0.06] text-slate-200",
    archived:
      "border-slate-300/20 bg-slate-300/[0.05] text-slate-300",
  },

  inspectorHeader: [
    "border-b border-blue-400/50",
    "ring-1 ring-inset ring-cyan-300/12",
    "bg-[linear-gradient(145deg,rgba(4,14,36,.88),rgba(17,10,46,.84),rgba(4,15,38,.88))]",
    "p-5 sm:p-6",
  ].join(" "),

  inspectorIntegrityBadge: [
    "inline-flex rounded-full border px-3 py-1.5",
    "border-blue-400/60",
    "ring-1 ring-inset ring-cyan-300/16",
    "bg-violet-300/[0.06]",
    "text-[9px] font-semibold uppercase tracking-[0.13em]",
    "text-violet-100",
  ].join(" "),

  inspectorLayerStatusBadge: [
    "rounded-full border px-2.5 py-1",
    "text-[9px] font-semibold uppercase tracking-[0.12em]",
  ].join(" "),

  inspectorLayerStatusTone: {
    validated:
      "border-emerald-300/24 bg-emerald-300/[0.06] text-emerald-100",
    disputed:
      "border-rose-300/24 bg-rose-300/[0.06] text-rose-100",
  },

  capsuleButton: [
    "group relative w-full text-left",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-amber-300/90",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    "focus-visible:shadow-[0_0_24px_rgba(251,191,36,0.22)]",
  ].join(" "),

  capsuleShell: [
    "relative min-h-[112px] overflow-visible rounded-full border bg-gradient-to-r",
    "transition-[transform,box-shadow,border-color] duration-300",
    "group-hover:-translate-y-1",
    "group-hover:shadow-[0_22px_60px_rgba(2,6,23,.48)]",
    "motion-reduce:transition-none",
    "motion-reduce:group-hover:translate-y-0",
  ].join(" "),

  capsuleShellSelected:
    "ring-2 ring-cyan-200/72 shadow-[0_0_34px_rgba(34,211,238,.22)]",

  capsuleShellIdle:
    "ring-1 ring-inset ring-white/8 shadow-[0_16px_48px_rgba(2,6,23,.40)]",

  capsuleResealingBadge: [
    "rounded-full border border-emerald-300/30",
    "bg-emerald-300/8 px-2 py-1",
    "text-[9px] font-semibold uppercase tracking-[0.12em]",
    "text-emerald-200",
  ].join(" "),

  capsuleLayer: [
    "rounded-[14px] border border-blue-400/48 px-3 py-2",
    "ring-1 ring-inset ring-cyan-300/10",
  ].join(" "),

  capsuleLayerTone: {
    failed:
      "bg-rose-300/10",
    warning:
      "bg-amber-300/8",
    healthy:
      "bg-emerald-300/7",
  },

  capsuleLayerLabelTone: {
    failed:
      "text-rose-200",
    warning:
      "text-amber-200",
    healthy:
      "text-emerald-200",
  },

  capsulePeelHalf: [
    "absolute inset-y-0 w-[48%]",
    "border",
    "shadow-[0_0_26px_rgba(251,113,133,.14)]",
  ].join(" "),

  capsulePeelHalfTone: {
    left: [
      "left-0 -translate-x-4 -rotate-6",
      "rounded-l-full rounded-r-[24px]",
      "border-rose-300/44",
      "bg-gradient-to-r from-rose-400/18 to-amber-300/8",
    ].join(" "),
    right: [
      "right-0 translate-x-4 rotate-6",
      "rounded-r-full rounded-l-[24px]",
      "border-amber-300/44",
      "bg-gradient-to-l from-amber-400/18 to-rose-300/8",
    ].join(" "),
  },

  capsuleFilterIcon: [
    "flex h-9 w-9 shrink-0 items-center justify-center",
    "rounded-[13px] border border-blue-400/55",
    "ring-1 ring-inset ring-cyan-300/14",
    "bg-violet-300/[0.07]",
  ].join(" "),

  capsuleFilterSelect: [
    "h-9 min-w-0 rounded-xl border border-blue-400/48",
    "appearance-none",
    "bg-[linear-gradient(145deg,rgba(5,13,34,.98),rgba(11,10,39,.96))]",
    "px-3 pr-8 text-[11px] text-sky-100",
    "outline-none transition-colors [color-scheme:dark]",
    "focus-visible:border-cyan-300/48",
    "focus-visible:ring-2 focus-visible:ring-cyan-300/40",
  ].join(" "),

  capsuleFilterAction: [
    "inline-flex h-9 items-center gap-2 rounded-xl border px-3",
    "ring-1 ring-inset ring-cyan-300/12",
    "text-[11px] font-semibold",
    "transition-[border-color,background-color]",
    "focus-visible:outline-none focus-visible:ring-2",
  ].join(" "),

  capsuleFilterActionTone: {
    advanced: [
      "border-blue-400/52 bg-violet-300/[0.055] text-violet-100",
      "hover:border-violet-300/40 hover:bg-violet-300/[0.09]",
      "focus-visible:ring-violet-300/50",
    ].join(" "),
    clear: [
      "border-blue-400/50 bg-cyan-300/[0.035] text-cyan-200",
      "disabled:cursor-not-allowed disabled:opacity-35",
      "focus-visible:ring-cyan-300/50",
    ].join(" "),
  },

  capsuleFilterPill: [
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
    "border-blue-400/52",
    "ring-1 ring-inset ring-cyan-300/12",
    "bg-violet-300/[0.055]",
    "text-[10px] font-semibold text-violet-100",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-violet-300/50",
  ].join(" "),

  capsuleFlowShell: [
    "overflow-hidden rounded-[30px] border border-blue-400/70",
    "ring-1 ring-inset ring-cyan-300/20",
    "bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(139,92,246,.13),transparent_30%),linear-gradient(135deg,rgba(2,6,23,.82),rgba(12,8,34,.78),rgba(2,10,30,.82))]",
    "shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_24px_rgba(37,99,235,.18),0_28px_90px_rgba(2,6,23,.46),inset_0_0_18px_rgba(56,189,248,.05),inset_0_1px_0_rgba(255,255,255,.06)]",
  ].join(" "),

  capsuleFlowHeader: [
    "border-b border-blue-400/50",
    "ring-1 ring-inset ring-cyan-300/12",
    "p-5 sm:p-6",
  ].join(" "),

  capsuleFlowMetric: [
    "rounded-[18px] border border-blue-400/55",
    "ring-1 ring-inset ring-cyan-300/14",
    "bg-cyan-300/[0.05]",
    "px-4 py-3",
  ].join(" "),

  capsuleFlowCanvas: [
    "relative overflow-hidden rounded-[28px]",
    "border border-blue-400/55",
    "ring-1 ring-inset ring-cyan-300/14",
    "bg-[radial-gradient(circle_at_48%_0%,rgba(34,211,238,.10),transparent_30%),radial-gradient(circle_at_88%_72%,rgba(139,92,246,.10),transparent_32%),linear-gradient(145deg,rgba(3,10,30,.90),rgba(10,8,35,.86),rgba(3,13,34,.90))]",
    "p-4 sm:p-5",
    "shadow-[0_28px_80px_rgba(2,6,23,.42),inset_0_1px_0_rgba(255,255,255,.05)]",
  ].join(" "),

  capsuleFlowZone: [
    "relative overflow-hidden rounded-[24px] border",
    "p-4 sm:p-5",
  ].join(" "),

  capsuleFlowZoneTone: {
    source:
      "border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-cyan-300/[0.025]",
    transformation:
      "border-blue-400/52 ring-1 ring-inset ring-cyan-300/12 bg-violet-300/[0.03]",
    governance:
      "border-amber-300/22 bg-amber-300/[0.025]",
    canonical:
      "border-emerald-300/24 bg-emerald-300/[0.025]",
  },

  capsuleFlowOccupancyBadge: [
    "inline-flex w-fit items-center gap-2 rounded-full border",
    "border-blue-400/55",
    "ring-1 ring-inset ring-cyan-300/14",
    "bg-cyan-300/[0.045]",
    "px-3 py-1.5",
    "text-[10px] font-semibold text-cyan-100",
  ].join(" "),

  capsuleFlowStation: [
    "group relative min-h-[210px] overflow-hidden rounded-[20px] border p-4",
    "border-blue-400/50",
    "ring-1 ring-inset ring-cyan-300/12",
    "bg-[linear-gradient(160deg,rgba(8,19,44,.80),rgba(7,11,29,.72))]",
    "shadow-[inset_0_1px_0_rgba(255,255,255,.045)]",
    "transition-[border-color,box-shadow,transform] duration-200",
    "hover:-translate-y-0.5",
    "hover:border-cyan-300/34",
    "hover:shadow-[0_18px_42px_rgba(2,6,23,.34)]",
    "motion-reduce:transition-none",
  ].join(" "),

  capsuleFlowStationCount: [
    "rounded-full border border-blue-400/48",
    "bg-cyan-300/[0.045]",
    "px-2.5 py-1",
    "text-[9px] font-semibold text-cyan-100",
  ].join(" "),

  capsuleFlowBranch: [
    "relative overflow-hidden rounded-[18px] border border-blue-400/48",
    "ring-1 ring-inset ring-cyan-300/10",
    "p-2.5",
  ].join(" "),

  capsuleFlowBranchTone: {
    remediation:
      "bg-rose-300/[0.055]",
    validated:
      "bg-emerald-300/[0.045]",
  },

  capsuleFlowEmptyStation: [
    "flex min-h-[96px] items-center justify-center",
    "rounded-[16px] border border-dashed",
    "border-cyan-300/12 bg-cyan-300/[0.015]",
    "px-4 text-center",
    "text-[10px] leading-5 text-sky-500/48",
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
