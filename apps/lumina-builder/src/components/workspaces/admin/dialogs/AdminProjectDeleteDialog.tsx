import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";

type Props = {
  open: boolean;
  project: {
    id: string;
    name: string;
  } | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function AdminProjectDeleteDialog({
  open,
  project,
  deleting,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-md p-0 overflow-hidden">
        <div className="relative p-6 border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/10" />

          <div className="relative flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-rose-500 grid place-items-center">
              <Trash2 className="h-5 w-5 text-white" />
            </div>

            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-xl">
                Delete project
              </DialogTitle>

              <DialogDescription className="text-xs mt-0.5">
                This action cannot be undone
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-border bg-surface-1 p-4">
            <div className="font-medium">
              {project?.name ?? "Project"}
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              Permanently removes this project from the workspace.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <LuminaButton
              variant="ghost"
              size="md"
              disabled={deleting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </LuminaButton>

            <LuminaButton
              size="md"
              disabled={deleting}
              onClick={onConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete project"}
            </LuminaButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
