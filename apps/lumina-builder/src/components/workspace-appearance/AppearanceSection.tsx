import type { ReactNode } from "react";

interface AppearanceSectionProps {
  title: string;
  children: ReactNode;
}

export function AppearanceSection({
  title,
  children,
}: AppearanceSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>

      <div className="space-y-3">
        {children}
      </div>
    </section>
  );
}
