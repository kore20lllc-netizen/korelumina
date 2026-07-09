import * as React from "react";

import { cn } from "@/lib/utils";

export interface LuminaToggleProps {
  checked: boolean;
  disabled?: boolean;
  className?: string;

  onCheckedChange(
    checked: boolean,
  ): void;
}

export function LuminaToggle({
  checked,
  disabled = false,
  className,
  onCheckedChange,
}: LuminaToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onCheckedChange(!checked);
        }
      }}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked
          ? "bg-violet"
          : "bg-white/15",
        disabled &&
          "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white transition-transform",
          checked
            ? "translate-x-5"
            : "translate-x-0.5",
        )}
      />
    </button>
  );
}
