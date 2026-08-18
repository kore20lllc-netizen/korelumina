import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface WorkspaceSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function WorkspaceSection({
  title,
  description,
  actions,
  children,
  className,
}: WorkspaceSectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold tracking-tight text-white">
            {title}
          </h2>

          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="shrink-0">
            {actions}
          </div>
        )}
      </header>

      {children}
    </section>
  );
}

export default WorkspaceSection;
