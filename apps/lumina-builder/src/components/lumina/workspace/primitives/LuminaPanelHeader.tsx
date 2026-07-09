import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaPanelHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function LuminaPanelHeader({
  title,
  subtitle,
  leading,
  trailing,
  className,
}: LuminaPanelHeaderProps) {
  const hasContent =
    title !== undefined ||
    subtitle !== undefined ||
    leading !== undefined ||
    trailing !== undefined;

  if (!hasContent) {
    return null;
  }

  return (
    <header
      className={cn(
        "flex items-start justify-between gap-4",
        "border-b border-white/10",
        "bg-white/[0.025]",
        "px-5 py-5",
        "backdrop-blur-xl",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {leading}

        {title && (
          <h2 className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
        )}

        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {trailing && (
        <div className="shrink-0">
          {trailing}
        </div>
      )}
    </header>
  );
}

export default LuminaPanelHeader;
