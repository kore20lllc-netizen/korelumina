import type { ReactNode } from "react";

interface CanvasSurfaceProps {
  children: ReactNode;
}

export function CanvasSurface({
  children,
}: CanvasSurfaceProps) {
  return (
    <div className="h-full overflow-auto px-6 py-6">
      <div
        className="
          mx-auto
          flex
          min-h-full
          max-w-[1440px]
          flex-col
          gap-5
        "
      >
        {children}
      </div>
    </div>
  );
}
