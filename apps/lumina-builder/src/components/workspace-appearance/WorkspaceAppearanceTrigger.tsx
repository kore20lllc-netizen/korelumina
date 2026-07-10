import { Sparkles } from "lucide-react";

interface WorkspaceAppearanceTriggerProps {
  open: boolean;
  onToggle(): void;
}

export function WorkspaceAppearanceTrigger({
  open,
  onToggle,
}: WorkspaceAppearanceTriggerProps) {
  return (
    <button
      type="button"
      aria-label="Workspace Appearance"
      aria-expanded={open}
      onClick={onToggle}
      className={`
        fixed
        right-6
        top-24
        z-50
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-2xl
        border
        border-white/10
        bg-[rgba(12,14,24,.55)]
        backdrop-blur-xl
        transition-all
        duration-300
        hover:scale-105
        hover:border-white/20
        ${
          open
            ? "opacity-0 pointer-events-none scale-90"
            : "opacity-100 scale-100"
        }
      `}
    >
      <Sparkles
        className="
          h-5
          w-5
          text-amber-300
          drop-shadow-[0_0_10px_rgba(251,191,36,.55)]
        "
      />
    </button>
  );
}
