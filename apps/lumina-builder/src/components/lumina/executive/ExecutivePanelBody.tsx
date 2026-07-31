import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ExecutivePanelBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "px-8 py-8",
        "space-y-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
