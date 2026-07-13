import type {
  ReactNode,
} from "react";

import {
  LuminaWorkspaceHeader,
} from "./LuminaWorkspaceHeader";

export interface LuminaWorkspaceHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceHero({
  eyebrow,
  title,
  subtitle,
  actions,
  metrics,
  children,
  className,
}: LuminaWorkspaceHeroProps) {
  return (
    <LuminaWorkspaceHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
      metrics={metrics}
      className={className}
    >
      {children}
    </LuminaWorkspaceHeader>
  );
}

export default LuminaWorkspaceHero;
