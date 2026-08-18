/*
 * Knowledge Operations V3
 * Appearance Tokens
 *
 * Centralized visual language for the workspace.
 * Components should consume these semantic tokens rather
 * than hard-coded Tailwind utility strings.
 */

export const glass = {
  shell:
    "bg-slate-950/58 backdrop-blur-[40px] backdrop-saturate-[155%]",

  hero:
    "bg-slate-950/54 backdrop-blur-[56px] backdrop-saturate-[172%]",

  panel: "bg-slate-950/48 backdrop-blur-[44px] backdrop-saturate-[170%]",

  floating: "bg-slate-950/56 backdrop-blur-[52px] backdrop-saturate-[175%]",

  overlay: "bg-slate-950/48 backdrop-blur-[34px]", 
};

export const border = {
  subtle:
    "border border-white/[0.11]",

  panel:
    "border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20 shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_24px_rgba(37,99,235,.18),inset_0_0_18px_rgba(56,189,248,.05)]",

  hero:
    "border border-blue-400/70 ring-1 ring-inset ring-cyan-200/24 shadow-[0_0_0_1px_rgba(59,130,246,.18),0_0_24px_rgba(37,99,235,.18),0_18px_68px_rgba(2,6,23,.44),0_30px_90px_rgba(14,165,233,.08),inset_0_1px_0_rgba(255,255,255,.08),inset_0_-18px_42px_rgba(37,99,235,.05)]",

  accent:
    "border border-blue-400/75 ring-1 ring-inset ring-cyan-300/20",
};






export const shadow = {
  shell: "shadow-[0_18px_120px_rgba(0,0,0,.34)]",

  panel: "shadow-[0_14px_72px_rgba(0,0,0,.28)]",

  floating: "shadow-[0_18px_96px_rgba(0,0,0,.32)]",

  glowAmber:
    "shadow-[0_0_50px_rgba(248,186,54,.08)]",

  glowCyan:
    "shadow-[0_0_55px_rgba(98,214,255,.08)]",

  glowViolet:
    "shadow-[0_0_60px_rgba(132,88,255,.09)]", 
};

export const radius = {
  shell: "rounded-[32px]",
  panel: "rounded-[28px] overflow-hidden",
  card: "rounded-[22px]",
  floating: "rounded-[18px]",
};

export const gradients = {
  executive:
    "bg-[radial-gradient(circle_at_8%_2%,rgba(124,58,237,.30),transparent_36%),radial-gradient(circle_at_29%_42%,rgba(217,119,6,.17),transparent_27%),radial-gradient(circle_at_74%_64%,rgba(67,56,202,.13),transparent_30%),radial-gradient(circle_at_91%_14%,rgba(34,211,238,.035),transparent_22%),radial-gradient(circle_at_57%_86%,rgba(236,72,153,.075),transparent_18%),linear-gradient(180deg,rgba(255,255,255,.018),transparent_24%,rgba(2,6,23,.10))]",

  canvas:
    "bg-[radial-gradient(circle_at_18%_18%,rgba(67,56,202,.16),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(168,85,247,.16),transparent_26%),radial-gradient(circle_at_62%_82%,rgba(245,158,11,.12),transparent_24%),radial-gradient(circle_at_12%_78%,rgba(6,182,212,.12),transparent_24%)]",
};

export const accent = {
  amber: "text-amber-400",
  cyan: "text-cyan-300",
  blue: "text-blue-300",
  violet: "text-violet-300",
  indigo: "text-indigo-300",
  emerald: "text-emerald-300",
  teal: "text-teal-300",
};

export const iconSurface = {
  amber: "bg-amber-400/10 border-amber-400/20",
  cyan: "bg-cyan-400/10 border-cyan-400/20",
  blue: "bg-blue-400/10 border-blue-400/20",
  violet: "bg-violet-400/10 border-violet-400/20",
  indigo: "bg-indigo-400/10 border-indigo-400/20",
  emerald: "bg-emerald-400/10 border-emerald-400/20",
  teal: "bg-teal-400/10 border-teal-400/20",
};

/**
 * Executive Material System v1
 *
 * Semantic elevations used across Knowledge Operations.
 * This becomes the future Lumina Executive Material contract.
 */


export const lighting = {
  executiveReflection: `
    pointer-events-none
    absolute
    inset-x-[8%]
    top-0
    h-px
    opacity-80
    [background:linear-gradient(
      90deg,
      transparent_0%,
      rgba(96,165,250,.10)_12%,
      rgba(247,215,116,.42)_34%,
      rgba(255,255,255,.58)_50%,
      rgba(125,211,252,.24)_69%,
      rgba(59,130,246,.08)_88%,
      transparent_100%
    )]
    [box-shadow:
      0_0_18px_rgba(125,211,252,.12),
      0_0_34px_rgba(247,215,116,.07)]
  `,
};

export const executiveMaterial = {
  hero: {
    glass: glass.hero,
    border: border.hero,
    shadow: shadow.shell,
    radius: radius.shell,
  },

  primary: {
    glass: glass.panel,
    border: border.panel,
    shadow: shadow.shell,
    radius: radius.panel,
  },

  secondary: {
    glass: glass.panel,
    border: border.subtle,
    shadow: shadow.panel,
    radius: radius.panel,
  },

  tertiary: {
    glass: glass.overlay,
    border: border.subtle,
    shadow: shadow.panel,
    radius: radius.card,
  },

  chip: {
    glass: glass.floating,
    border: border.subtle,
    shadow: shadow.floating,
    radius: radius.floating,
  },
};
