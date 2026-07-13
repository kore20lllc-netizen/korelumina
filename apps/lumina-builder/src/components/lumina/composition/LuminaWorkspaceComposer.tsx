import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaWorkspaceComposerProps {
  toolbar?: ReactNode;
  sidebar?: ReactNode;
  content: ReactNode;
  inspector?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceComposer({
  toolbar,
  sidebar,
  content,
  inspector,
  footer,
  className,
}: LuminaWorkspaceComposerProps) {
  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col gap-6",
        className,
      )}
    >
      {toolbar && (
        <div className="shrink-0">
          {toolbar}
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-6">
        {sidebar && (
          <div className="min-h-0 shrink-0">
            {sidebar}
          </div>
        )}

        <main className="min-h-0 flex-1">
          {content}
        </main>

        {inspector && (
          <div className="min-h-0 shrink-0">
            {inspector}
          </div>
        )}
      </div>

      {footer && (
        <div className="shrink-0">
          {footer}
        </div>
      )}
    </section>
  );
}

export default LuminaWorkspaceComposer;
