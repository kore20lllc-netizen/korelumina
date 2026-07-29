import {
  PanelRightOpen,
} from "lucide-react";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaWorkspaceToolbar,
} from "@/components/lumina/workspace";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import type {
  LogEntry,
  RuntimeAction,
  RuntimeProject,
  RuntimeScenario,
} from "@/services/runtime/types";

import {
  RuntimeActionsToolbar,
} from "./RuntimeActionsToolbar";

import {
  RuntimeInspector,
} from "./RuntimeInspector";

export interface RuntimeCommandBarProps {
  project: RuntimeProject | null;

  logs: LogEntry[];

  pending: Record<
    string,
    boolean
  >;

  compact?: boolean;

  inspectorOpen: boolean;

  onInspectorOpenChange: (
    open: boolean,
  ) => void;

  onDispatch: (
    action: RuntimeAction,
    projectId: string,
  ) => Promise<void>;

  onScenario: (
    scenario: RuntimeScenario,
    projectId: string,
  ) => Promise<void>;

  scenarioPending:
    RuntimeScenario | null;
}

export function RuntimeCommandBar({
  project,
  logs,
  pending,
  compact = false,
  inspectorOpen,
  onInspectorOpenChange,
  onDispatch,
  onScenario,
  scenarioPending,
}: RuntimeCommandBarProps) {
  return (
    <LuminaWorkspaceToolbar
      leading={
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {project ? (
            <>
              Selected ·{" "}
              <span className="font-medium text-foreground">
                {project.name}
              </span>
            </>
          ) : (
            "Select a service to see actions and details."
          )}
        </div>
      }
      trailing={
        <>
          <RuntimeActionsToolbar
            project={project}
            pending={pending}
            onDispatch={onDispatch}
            compact={compact}
          />

          <Sheet
            open={inspectorOpen}
            onOpenChange={
              onInspectorOpenChange
            }
          >
            <SheetTrigger asChild>
              <LuminaButton
                type="button"
                variant="ghost"
                size="sm"
                className="text-gold hover:text-gold xl:hidden"
                aria-label="Open runtime inspector"
              >
                <PanelRightOpen className="h-3.5 w-3.5" />

                Inspector
              </LuminaButton>
            </SheetTrigger>

            <SheetContent
              side="right"
              className={[
                "w-full p-0 sm:max-w-[420px]",
                "border-l",
                "[border-color:var(--lumina-border-standard)]",
                "[background:var(--lumina-surface-panel)]",
                "[backdrop-filter:var(--lumina-blur-surface)]",
                "[box-shadow:var(--lumina-shadow-panel)]",
              ].join(" ")}
            >
              <RuntimeInspector
                project={project}
                logs={logs}
                pending={pending}
                onDispatch={onDispatch}
                onScenario={onScenario}
                scenarioPending={
                  scenarioPending
                }
              />
            </SheetContent>
          </Sheet>
        </>
      }
    />
  );
}

export default RuntimeCommandBar;
