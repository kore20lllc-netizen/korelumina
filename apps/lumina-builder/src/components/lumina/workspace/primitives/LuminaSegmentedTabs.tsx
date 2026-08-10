import type {
  KeyboardEvent,
  ReactNode,
} from "react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  cn,
} from "@/lib/utils";

export interface LuminaSegmentedTab<
  TabId extends string,
> {
  id: TabId;
  label: string;
  icon?: LucideIcon;
}

interface LuminaSegmentedTabsProps<
  TabId extends string,
> {
  tabs: readonly LuminaSegmentedTab<TabId>[];
  activeTab: TabId;
  ariaLabel: string;
  tabIdPrefix: string;
  panelId: string;
  onChange(tab: TabId): void;
  className?: string;
  children?: ReactNode;
}

const tabBaseClassName = [
  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2",
  "text-[10px] font-semibold",
  "transition-[border-color,background-color,color,box-shadow,transform] duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55",
  "motion-reduce:transition-none",
].join(" ");

const activeTabClassName = [
  "border-cyan-300/42",
  "bg-cyan-300/[0.10]",
  "text-cyan-100",
  "shadow-[0_0_18px_rgba(34,211,238,.09)]",
].join(" ");

const inactiveTabClassName = [
  "border-cyan-300/14",
  "bg-slate-950/24",
  "text-sky-400/72",
  "hover:-translate-y-0.5",
  "hover:border-cyan-300/28",
  "hover:text-sky-100",
].join(" ");

export function LuminaSegmentedTabs<
  TabId extends string,
>({
  tabs,
  activeTab,
  ariaLabel,
  tabIdPrefix,
  panelId,
  onChange,
  className,
  children,
}: LuminaSegmentedTabsProps<TabId>) {
  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tabId: TabId,
  ) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight"
    ) {
      return;
    }

    event.preventDefault();

    const currentIndex =
      tabs.findIndex(
        (candidate) =>
          candidate.id === tabId,
      );

    if (currentIndex < 0) {
      return;
    }

    const direction =
      event.key === "ArrowRight"
        ? 1
        : -1;

    const nextIndex =
      (currentIndex +
        direction +
        tabs.length) %
      tabs.length;

    const nextTab = tabs[nextIndex];

    onChange(nextTab.id);

    requestAnimationFrame(() => {
      document
        .getElementById(
          `${tabIdPrefix}-${nextTab.id}`,
        )
        ?.focus();
    });
  }

  return (
    <>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "flex gap-2 overflow-x-auto",
          className,
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`${tabIdPrefix}-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => {
                onChange(tab.id);
              }}
              onKeyDown={(event) => {
                handleKeyDown(
                  event,
                  tab.id,
                );
              }}
              className={cn(
                tabBaseClassName,
                active
                  ? activeTabClassName
                  : inactiveTabClassName,
              )}
            >
              {Icon ? (
                <Icon className="h-3.5 w-3.5" />
              ) : null}

              {tab.label}
            </button>
          );
        })}
      </div>

      {children}
    </>
  );
}

export default LuminaSegmentedTabs;
