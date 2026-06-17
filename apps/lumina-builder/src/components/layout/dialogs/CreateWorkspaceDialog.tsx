import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";

type Props = {
  open: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export function CreateWorkspaceDialog({
  open,
  value,
  onValueChange,
  onOpenChange,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace for projects and teams.
          </DialogDescription>
        </DialogHeader>

        <input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Workspace name"
          className="w-full h-11 px-3 rounded-xl bg-surface-1 border border-border"
          autoFocus
        />

        <DialogFooter>
          <LuminaButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </LuminaButton>

          <LuminaButton onClick={onSubmit}>
            Create workspace
          </LuminaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
