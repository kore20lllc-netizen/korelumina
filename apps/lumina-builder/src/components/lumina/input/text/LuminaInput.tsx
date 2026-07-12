import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export interface LuminaInputProps
  extends InputHTMLAttributes<HTMLInputElement> {}

export const LuminaInput = forwardRef<
  HTMLInputElement,
  LuminaInputProps
>(function LuminaInput(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl",
        "border border-white/10",
        "bg-white/[0.04]",
        "backdrop-blur-xl",
        "px-3 py-2",
        "text-sm",
        "text-foreground",
        "placeholder:text-muted-foreground",
        "outline-none",
        "transition-all duration-200",
        "focus:border-violet/60",
        "focus:ring-2 focus:ring-violet/25",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export default LuminaInput;
