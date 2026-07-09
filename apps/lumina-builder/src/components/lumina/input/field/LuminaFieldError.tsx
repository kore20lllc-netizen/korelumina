import type {
  HTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export function LuminaFieldError({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs text-destructive",
        className,
      )}
      {...props}
    />
  );
}
