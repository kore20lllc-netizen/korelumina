import { useState } from "react";
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

import { cn } from "@/lib/utils";

import type {
  RuntimeAction,
  RuntimeProject,
} from "@/services/runtime/types";

const CONFIG: Array<{
  action: RuntimeAction;
  label: string;
  icon: any;
  variant: NonNullable<
    LuminaButtonProps["variant"]
  >;
  destructive?: boolean;
  confirm?: boolean;
}> = [
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

export interface RuntimeActionsToolbarProps {
  project: RuntimeProject | null;
  pending: Record<string, boolean>;
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
  compact,
}: RuntimeActionsToolbarProps) {
  const [
    confirm,
    setConfirm,
  ] = useState<
    | null
    | {
        action: RuntimeAction;
        label: string;
        destructive?: boolean;
      }
  >(null);

  const disabled = !project;

  const run = (
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
          aria-label="Runtime actions"
          className="flex flex-wrap items-center gap-2"
        >
          {CONFIG.map((item) => {
            const Icon = item.icon;

            const pendingKey =
              project
                ? `${project.id}:${item.action}`
                : "";

            const isPending =
              !!pending[pendingKey];

            return (
              <LuminaButton
                key={item.action}
                type="button"
                variant={item.variant}
                size={
                  compact
                    ? "sm"
                    : "md"
                }
                disabled={
                  disabled ||
                  isPending
                }
                aria-label={
                  item.label
                }
                title={
                  item.label
                }
                className={cn(
                  "gap-2 transition-all",
                  isPending &&
                    "animate-pulse",
                  (
                    disabled ||
                    isPending
                  ) &&
                    "pointer-events-none opacity-60",
                )}
                onClick={() => {
                  if (
                    item.confirm
                  ) {
                    setConfirm({
                      action:
                        item.action,
                      label:
                        item.label,
                      destructive:
                        item.destructive,
                    });
                    return;
                  }

                  void run(
                    item.action,
                  );
                }}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isPending &&
                      "animate-spin motion-safe:animate-spin",
                  )}
                  strokeWidth={
                    1.75
                  }
                />

                {!compact && (
                  <span>
                    {item.label}
                  </span>
                )}
              </LuminaButton>
            );
          })}
        </div>
      </LuminaInspectorSection>

      <AlertDialog
        open={!!confirm}
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setConfirm(
              null,
            );
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.label}{" "}
              {project?.name ??
                "service"}
              ?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This action
              affects the{" "}
              {project?.env}
              {" "}
              environment.
              It can be
              resumed later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className={cn(
                confirm?.destructive &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              onClick={() => {
                if (
                  confirm &&
                  project
                ) {
                  void run(
                    confirm.action,
                  );
                }

                setConfirm(
                  null,
                );
              }}
            >
              {confirm?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
