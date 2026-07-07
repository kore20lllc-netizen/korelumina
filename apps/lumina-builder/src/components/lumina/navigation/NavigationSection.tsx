import {
  useState,
  type ReactNode,
} from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavigationSectionProps {
  title?: string;
  collapsible?: boolean;
  expanded?: boolean;
  collapsed?: boolean;
  defaultExpanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
}

export function NavigationSection({
  title,
  collapsible = false,
  expanded,
  collapsed,
  defaultExpanded = true,
  onToggle,
  children,
}: NavigationSectionProps) {
  const [internalExpanded, setInternalExpanded] =
    useState(defaultExpanded);

  const isControlled =
    expanded !== undefined || collapsed !== undefined;

  const resolvedExpanded =
    expanded ??
    (collapsed !== undefined
      ? !collapsed
      : internalExpanded);

  const canToggle =
    collapsible || onToggle !== undefined;

  const handleToggle = () => {
    if (!canToggle) {
      return;
    }

    onToggle?.();

    if (!isControlled) {
      setInternalExpanded((value) => !value);
    }
  };

  return (
    <section className="w-full">
      {title && (
        <button
          type="button"
          disabled={!canToggle}
          onClick={handleToggle}
          className={cn(
            "flex w-full items-center justify-between",
            "px-3 py-2",
            "text-[11px]",
            "font-semibold",
            "uppercase tracking-[0.12em]",
            "text-muted-foreground",
            canToggle &&
              "cursor-pointer hover:text-foreground transition-colors",
          )}
        >
          <span>{title}</span>

          {canToggle && (
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                resolvedExpanded
                  ? "rotate-0"
                  : "-rotate-90",
              )}
            />
          )}
        </button>
      )}

      {(resolvedExpanded || !canToggle) && (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </section>
  );
}
