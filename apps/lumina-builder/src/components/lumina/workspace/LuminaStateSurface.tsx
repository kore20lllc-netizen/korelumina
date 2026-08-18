import type {
  HTMLAttributes,
} from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const stateSurface = cva(
  "rounded-[18px] border p-4",
  {
    variants: {
      tone: {
        healthy:
          "border-emerald-300/14 bg-emerald-300/[0.025] text-emerald-100",
        active:
          "border-cyan-300/14 bg-cyan-300/[0.025] text-cyan-100",
        warning:
          "border-amber-300/14 bg-amber-300/[0.025] text-amber-100",
        error:
          "border-rose-300/14 bg-rose-300/[0.025] text-rose-100",
        neutral:
          "border-slate-300/14 bg-slate-300/[0.025] text-slate-100",
      },
    },

    defaultVariants: {
      tone: "neutral",
    },
  },
);

export interface LuminaStateSurfaceProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stateSurface> {}

export function LuminaStateSurface({
  className,
  tone,
  ...props
}: LuminaStateSurfaceProps) {
  return (
    <div
      className={cn(
        stateSurface({
          tone,
        }),
        className,
      )}
      {...props}
    />
  );
}

export default LuminaStateSurface;
