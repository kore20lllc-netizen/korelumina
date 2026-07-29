import {
  useState,
  type ComponentType,
} from "react";

import {
  PauseCircle,
  PlayCircle,
  PowerOff,
  RotateCw,
  Undo2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  LuminaButton,
  type LuminaButtonProps,
} from "@/components/lumina/LuminaButton";

import {
  LuminaInspectorSection,
} from "@/components/lumina/workspace";

import {
  cn,
} from "@/lib/utils";

import type {
  RuntimeAction,
  RuntimeProject,
} from "@/services/runtime/types";

type ButtonVariant = NonNullable<
  LuminaButtonProps["variant"]
>;

interface RuntimeActionDefinition {
  action: RuntimeAction;
  label: string;

  icon: ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;

  variant: ButtonVariant;
  destructive?: boolean;
  confirm?: boolean;
}

const ACTIONS:
  RuntimeActionDefinition[] = [
    {
      action: "restart",
      label: "Restart",
      icon: RotateCw,
      variant: "primary",
    },
    {
      action: "start",
      label: "Start",
      icon: PlayCircle,
      variant: "success",
    },
    {
      action: "drain",
      label: "Drain",
      icon: PauseCircle,
      variant: "warning",
    },
    {
      action: "shutdown",
      label: "Shutdown",
      icon: PowerOff,
      variant: "danger",
      destructive: true,
      confirm: true,
    },
    {
      action: "rollback",
      label: "Rollback",
      icon: Undo2,
      variant: "toolbar",
      confirm: true,
    },
  ];

interface ConfirmationState {
  action: RuntimeAction;
  label: string;
  destructive?: boolean;
}

export interface RuntimeActionsToolbarProps {
  project: RuntimeProject | null;

  pending: Record<
    string,
    boolean
  >;

  onDispatch: (
    action: RuntimeAction,
    projectId: string,
  ) => Promise<void>;

  className?: string;
  compact?: boolean;
}

export function RuntimeActionsToolbar({
  project,
  pending,
  onDispatch,
  className,
  compact = false,
}: RuntimeActionsToolbarProps) {
  const [
    confirmation,
    setConfirmation,
  ] = useState<
    ConfirmationState | null
  >(null);

  const runAction = (
    action: RuntimeAction,
  ) => {
    if (!project) {
      return;
    }

    return onDispatch(
      action,
      project.id,
    );
  };

  return (
    <>
      <LuminaInspectorSection
        className={className}
      >
        <div
          role="toolbar"
          aria-label="Runtime lifecycle actions"
          className="flex flex-wrap items-center gap-2"
        >
          {ACTIONS.map(
            (item) => {
              const Icon =
                item.icon;

              const pendingKey =
                project
                  ? `${project.id}:${item.action}`
                  : "";

              const isPending =
                Boolean(
                  pending[
                    pendingKey
                  ],
                );

              const disabled =
                !project ||
                isPending;

              return (
                <LuminaButton
                  key={
                    item.action
                  }
                  type="button"
                  variant={
                    item.variant
                  }
                  size={
                    compact
                      ? "sm"
                      : "md"
                  }
                  disabled={
                    disabled
                  }
                  aria-label={
                    item.label
                  }
                  aria-busy={
                    isPending
                  }
                  title={
                    item.label
                  }
                  className={cn(
                    "gap-2",
                    isPending &&
                      "animate-pulse",
                    disabled &&
                      "pointer-events-none opacity-60",
                  )}
                  onClick={() => {
                    if (
                      item.confirm
                    ) {
                      setConfirmation({
                        action:
                          item.action,
                        label:
                          item.label,
                        destructive:
                          item.destructive,
                      });

                      return;
                    }

                    void runAction(
                      item.action,
                    );
                  }}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isPending &&
                        "motion-safe:animate-spin",
                    )}
                    strokeWidth={
                      1.75
                    }
                  />

                  {!compact && (
                    <span>
                      {
                        item.label
                      }
                    </span>
                  )}
                </LuminaButton>
              );
            },
          )}
        </div>
      </LuminaInspectorSection>

      <AlertDialog
        open={
          confirmation !==
          null
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setConfirmation(
              null,
            );
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {
                confirmation?.label
              }{" "}
              {project?.name ??
                "runtime"}
              ?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This action affects
              the{" "}
              {project?.env ??
                "selected"}{" "}
              runtime environment.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className={cn(
                confirmation
                  ?.destructive &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              onClick={() => {
                if (
                  confirmation &&
                  project
                ) {
                  void runAction(
                    confirmation.action,
                  );
                }

                setConfirmation(
                  null,
                );
              }}
            >
              {
                confirmation?.label
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default RuntimeActionsToolbar;
