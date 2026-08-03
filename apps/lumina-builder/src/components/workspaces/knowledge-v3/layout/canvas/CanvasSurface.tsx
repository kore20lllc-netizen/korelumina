import type {
  ReactNode,
} from "react";

import {
  LuminaFlowCanvas,
} from "@/components/design-system/lumina";

interface CanvasSurfaceProps {
  children: ReactNode;
}

export function CanvasSurface({
  children,
}: CanvasSurfaceProps) {
  return (
    <LuminaFlowCanvas>
      {children}
    </LuminaFlowCanvas>
  );
}
