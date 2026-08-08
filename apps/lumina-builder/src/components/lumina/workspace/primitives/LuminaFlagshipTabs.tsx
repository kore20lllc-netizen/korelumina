import type {
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

interface LuminaFlagshipTabsProps {
  tabs: string[];
  activeTab: string;
  ariaLabel: string;
  onChange(tab: string): void;
  children: ReactNode;
}

export function LuminaFlagshipTabs({
  tabs,
  activeTab,
  ariaLabel,
  onChange,
  children,
}: LuminaFlagshipTabsProps) {
  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex min-w-max gap-2 overflow-x-auto border-y border-blue-400/48 bg-blue-950/24 px-4 py-3"
      >
        {tabs.map((tab) => {
          const active =
            activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                onChange(tab);
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-xs capitalize",
                "transition-all duration-200 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80",
                active
                  ? [
                      "border-cyan-100/95",
                      "bg-cyan-300/[0.18]",
                      "text-cyan-50",
                      "shadow-[0_0_26px_rgba(34,211,238,0.22)]",
                    ].join(" ")
                  : [
                      "border-blue-400/55",
                      "bg-blue-400/[0.08]",
                      "text-blue-100/72",
                      "hover:-translate-y-0.5",
                      "hover:border-cyan-200/80",
                      "hover:bg-cyan-300/[0.12]",
                      "hover:text-cyan-50",
                      "hover:shadow-[0_0_20px_rgba(34,211,238,0.16)]",
                    ].join(" "),
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {children}
    </div>
  );
}
