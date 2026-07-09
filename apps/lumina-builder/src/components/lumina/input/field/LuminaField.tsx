import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface LuminaFieldProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function LuminaField({
  children,
  className,
  ...props
}: LuminaFieldProps) {
  return (
    <div
      className={cn(
        "space-y-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
