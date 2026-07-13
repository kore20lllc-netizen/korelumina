import type { ReactNode } from "react";

export interface LuminaInspectorSectionProps {
  title: string;
  children: ReactNode;
}

export function LuminaInspectorSection({
  title,
  children,
}: LuminaInspectorSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">
        {title}
      </h3>

      {children}
    </div>
  );
}
