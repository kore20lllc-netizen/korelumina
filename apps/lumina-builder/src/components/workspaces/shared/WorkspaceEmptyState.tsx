import type { ReactNode } from "react";

import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

import { WorkspaceCard } from "./WorkspaceCard";

interface WorkspaceEmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function WorkspaceEmptyState({
  title,
  description,
  action,
  icon,
  className,
}: WorkspaceEmptyStateProps) {
  return (
    <WorkspaceCard
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center p-8 text-center",
        className,
      )}
    >
      <div
        className="
          mb-6
          flex
          h-16
          w-16
          items-center
          justify-center
          [border-radius:var(--lumina-radius-surface)]
          border
          [border-color:var(--lumina-border-standard)]
          [background:var(--lumina-surface-interactive)]
        "
      >
        {icon ?? (
          <Inbox className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <h3 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>

      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </WorkspaceCard>
  );
}

export default WorkspaceEmptyState;
