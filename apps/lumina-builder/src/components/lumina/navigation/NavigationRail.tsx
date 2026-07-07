import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface NavigationRailProps {
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}

export function NavigationRail({
  header,
  footer,
  children,
  compact = false,
}: NavigationRailProps) {
  return (
    <aside
      className={cn(
        "glass border-r border-border",
        "flex h-full flex-col",
        "transition-[width] duration-300",
        compact ? "w-16" : "w-64",
      )}
    >
      {header && (
        <header className="shrink-0">
          {header}
        </header>
      )}

      <nav
        className="flex-1 overflow-y-auto px-2 py-3"
        aria-label="Navigation"
      >
        {children}
      </nav>

      {footer && (
        <footer className="shrink-0 border-t border-border">
          {footer}
        </footer>
      )}
    </aside>
  );
}
