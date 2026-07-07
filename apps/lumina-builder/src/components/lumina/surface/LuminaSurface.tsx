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
    "glass-panel",

  panel:
    "glass-panel rounded-3xl",

  hero:
    "glass-panel rounded-[2rem]",

  sidebar:
    "glass-panel rounded-3xl",

  toolbar:
    "glass-panel rounded-2xl",
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
