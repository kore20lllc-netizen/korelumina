import type { ReactNode } from "react";

export interface LuminaInspectorControlProps {
  label: string;
  children: ReactNode;
}

export function LuminaInspectorControl({
  label,
  children,
}: LuminaInspectorControlProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}
