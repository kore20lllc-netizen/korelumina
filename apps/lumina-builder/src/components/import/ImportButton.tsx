import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * MS-2026-0011 (Imports): the import window's buttons, in the Knowledge
 * Operations materials (the Executive Office's pill buttons).
 */
export function ImportButton({
  variant = "primary",
  onClick,
  disabled,
  className,
  children,
}: {
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
          : "border-white/10 text-white/60 hover:border-white/20 hover:text-white/85",
        className,
      )}
    >
      {children}
    </button>
  );
}
