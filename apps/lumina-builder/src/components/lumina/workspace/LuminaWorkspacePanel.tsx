import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaSurface } from "@/components/lumina/surface/LuminaSurface";

export interface LuminaWorkspacePanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function LuminaWorkspacePanel({
  title,
  subtitle,
  toolbar,
  footer,
  className,
  children,
}: LuminaWorkspacePanelProps) {
  const hasHeader =
    title !== undefined ||
    subtitle !== undefined ||
    toolbar !== undefined;

  return (
    <LuminaSurface
      variant="panel"
      className={cn(
        "flex h-full flex-col overflow-hidden",
        className,
      )}
    >
      {hasHeader && (
        <header
          className={cn(
            "flex items-start justify-between gap-4",
            "border-b",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-compact)]",
            "[backdrop-filter:var(--lumina-blur-surface)]",
            "p-5",
          )}
        >
          <div className="min-w-0 flex-1">
            {title && (
              <div className="text-lg font-semibold">
                {title}
              </div>
            )}

            {subtitle && (
              <div className="mt-1 text-sm text-muted-foreground">
                {subtitle}
              </div>
            )}
          </div>

          {toolbar && (
            <div className="shrink-0">
              {toolbar}
            </div>
          )}
        </header>
      )}

      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {footer && (
        <footer
          className={cn(
            "border-t p-5",
            "[border-color:var(--lumina-border-standard)]",
          )}
        >
          {footer}
        </footer>
      )}
    </LuminaSurface>
  );
}

export default LuminaWorkspacePanel;
