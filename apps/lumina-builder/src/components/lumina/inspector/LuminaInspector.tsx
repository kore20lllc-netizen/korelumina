import type { ReactNode } from "react";

export interface LuminaInspectorProps {
  children: ReactNode;
}

export function LuminaInspector({
  children,
}: LuminaInspectorProps) {
  return (
    <aside className="flex h-full w-80 flex-col rounded-3xl border border-white/10 bg-white/[0.03]">
      {children}
    </aside>
  );
}
