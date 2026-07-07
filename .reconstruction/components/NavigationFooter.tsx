import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface NavigationFooterProps {
  children?: ReactNode;
  className?: string;
}

export function NavigationFooter({
  children,
  className,
}: NavigationFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border",
        "glass",
        "p-2",
        "shrink-0",
        className,
      )}
    >
      {children}
    </footer>
  );
}
