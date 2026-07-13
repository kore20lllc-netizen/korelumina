import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaWorkspacePanel } from "../LuminaWorkspacePanel";

export interface LuminaInspectorSectionProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function LuminaInspectorSection({
  title,
  subtitle,
  toolbar,
  children,
  className,
}: LuminaInspectorSectionProps) {
  return (
    <LuminaWorkspacePanel
      className={cn(
        "overflow-hidden",
        className,
      )}
      title={title}
      subtitle={subtitle}
      toolbar={toolbar}
    >
      <div className="p-5">
        {children}
      </div>
    </LuminaWorkspacePanel>
  );
}

export default LuminaInspectorSection;
