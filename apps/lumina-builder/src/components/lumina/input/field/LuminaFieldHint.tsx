import type {
  HTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export function LuminaFieldHint({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs italic text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
