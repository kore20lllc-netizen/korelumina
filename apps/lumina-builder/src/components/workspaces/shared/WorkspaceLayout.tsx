import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface WorkspaceLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function WorkspaceLayout({
  children,
  className,
  fullWidth = false,
}: WorkspaceLayoutProps) {
  return (
    <main
      className={cn(
        "flex h-full flex-col overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "flex-1 overflow-y-auto",
          "px-6 py-6",
          fullWidth
            ? "w-full"
            : "mx-auto w-full max-w-[1800px]",
        )}
      >
        <div className="flex flex-col gap-6">
          {children}
        </div>
      </div>
    </main>
  );
}

export default WorkspaceLayout;
