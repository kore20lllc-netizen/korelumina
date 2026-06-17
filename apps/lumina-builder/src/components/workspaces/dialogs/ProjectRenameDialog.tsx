import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";

type ProjectSummary = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  project: ProjectSummary | null;
  value: string;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export function ProjectRenameDialog({
  open,
  project,
  value,
  onValueChange,
  onOpenChange,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-md p-0 overflow-hidden">
        <div className="relative p-6 border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-aurora opacity-25" />

          <div className="relative flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-button-lumina grid place-items-center shadow-[0_0_24px_-4px_hsl(var(--violet)/0.7)]">
              <Pencil className="h-5 w-5 text-white" />
            </div>

            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-xl">
                Rename project
              </DialogTitle>

              <DialogDescription className="text-xs mt-0.5">
                {project?.name ?? "Project"} · workspace metadata
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Project name
            </div>

            <input
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              autoFocus
              placeholder="Project name"
              className="w-full h-11 px-3 rounded-xl bg-surface-1 border border-border text-sm outline-none transition focus:border-violet/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSubmit();
                }
              }}
            />
          </div>

          <DialogFooter className="gap-2">
            <LuminaButton
              variant="ghost"
              size="md"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </LuminaButton>

            <LuminaButton
              variant="primary"
              size="md"
              onClick={onSubmit}
            >
              Save changes
            </LuminaButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
