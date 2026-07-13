import type { ReactNode } from "react";

import { LuminaButton } from "@/components/lumina/LuminaButton";
import { LuminaWorkspacePanel } from "./LuminaWorkspacePanel";

export interface LuminaEmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: {
    label: ReactNode;
    onClick: () => void;
  };
}

export function LuminaEmptyState({
  icon,
  title,
  description,
  action,
}: LuminaEmptyStateProps) {
  return (
    <LuminaWorkspacePanel className="min-h-[320px]">
      <div className="flex h-full flex-col items-center justify-center px-8 py-12 text-center">
        {icon && (
          <div className="mb-6">
            {icon}
          </div>
        )}

        <h3 className="text-xl font-semibold">
          {title}
        </h3>

        {description && (
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {action && (
          <div className="mt-8">
            <LuminaButton onClick={action.onClick}>
              {action.label}
            </LuminaButton>
          </div>
        )}
      </div>
    </LuminaWorkspacePanel>
  );
}

export default LuminaEmptyState;
