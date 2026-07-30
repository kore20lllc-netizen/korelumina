import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface WorkspaceGridProps
  extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5;
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 lg:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
} as const;

export function WorkspaceGrid({
  columns = 2,
  className,
  children,
  ...props
}: WorkspaceGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columnClasses[columns],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default WorkspaceGrid;
