import type { ReactNode } from "react";

interface CanvasBottomRegionProps {
  children: ReactNode;
}

export function CanvasBottomRegion({
  children,
}: CanvasBottomRegionProps) {
  return (
    <section
      className="
        grid
        min-h-[220px]
        grid-cols-2
        gap-5
      "
    >
      {children}
    </section>
  );
}
