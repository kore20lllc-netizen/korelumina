import { cn } from "@/lib/utils";

export interface WorkspaceTab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  tabs: readonly WorkspaceTab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function WorkspaceTabBar({
  tabs,
  active,
  onChange,
  className,
}: Props) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-2",
        "[border-radius:var(--lumina-radius-surface)]",
        "border",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-card)]",
        "[backdrop-filter:var(--lumina-blur-surface)]",
        "p-2",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected =
          tab.id === active;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() =>
              onChange(tab.id)
            }
            className={cn(
              "[border-radius:var(--lumina-radius-inner)]",
              "px-4 py-2",
              "text-sm font-medium",
              "transition-all duration-200",
              "disabled:opacity-40",

              selected
                ? [
                    "border",
                    "[border-color:var(--lumina-border-emphasis)]",
                    "[background:var(--lumina-surface-selected)]",
                    "[box-shadow:var(--lumina-shadow-selected)]",
                    "text-white",
                  ]
                : [
                    "text-muted-foreground",
                    "hover:[background:var(--lumina-surface-interactive)]",
                    "hover:text-white",
                  ],
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default WorkspaceTabBar;
