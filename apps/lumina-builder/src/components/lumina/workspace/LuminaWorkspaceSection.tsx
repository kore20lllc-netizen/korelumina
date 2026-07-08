import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaWorkspaceSectionProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function LuminaWorkspaceSection({
  title,
  subtitle,
  actions,
  className,
  children,
}: LuminaWorkspaceSectionProps) {
  const hasHeader =
    title !== undefined ||
    subtitle !== undefined ||
    actions !== undefined;

  return (
    <section className={cn("space-y-4", className)}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="shrink-0">
              {actions}
            </div>
          )}
        </header>
      )}

      {children}
    </section>
  );
}

export default LuminaWorkspaceSection;
