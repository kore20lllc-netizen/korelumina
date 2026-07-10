import {
  ChevronDown,
  Download,
  Lightbulb,
  RotateCcw,
  X,
} from "lucide-react";

export interface WorkspaceAppearanceHeaderProps {
  onClose(): void;
}

export function WorkspaceAppearanceHeader({
  onClose,
}: WorkspaceAppearanceHeaderProps) {
  return (
    <header className="shrink-0 border-b border-white/10 px-6 py-5">
      <div className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="
              grid
              h-11
              w-11
              shrink-0
              place-items-center
              rounded-2xl
              border
              border-amber-300/25
              bg-amber-300/10
              shadow-[0_0_24px_rgba(251,191,36,.14)]
            "
          >
            <Lightbulb
              aria-hidden
              className="
                h-5
                w-5
                text-amber-300
                drop-shadow-[0_0_10px_rgba(251,191,36,.5)]
              "
            />
          </div>

          <div className="min-w-0">
            <h2
              className="
                truncate
                text-xl
                font-semibold
                tracking-tight
                text-amber-300
                drop-shadow-[0_0_12px_rgba(251,191,36,.3)]
              "
            >
              Workspace Appearance
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Personalize every workspace.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/[0.035]
              px-3
              text-sm
              text-foreground/45
              opacity-70
            "
          >
            Preset
            <ChevronDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled
            aria-label="Reset workspace appearance"
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/[0.035]
              px-3
              text-sm
              text-foreground/45
              opacity-70
            "
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="button"
            disabled
            aria-label="Export workspace appearance"
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/[0.035]
              px-3
              text-sm
              text-foreground/45
              opacity-70
            "
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <button
            type="button"
            aria-label="Close workspace appearance"
            onClick={onClose}
            className="
              grid
              h-10
              w-10
              place-items-center
              rounded-xl
              border
              border-white/15
              bg-white/[0.045]
              text-foreground/75
              transition
              hover:border-white/30
              hover:bg-white/[0.09]
              hover:text-white
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-amber-300/60
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
