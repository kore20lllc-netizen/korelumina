import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

import {
  ChevronDown,
} from "lucide-react";

import {
  cn,
} from "@/lib/utils";

const controlClassName = [
  "h-10 rounded-xl border px-3 text-xs",
  "border-cyan-300/30",
  "bg-slate-950/72",
  "text-sky-200/86",
  "shadow-[inset_0_1px_5px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(186,230,253,0.05)]",
  "outline-none",
  "transition-[border-color,box-shadow,background-color] duration-200",
  "placeholder:text-sky-500/48",
  "hover:border-cyan-200/50",
  "focus-visible:border-cyan-200/70",
  "focus-visible:ring-2 focus-visible:ring-cyan-300/32",
  "motion-reduce:transition-none",
].join(" ");

export function LuminaFlagshipInput(
  props: InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={cn(
        controlClassName,
        props.className,
      )}
    />
  );
}

interface LuminaFlagshipSelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {}

export function LuminaFlagshipSelect({
  children,
  className,
  ...props
}: LuminaFlagshipSelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          controlClassName,
          "pr-10",
          className,
        )}
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/82 drop-shadow-[0_0_10px_rgba(34,211,238,0.18)]" />
    </div>
  );
}

export {
  controlClassName as luminaFlagshipControlClassName,
};
