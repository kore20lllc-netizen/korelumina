import type { ReactNode } from "react";

export interface LuminaInspectorGroupProps {
  title: string;
  children: ReactNode;
}

export function LuminaInspectorGroup({
  title,
  children,
}: LuminaInspectorGroupProps) {
  return (
    <section className="space-y-4 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </h2>

      {children}
    </section>
  );
}
