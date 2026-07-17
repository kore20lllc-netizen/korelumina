import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaWorkspaceLayoutProps {
  header?: ReactNode;
  metrics?: ReactNode;
  toolbar?: ReactNode;
  sidebar?: ReactNode;
  content: ReactNode;
  inspector?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceLayout({
  header,
  metrics,
  toolbar,
  sidebar,
  content,
  inspector,
  className,
}: LuminaWorkspaceLayoutProps) {
  const hasSidebar =
    sidebar !== undefined &&
    sidebar !== null;

  const hasInspector =
    inspector !== undefined &&
    inspector !== null;

  const layoutClass = hasSidebar
    ? hasInspector
      ? "grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_400px]"
      : "grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]"
    : hasInspector
      ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px]"
      : "grid-cols-1";

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className={cn(
          "mx-auto flex max-w-[1800px] flex-col gap-7 px-4 py-8 md:px-8 xl:px-10",
          className,
        )}
      >
        {header}

        {metrics}

        {toolbar}

        <div
          className={cn(
            "grid min-h-[560px] gap-6",
            layoutClass,
          )}
        >
          {hasSidebar && sidebar}

          <main className="min-w-0">
            {content}
          </main>

          {hasInspector && (
            <aside className="min-w-0 xl:w-[400px]">
              {inspector}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default LuminaWorkspaceLayout;
