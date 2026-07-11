import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaSurface } from "@/components/lumina/surface/LuminaSurface";

export interface LuminaInspectorProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function LuminaInspector({
  header,
  footer,
  children,
  className,
}: LuminaInspectorProps) {
  return (
    <LuminaSurface
      variant="panel"
      className={cn(
        "flex h-full w-80 flex-col rounded-3xl overflow-hidden",
        className,
      )}
    >
      {header}

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {footer}
    </LuminaSurface>
  );
}

export default LuminaInspector;
