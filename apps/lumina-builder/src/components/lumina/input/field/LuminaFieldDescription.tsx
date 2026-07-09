import type {
  HTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export function LuminaFieldDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
