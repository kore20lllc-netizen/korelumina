import type { ReactNode } from "react";

interface CanvasTopRegionProps {
  children: ReactNode;
}

export function CanvasTopRegion({
  children,
}: CanvasTopRegionProps) {
  return (
    <section
      className="
        grid
        min-h-[560px]
        grid-cols-[220px_minmax(0,1.8fr)_260px]
        gap-6
        items-stretch
      "
    >
      {children}
    </section>
  );
}
