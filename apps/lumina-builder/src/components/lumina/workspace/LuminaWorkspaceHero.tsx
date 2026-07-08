import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaWorkspaceHeader } from "./LuminaWorkspaceHeader";

export interface LuminaWorkspaceHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceHero({
  eyebrow,
  title,
  subtitle,
  actions,
  metrics,
  className,
}: LuminaWorkspaceHeroProps) {
  return (
    <LuminaWorkspaceHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
      metrics={metrics}
      className={cn(className)}
    />
  );
}

export default LuminaWorkspaceHero;
