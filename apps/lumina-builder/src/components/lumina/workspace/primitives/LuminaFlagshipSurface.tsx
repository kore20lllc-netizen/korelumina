import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

interface LuminaFlagshipSurfaceProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  dashed?: boolean;
}

const baseClasses = [
  "rounded-[18px] border",
  "border-blue-400/56",
  "bg-slate-950/34",
  "ring-1 ring-inset ring-cyan-300/14",
  "shadow-[inset_0_1px_0_rgba(186,230,253,0.08),0_0_24px_rgba(37,99,235,0.12),0_16px_38px_rgba(2,6,23,0.30)]",
].join(" ");

export function LuminaFlagshipSurface({
  children,
  dashed = false,
  className,
  ...props
}: LuminaFlagshipSurfaceProps) {
  return (
    <div
      {...props}
      className={cn(
        baseClasses,
        dashed && "border-dashed",
        className,
      )}
    >
      {children}
    </div>
  );
}
