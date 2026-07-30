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
        "rounded-2xl border border-white/10",
        "bg-white/[0.04] backdrop-blur-xl",
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
              "rounded-xl px-4 py-2",
              "text-sm font-medium",
              "transition-all duration-200",
              "disabled:opacity-40",
              selected
                ? [
                    "bg-white/10",
                    "border border-violet-400/20",
                    "text-white",
                    "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
                  ]
                : [
                    "text-muted-foreground",
                    "hover:bg-white/5",
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
