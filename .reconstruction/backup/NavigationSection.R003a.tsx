import { useState, type ReactNode } from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavigationSectionProps {
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children?: ReactNode;
}

export function NavigationSection({
  title,
  collapsible = false,
  defaultExpanded = true,
  children,
}: NavigationSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className="w-full">
      {title && (
        <button
          type="button"
          disabled={!collapsible}
          onClick={() => {
            if (collapsible) {
              setExpanded((value) => !value);
            }
          }}
          className={cn(
            "flex w-full items-center justify-between",
            "px-3 py-2",
            "text-[11px]",
            "font-semibold",
            "uppercase tracking-[0.12em]",
            "text-muted-foreground",
            collapsible &&
              "cursor-pointer hover:text-foreground transition-colors",
          )}
        >
          <span>{title}</span>

          {collapsible && (
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded ? "rotate-0" : "-rotate-90",
              )}
            />
          )}
        </button>
      )}

      {(expanded || !collapsible) && (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </section>
  );
}
