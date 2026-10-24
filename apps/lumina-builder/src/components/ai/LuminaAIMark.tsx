import luminaLogo from "@/assets/optimized/lumina.webp";

import { cn } from "@/lib/utils";

import { ThinkingForm } from "../workspaces/executive/shared/ChiefAgentLogo";

/*
 * MS-2026-0011: the KoreLumina AI's face wherever AI speaks or works in
 * the product. At rest it is the KoreLumina mark; while the AI is working
 * it becomes the living Lumina form the Chief Agent thinks with in the
 * Executive Office (same keyed video, same reduced-motion still).
 */
export function LuminaAIMark({
  working = false,
  label = "KoreLumina AI",
  className = "h-7 w-7",
  workingClassName = "h-14 w-14",
}: {
  working?: boolean;
  label?: string;
  className?: string;
  workingClassName?: string;
}) {
  if (working) {
    return (
      <span
        role="img"
        aria-label={`${label} is working`}
        title={`${label} is working`}
        className={cn("relative inline-block shrink-0 drop-shadow-[0_0_14px_rgba(124,58,237,.35)]", workingClassName)}
      >
        <ThinkingForm />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full ring-1 ring-white/15 shadow-[0_0_12px_rgba(34,211,238,.12)]",
        className,
      )}
    >
      <img src={luminaLogo} alt="" draggable={false} className="h-full w-full rounded-full object-cover" />
    </span>
  );
}
