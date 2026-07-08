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
  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className={cn(
          "mx-auto flex max-w-[1600px] flex-col gap-7 px-4 py-8 md:px-10 md:py-12",
          className,
        )}
      >
        {header}

        {metrics}

        {toolbar}

        <div className="grid min-h-[560px] grid-cols-1 gap-5 lg:grid-cols-[minmax(0,330px)_1fr] xl:grid-cols-[minmax(0,330px)_1fr_minmax(0,400px)]">
          {sidebar}

          {content}

          {inspector}
        </div>
      </div>
    </div>
  );
}

export default LuminaWorkspaceLayout;
