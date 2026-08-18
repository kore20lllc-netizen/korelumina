import type {
  ReactNode,
} from "react";

import type {
  LuminaCompositionPresentation,
} from "./LuminaCompositionSurface";

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
  presentation?: LuminaCompositionPresentation;
}

export function LuminaWorkspaceHero({
  eyebrow,
  title,
  subtitle,
  actions,
  metrics,
  children,
  className,
  presentation = "default",
}: LuminaWorkspaceHeroProps) {
  return (
    <LuminaWorkspaceHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
      metrics={metrics}
      className={className}
      presentation={presentation}
    >
      {children}
    </LuminaWorkspaceHeader>
  );
}

export default LuminaWorkspaceHero;
