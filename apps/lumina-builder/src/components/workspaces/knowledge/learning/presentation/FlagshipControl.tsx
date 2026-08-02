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

import {
  flagshipAppearance,
} from "./flagshipAppearance";

export function FlagshipInput(
  props: InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={cn(
        flagshipAppearance.control,
        props.className,
      )}
    />
  );
}

interface FlagshipSelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {}

export function FlagshipSelect({
  children,
  className,
  ...props
}: FlagshipSelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          flagshipAppearance.control,
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
