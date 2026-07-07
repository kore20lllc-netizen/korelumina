import type {
  KeyboardEventHandler,
  ReactNode,
} from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface NavigationItemProps {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  tooltip?: string;
  compact?: boolean;
  className?: string;
  tabIndex?: number;
  onFocus?: () => void;
  onClick?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
}

export const NavigationItem = forwardRef<
  HTMLButtonElement,
  NavigationItemProps
>(function NavigationItem(
  {
    icon,
    label,
    active = false,
    disabled = false,
    badge,
    tooltip,
    compact = false,
    className,
    tabIndex,
    onFocus,
    onClick,
    onKeyDown,
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      title={tooltip ?? label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      tabIndex={tabIndex}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "group relative flex items-center rounded-xl",
        "transition-all duration-300 ease-fluid active:scale-95",
        "outline-none",
        "focus-visible:ring-2 focus-visible:ring-violet",
        "focus-visible:ring-offset-2",
        "focus-visible:ring-offset-background",
        compact
          ? "h-10 w-10 justify-center"
          : "h-11 w-full gap-3 px-3",
        active
          ? "bg-surface-2 text-foreground ring-1 ring-white/10"
          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {active && (
        <span className="absolute -left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
      )}

      {icon && (
        <span className="flex h-[17px] w-[17px] items-center justify-center">
          {icon}
        </span>
      )}

      {!compact && (
        <span className="flex-1 truncate text-left text-sm">
          {label}
        </span>
      )}

      {!compact && badge && (
        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}

      {compact && badge && (
        <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">
          {badge}
        </span>
      )}

      {compact && (
        <span className="absolute left-full z-50 ml-3 translate-x-1 whitespace-nowrap rounded-lg glass-strong px-2.5 py-1 text-xs opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none">
          {label}
        </span>
      )}
    </button>
  );
});
