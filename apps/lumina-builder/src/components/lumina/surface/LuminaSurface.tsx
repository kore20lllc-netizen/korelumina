import type {
  HTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export interface LuminaSurfaceProps
  extends HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "panel"
    | "hero"
    | "sidebar"
    | "toolbar";
}

const variants = {
  default:
    "glass-panel border border-white/8 bg-white/[0.035] backdrop-blur-xl",

  panel:
    "glass-panel rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-32px_rgba(0,0,0,.55)]",

  hero:
    "glass-panel rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-[0_30px_90px_-40px_rgba(0,0,0,.60)]",

  sidebar:
    "glass-panel rounded-3xl border border-white/8 bg-white/[0.03]",

  toolbar:
    "glass-panel rounded-2xl border border-white/8 bg-white/[0.025]",
};

export function LuminaSurface({
  className,
  variant = "panel",
  children,
  ...props
}: LuminaSurfaceProps) {
  return (
    <div
      className={cn(
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
