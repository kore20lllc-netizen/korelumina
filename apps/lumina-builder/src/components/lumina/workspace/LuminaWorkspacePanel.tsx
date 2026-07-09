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
        "glass-panel flex h-full flex-col overflow-hidden rounded-3xl",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
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
        <footer className="border-t border-white/10 p-5">
          {footer}
        </footer>
      )}
    </LuminaSurface>
  );
}

export default LuminaWorkspacePanel;
