import type {
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface LuminaWorkspaceTab {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface LuminaWorkspaceTabsProps {
  value: string;
  items: LuminaWorkspaceTab[];
  onChange(value: string): void;
  className?: string;
}

export function LuminaWorkspaceTabs({
  value,
  items,
  onChange,
  className,
}: LuminaWorkspaceTabsProps) {
  return (
    <nav
      aria-label="Workspace navigation"
      className={cn(
        "flex items-center gap-2 rounded-2xl",
        className,
      )}
    >
      {items.map((item) => {
        const active =
          item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                onChange(item.value);
              }
            }}
            className={cn(
              "group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl px-4 py-2.5",
              "border transition-all duration-300",
              active
                ? [
                    "[border-color:var(--lumina-border-strong)]",
                    "[background:var(--lumina-surface-interactive)]",
                    "[box-shadow:var(--lumina-shadow-panel)]",
                    "text-foreground",
                  ]
                : [
                    "[border-color:transparent]",
                    "bg-transparent",
                    "text-muted-foreground",
                    "hover:[border-color:var(--lumina-border-standard)]",
                    "hover:[background:var(--lumina-surface-compact)]",
                    "hover:-translate-y-px",
                  ],
              item.disabled &&
                "cursor-not-allowed opacity-50",
            )}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl [background:var(--lumina-highlight-overlay)]"
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              {item.icon}

              <span className="text-sm font-medium">
                {item.label}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default LuminaWorkspaceTabs;
