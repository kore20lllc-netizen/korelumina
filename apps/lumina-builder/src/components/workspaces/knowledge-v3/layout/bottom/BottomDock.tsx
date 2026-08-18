import type { ReactNode } from "react";

interface BottomDockProps {
  activity: ReactNode;
  inspector: ReactNode;
}

export function BottomDock({
  activity,
  inspector,
}: BottomDockProps) {
  return (
    <section
      className="
        relative
        grid
        gap-6
        rounded-3xl
        border
        border-white/10
        bg-black/20
        p-6
        backdrop-blur-xl
        lg:grid-cols-[minmax(0,1fr)_420px]
      "
    >
      <section className="min-h-[280px]">
        {activity}
      </section>

      <aside className="min-h-[280px]">
        {inspector}
      </aside>
    </section>
  );
}
