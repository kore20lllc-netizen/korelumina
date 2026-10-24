import { tonePill } from "../../executive/shared/ExecutiveSection";

/*
 * MS-2026-0011: the Knowledge Operations materials, sized for a code
 * workspace: the same blue edge, glass and lighting as the command decks,
 * with tighter radii so the editor keeps its room.
 */

export const panelSurface =
  "relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] border border-blue-400/60 ring-1 ring-inset ring-cyan-300/15 bg-slate-950/[0.55] backdrop-blur-[40px] backdrop-saturate-[160%] shadow-[0_0_0_1px_rgba(59,130,246,.12),0_0_24px_rgba(37,99,235,.12),0_20px_80px_rgba(0,0,0,.35)]";

export const panelEyebrow = "text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80";

export const panelReflection =
  "pointer-events-none absolute inset-x-[8%] top-0 h-px opacity-80 [background:linear-gradient(90deg,transparent_0%,rgba(247,215,116,.32)_30%,rgba(255,255,255,.5)_50%,rgba(125,211,252,.24)_70%,transparent_100%)]";

export type PillTone = keyof typeof tonePill;

export function pillButton(tone: PillTone): string {
  return `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 ${tonePill[tone]}`;
}

export const quietButton =
  "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200/80 transition hover:border-cyan-300/30 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40";
