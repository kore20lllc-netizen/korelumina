import type { ReactNode } from "react";

export interface AppearanceSectionProps {
  title: string;
  children?: ReactNode;
}

export function AppearanceSection({
  title,
  children,
}: AppearanceSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      {children}
    </section>
  );
}
